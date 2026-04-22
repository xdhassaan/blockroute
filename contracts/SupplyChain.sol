// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title   SupplyChain
 * @author  CY-326 / CS-411 Blockchain — Semester Project Team
 * @notice  Tracks physical products from manufacturer → distributor → retailer → sold,
 *          enforcing a strict role-based state machine. Every state change is recorded
 *          in an append-only on-chain history and emitted as an indexed event, giving
 *          full transparency and cryptographic immutability. Receipt handoffs are
 *          optionally authenticated by an ECDSA signature from the shipping party,
 *          binding each transfer to the sender's private key.
 *
 * @dev     Uses OpenZeppelin AccessControl for role gating. Pausable and
 *          ReentrancyGuard are intentionally NOT included: the contract holds no
 *          ether, makes no external calls into arbitrary contracts, and performs no
 *          token transfers, so those mitigations would be dead weight.
 */
contract SupplyChain is AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ------------------------------------------------------------------------
    // Roles
    // ------------------------------------------------------------------------

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE     = keccak256("RETAILER_ROLE");

    // ------------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------------

    /// @notice Lifecycle states a product may occupy. Transitions are strictly linear.
    enum State {
        Manufactured,
        ShippedToDistributor,
        ReceivedByDistributor,
        ShippedToRetailer,
        ReceivedByRetailer,
        Sold
    }

    /// @notice Canonical product record. `metadataCID` is an IPFS CID (bytes32 of the raw multihash digest) for off-chain metadata.
    struct Product {
        uint256 id;
        string  name;
        string  batch;
        bytes32 metadataCID;
        address manufacturer;
        address currentOwner;
        State   state;
        uint256 createdAt;
    }

    /// @notice One entry in a product's append-only history.
    struct HistoryEntry {
        State   state;
        address actor;
        uint256 timestamp;
        string  location;
        bytes   signature;
    }

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------

    uint256 private _nextId = 1;

    mapping(uint256 => Product)                     private _products;
    mapping(uint256 => HistoryEntry[])              private _history;
    mapping(uint256 => uint256)                     private _shipNonce;

    // ------------------------------------------------------------------------
    // Events (productId indexed for filtering; actor indexed for per-actor queries)
    // ------------------------------------------------------------------------

    event ProductRegistered(
        uint256 indexed productId,
        address indexed manufacturer,
        string  name,
        string  batch,
        bytes32 metadataCID
    );

    event StateChanged(
        uint256 indexed productId,
        State   newState,
        address indexed actor,
        address indexed counterparty,
        string  location,
        uint256 timestamp
    );

    // ------------------------------------------------------------------------
    // Errors (cheaper than revert strings and self-documenting)
    // ------------------------------------------------------------------------

    error ProductNotFound(uint256 productId);
    error InvalidTransition(State from, State to);
    error NotCurrentOwner(address caller, address owner);
    error InvalidSignature();
    error ZeroAddress();

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------

    /**
     * @notice Deployer is the admin, bootstrapping the role graph. The admin can later
     *         grant MANUFACTURER/DISTRIBUTOR/RETAILER roles and revoke them.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ------------------------------------------------------------------------
    // Write: manufacturer
    // ------------------------------------------------------------------------

    /**
     * @notice Register a new product on-chain. Caller becomes the initial owner and manufacturer of record.
     * @param  name         Human-readable product name.
     * @param  batch        Batch/lot identifier (e.g. "LOT-2026-04-001").
     * @param  metadataCID  bytes32 digest of an IPFS CIDv1 (raw multihash); may be zero to skip off-chain metadata.
     * @param  location    Origin location, logged in the first history entry.
     * @return productId    The newly-minted product ID.
     */
    function registerProduct(
        string calldata name,
        string calldata batch,
        bytes32 metadataCID,
        string calldata location
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256 productId) {
        productId = _nextId++;

        _products[productId] = Product({
            id:           productId,
            name:         name,
            batch:        batch,
            metadataCID:  metadataCID,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            state:        State.Manufactured,
            createdAt:    block.timestamp
        });

        _appendHistory(productId, State.Manufactured, location, bytes(""));

        emit ProductRegistered(productId, msg.sender, name, batch, metadataCID);
        emit StateChanged(productId, State.Manufactured, msg.sender, msg.sender, location, block.timestamp);
    }

    /**
     * @notice Mark a product as shipped to a named distributor. The recipient must hold DISTRIBUTOR_ROLE.
     *         The caller must be the current owner and hold MANUFACTURER_ROLE.
     */
    function shipToDistributor(
        uint256 productId,
        address distributor,
        string calldata location
    ) external onlyRole(MANUFACTURER_ROLE) {
        if (distributor == address(0)) revert ZeroAddress();
        _requireRole(DISTRIBUTOR_ROLE, distributor);

        Product storage p = _requireProduct(productId);
        _requireOwner(p);
        _requireTransition(p.state, State.ShippedToDistributor);

        p.state        = State.ShippedToDistributor;
        p.currentOwner = distributor;
        _shipNonce[productId]++;

        _appendHistory(productId, State.ShippedToDistributor, location, bytes(""));
        emit StateChanged(productId, State.ShippedToDistributor, msg.sender, distributor, location, block.timestamp);
    }

    // ------------------------------------------------------------------------
    // Write: distributor
    // ------------------------------------------------------------------------

    /**
     * @notice Distributor confirms receipt. Optionally supplies an ECDSA signature from the shipper
     *         over `keccak256(productId, distributor, shipNonce, "RECEIVE_FROM_MFG")` as a cryptographic
     *         chain-of-custody proof. Signature may be empty to skip the check.
     */
    function receiveAsDistributor(
        uint256 productId,
        string calldata location,
        bytes calldata signature
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        Product storage p = _requireProduct(productId);
        _requireOwner(p);
        _requireTransition(p.state, State.ReceivedByDistributor);

        if (signature.length != 0) {
            _verifyReceipt(productId, msg.sender, p.manufacturer, "RECEIVE_FROM_MFG", signature);
        }

        p.state = State.ReceivedByDistributor;

        _appendHistory(productId, State.ReceivedByDistributor, location, signature);
        emit StateChanged(productId, State.ReceivedByDistributor, msg.sender, p.manufacturer, location, block.timestamp);
    }

    /// @notice Distributor ships the product onward to a retailer (who must hold RETAILER_ROLE).
    function shipToRetailer(
        uint256 productId,
        address retailer,
        string calldata location
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (retailer == address(0)) revert ZeroAddress();
        _requireRole(RETAILER_ROLE, retailer);

        Product storage p = _requireProduct(productId);
        _requireOwner(p);
        _requireTransition(p.state, State.ShippedToRetailer);

        p.state        = State.ShippedToRetailer;
        p.currentOwner = retailer;
        _shipNonce[productId]++;

        _appendHistory(productId, State.ShippedToRetailer, location, bytes(""));
        emit StateChanged(productId, State.ShippedToRetailer, msg.sender, retailer, location, block.timestamp);
    }

    // ------------------------------------------------------------------------
    // Write: retailer
    // ------------------------------------------------------------------------

    /// @notice Retailer confirms receipt, optionally with an ECDSA signature from the shipping distributor.
    function receiveAsRetailer(
        uint256 productId,
        string calldata location,
        bytes calldata signature
    ) external onlyRole(RETAILER_ROLE) {
        Product storage p = _requireProduct(productId);
        _requireOwner(p);
        _requireTransition(p.state, State.ReceivedByRetailer);

        if (signature.length != 0) {
            address lastShipper = _lastActor(productId);
            _verifyReceipt(productId, msg.sender, lastShipper, "RECEIVE_FROM_DIST", signature);
        }

        p.state = State.ReceivedByRetailer;

        _appendHistory(productId, State.ReceivedByRetailer, location, signature);
        emit StateChanged(productId, State.ReceivedByRetailer, msg.sender, _lastActor(productId), location, block.timestamp);
    }

    /// @notice Final transition — retailer marks the product sold to an end consumer.
    function markSold(uint256 productId, string calldata location) external onlyRole(RETAILER_ROLE) {
        Product storage p = _requireProduct(productId);
        _requireOwner(p);
        _requireTransition(p.state, State.Sold);

        p.state = State.Sold;

        _appendHistory(productId, State.Sold, location, bytes(""));
        emit StateChanged(productId, State.Sold, msg.sender, address(0), location, block.timestamp);
    }

    // ------------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------------

    /// @notice Fetch a product. Reverts if the ID is unknown.
    function getProduct(uint256 productId) external view returns (Product memory) {
        return _requireProductView(productId);
    }

    /// @notice Fetch the full append-only history for a product.
    function getHistory(uint256 productId) external view returns (HistoryEntry[] memory) {
        _requireProductView(productId);
        return _history[productId];
    }

    /// @notice Total products ever registered.
    function productCount() external view returns (uint256) {
        return _nextId - 1;
    }

    /// @notice Current ship nonce for a product — used to construct the message hash off-chain for signing.
    function shipNonce(uint256 productId) external view returns (uint256) {
        _requireProductView(productId);
        return _shipNonce[productId];
    }

    /**
     * @notice Re-compute the digest a shipper must sign, given the receive context.
     * @dev    The same digest is used on both the manufacturer→distributor and distributor→retailer legs;
     *         the `context` parameter distinguishes them to prevent cross-leg replay.
     */
    function receiptDigest(
        uint256 productId,
        address receiver,
        uint256 nonce,
        string calldata context
    ) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), productId, receiver, nonce, context))
            .toEthSignedMessageHash();
    }

    // ------------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------------

    function _requireProduct(uint256 productId) private view returns (Product storage p) {
        p = _products[productId];
        if (p.id == 0) revert ProductNotFound(productId);
    }

    function _requireProductView(uint256 productId) private view returns (Product memory) {
        Product memory p = _products[productId];
        if (p.id == 0) revert ProductNotFound(productId);
        return p;
    }

    function _requireOwner(Product storage p) private view {
        if (p.currentOwner != msg.sender) revert NotCurrentOwner(msg.sender, p.currentOwner);
    }

    function _requireRole(bytes32 role, address account) private view {
        if (!hasRole(role, account)) {
            // Use OZ's own error surface for consistency with AccessControl.
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    function _requireTransition(State from, State to) private pure {
        bool ok = false;
        if      (from == State.Manufactured           && to == State.ShippedToDistributor)  ok = true;
        else if (from == State.ShippedToDistributor   && to == State.ReceivedByDistributor) ok = true;
        else if (from == State.ReceivedByDistributor  && to == State.ShippedToRetailer)     ok = true;
        else if (from == State.ShippedToRetailer      && to == State.ReceivedByRetailer)    ok = true;
        else if (from == State.ReceivedByRetailer     && to == State.Sold)                  ok = true;
        if (!ok) revert InvalidTransition(from, to);
    }

    function _appendHistory(uint256 productId, State state, string calldata location, bytes memory signature) private {
        _history[productId].push(HistoryEntry({
            state:     state,
            actor:     msg.sender,
            timestamp: block.timestamp,
            location:  location,
            signature: signature
        }));
    }

    function _lastActor(uint256 productId) private view returns (address) {
        HistoryEntry[] storage h = _history[productId];
        return h[h.length - 1].actor;
    }

    function _verifyReceipt(
        uint256 productId,
        address receiver,
        address expectedSigner,
        string memory context,
        bytes calldata signature
    ) private view {
        bytes32 digest = keccak256(abi.encode(block.chainid, address(this), productId, receiver, _shipNonce[productId], context))
            .toEthSignedMessageHash();
        address recovered = digest.recover(signature);
        if (recovered != expectedSigner) revert InvalidSignature();
    }
}
