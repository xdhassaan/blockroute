import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SupplyChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

enum State {
  Manufactured,
  ShippedToDistributor,
  ReceivedByDistributor,
  ShippedToRetailer,
  ReceivedByRetailer,
  Sold,
}

describe("SupplyChain", () => {
  async function deployFixture() {
    const [admin, manufacturer, distributor, retailer, outsider] = await ethers.getSigners();

    const SupplyChainFactory = await ethers.getContractFactory("SupplyChain");
    const supplyChain = (await SupplyChainFactory.deploy()) as SupplyChain;
    await supplyChain.waitForDeployment();

    await supplyChain.connect(admin).grantRole(await supplyChain.MANUFACTURER_ROLE(), manufacturer.address);
    await supplyChain.connect(admin).grantRole(await supplyChain.DISTRIBUTOR_ROLE(),  distributor.address);
    await supplyChain.connect(admin).grantRole(await supplyChain.RETAILER_ROLE(),     retailer.address);

    return { supplyChain, admin, manufacturer, distributor, retailer, outsider };
  }

  async function signReceipt(
    supplyChain: SupplyChain,
    signer: HardhatEthersSigner,
    productId: bigint,
    receiver: string,
    nonce: bigint,
    context: string,
  ): Promise<string> {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const address = await supplyChain.getAddress();
    const inner = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256", "address", "uint256", "string"],
        [chainId, address, productId, receiver, nonce, context],
      ),
    );
    // signMessage on a 32-byte Uint8Array applies the EIP-191 prefix server-side.
    return signer.signMessage(ethers.getBytes(inner));
  }

  // ------------------------------------------------------------------------
  // Deployment & roles
  // ------------------------------------------------------------------------

  describe("Deployment", () => {
    it("grants DEFAULT_ADMIN_ROLE to deployer", async () => {
      const { supplyChain, admin } = await loadFixture(deployFixture);
      expect(await supplyChain.hasRole(await supplyChain.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("starts productCount at zero", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      expect(await supplyChain.productCount()).to.equal(0n);
    });

    it("exposes the expected role identifiers", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      expect(await supplyChain.MANUFACTURER_ROLE()).to.equal(ethers.id("MANUFACTURER_ROLE"));
      expect(await supplyChain.DISTRIBUTOR_ROLE()).to.equal(ethers.id("DISTRIBUTOR_ROLE"));
      expect(await supplyChain.RETAILER_ROLE()).to.equal(ethers.id("RETAILER_ROLE"));
    });
  });

  // ------------------------------------------------------------------------
  // registerProduct
  // ------------------------------------------------------------------------

  describe("registerProduct", () => {
    it("allows a manufacturer to register a product and emits both events", async () => {
      const { supplyChain, manufacturer } = await loadFixture(deployFixture);
      const cid = ethers.keccak256(ethers.toUtf8Bytes("meta:widget-v1"));
      const tx = await supplyChain.connect(manufacturer).registerProduct("Widget", "LOT-1", cid, "Factory-A");

      await expect(tx)
        .to.emit(supplyChain, "ProductRegistered")
        .withArgs(1n, manufacturer.address, "Widget", "LOT-1", cid);
      await expect(tx).to.emit(supplyChain, "StateChanged");

      const product = await supplyChain.getProduct(1n);
      expect(product.name).to.equal("Widget");
      expect(product.manufacturer).to.equal(manufacturer.address);
      expect(product.currentOwner).to.equal(manufacturer.address);
      expect(product.state).to.equal(State.Manufactured);
      expect(await supplyChain.productCount()).to.equal(1n);
    });

    it("rejects callers without MANUFACTURER_ROLE", async () => {
      const { supplyChain, outsider } = await loadFixture(deployFixture);
      await expect(
        supplyChain.connect(outsider).registerProduct("X", "L", ethers.ZeroHash, "nowhere"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });

    it("seeds history with the Manufactured entry", async () => {
      const { supplyChain, manufacturer } = await loadFixture(deployFixture);
      await supplyChain.connect(manufacturer).registerProduct("X", "L", ethers.ZeroHash, "origin");
      const history = await supplyChain.getHistory(1n);
      expect(history).to.have.length(1);
      expect(history[0].state).to.equal(State.Manufactured);
      expect(history[0].location).to.equal("origin");
      expect(history[0].actor).to.equal(manufacturer.address);
    });

    it("assigns monotonically increasing IDs", async () => {
      const { supplyChain, manufacturer } = await loadFixture(deployFixture);
      await supplyChain.connect(manufacturer).registerProduct("A", "L1", ethers.ZeroHash, "x");
      await supplyChain.connect(manufacturer).registerProduct("B", "L2", ethers.ZeroHash, "x");
      expect((await supplyChain.getProduct(1n)).name).to.equal("A");
      expect((await supplyChain.getProduct(2n)).name).to.equal("B");
      expect(await supplyChain.productCount()).to.equal(2n);
    });
  });

  // ------------------------------------------------------------------------
  // shipToDistributor
  // ------------------------------------------------------------------------

  describe("shipToDistributor", () => {
    async function mkProduct() {
      const f = await loadFixture(deployFixture);
      await f.supplyChain.connect(f.manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory-A");
      return f;
    }

    it("transitions to ShippedToDistributor and transfers ownership", async () => {
      const { supplyChain, manufacturer, distributor } = await mkProduct();
      await expect(
        supplyChain.connect(manufacturer).shipToDistributor(1n, distributor.address, "Truck-5"),
      ).to.emit(supplyChain, "StateChanged");

      const p = await supplyChain.getProduct(1n);
      expect(p.state).to.equal(State.ShippedToDistributor);
      expect(p.currentOwner).to.equal(distributor.address);
      expect(await supplyChain.shipNonce(1n)).to.equal(1n);
    });

    it("rejects non-manufacturer callers", async () => {
      const { supplyChain, distributor, outsider } = await mkProduct();
      await expect(
        supplyChain.connect(outsider).shipToDistributor(1n, distributor.address, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });

    it("rejects shipping to a non-distributor recipient", async () => {
      const { supplyChain, manufacturer, outsider } = await mkProduct();
      await expect(
        supplyChain.connect(manufacturer).shipToDistributor(1n, outsider.address, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });

    it("rejects the zero address", async () => {
      const { supplyChain, manufacturer } = await mkProduct();
      await expect(
        supplyChain.connect(manufacturer).shipToDistributor(1n, ethers.ZeroAddress, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "ZeroAddress");
    });

    it("rejects unknown product IDs", async () => {
      const { supplyChain, manufacturer, distributor } = await mkProduct();
      await expect(
        supplyChain.connect(manufacturer).shipToDistributor(999n, distributor.address, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "ProductNotFound");
    });

    it("rejects when caller is not the current owner", async () => {
      const { supplyChain, admin, manufacturer, distributor } = await mkProduct();
      // Grant a second manufacturer role to admin so role check passes — ownership check should still fail.
      await supplyChain.connect(admin).grantRole(await supplyChain.MANUFACTURER_ROLE(), admin.address);
      await expect(
        supplyChain.connect(admin).shipToDistributor(1n, distributor.address, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "NotCurrentOwner");
    });
  });

  // ------------------------------------------------------------------------
  // receiveAsDistributor (+ signature variant)
  // ------------------------------------------------------------------------

  describe("receiveAsDistributor", () => {
    async function shipped() {
      const f = await loadFixture(deployFixture);
      await f.supplyChain.connect(f.manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");
      await f.supplyChain.connect(f.manufacturer).shipToDistributor(1n, f.distributor.address, "Truck");
      return f;
    }

    it("accepts a receipt with no signature", async () => {
      const { supplyChain, distributor } = await shipped();
      await supplyChain.connect(distributor).receiveAsDistributor(1n, "DC-1", "0x");
      const p = await supplyChain.getProduct(1n);
      expect(p.state).to.equal(State.ReceivedByDistributor);
    });

    it("accepts a valid ECDSA signature from the manufacturer", async () => {
      const { supplyChain, manufacturer, distributor } = await shipped();
      const sig = await signReceipt(supplyChain, manufacturer, 1n, distributor.address, 1n, "RECEIVE_FROM_MFG");
      await expect(supplyChain.connect(distributor).receiveAsDistributor(1n, "DC-1", sig))
        .to.emit(supplyChain, "StateChanged");
    });

    it("rejects a signature from the wrong signer", async () => {
      const { supplyChain, distributor, outsider } = await shipped();
      const sig = await signReceipt(supplyChain, outsider, 1n, distributor.address, 1n, "RECEIVE_FROM_MFG");
      await expect(
        supplyChain.connect(distributor).receiveAsDistributor(1n, "DC-1", sig),
      ).to.be.revertedWithCustomError(supplyChain, "InvalidSignature");
    });

    it("rejects a signature with the wrong nonce (replay protection)", async () => {
      const { supplyChain, manufacturer, distributor } = await shipped();
      const badSig = await signReceipt(supplyChain, manufacturer, 1n, distributor.address, 2n, "RECEIVE_FROM_MFG");
      await expect(
        supplyChain.connect(distributor).receiveAsDistributor(1n, "DC-1", badSig),
      ).to.be.revertedWithCustomError(supplyChain, "InvalidSignature");
    });

    it("rejects callers without DISTRIBUTOR_ROLE", async () => {
      const { supplyChain, outsider } = await shipped();
      await expect(
        supplyChain.connect(outsider).receiveAsDistributor(1n, "x", "0x"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });

    it("rejects if called before shipping", async () => {
      const f = await loadFixture(deployFixture);
      await f.supplyChain.connect(f.manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");
      await expect(
        f.supplyChain.connect(f.distributor).receiveAsDistributor(1n, "x", "0x"),
      ).to.be.revertedWithCustomError(f.supplyChain, "NotCurrentOwner");
    });
  });

  // ------------------------------------------------------------------------
  // shipToRetailer & receiveAsRetailer
  // ------------------------------------------------------------------------

  describe("shipToRetailer / receiveAsRetailer", () => {
    async function atDistributor() {
      const f = await loadFixture(deployFixture);
      await f.supplyChain.connect(f.manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");
      await f.supplyChain.connect(f.manufacturer).shipToDistributor(1n, f.distributor.address, "Truck");
      await f.supplyChain.connect(f.distributor).receiveAsDistributor(1n, "DC", "0x");
      return f;
    }

    it("ships from distributor to retailer and transfers ownership", async () => {
      const { supplyChain, distributor, retailer } = await atDistributor();
      await supplyChain.connect(distributor).shipToRetailer(1n, retailer.address, "Van-7");
      const p = await supplyChain.getProduct(1n);
      expect(p.state).to.equal(State.ShippedToRetailer);
      expect(p.currentOwner).to.equal(retailer.address);
    });

    it("retailer receives with a valid signature from the distributor", async () => {
      const { supplyChain, distributor, retailer } = await atDistributor();
      await supplyChain.connect(distributor).shipToRetailer(1n, retailer.address, "Van");
      const sig = await signReceipt(supplyChain, distributor, 1n, retailer.address, 2n, "RECEIVE_FROM_DIST");
      await supplyChain.connect(retailer).receiveAsRetailer(1n, "Store", sig);
      const p = await supplyChain.getProduct(1n);
      expect(p.state).to.equal(State.ReceivedByRetailer);
    });

    it("rejects shipping to a non-retailer", async () => {
      const { supplyChain, distributor, outsider } = await atDistributor();
      await expect(
        supplyChain.connect(distributor).shipToRetailer(1n, outsider.address, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });

    it("rejects retailer receiving before shipping", async () => {
      const { supplyChain, retailer } = await atDistributor();
      await expect(
        supplyChain.connect(retailer).receiveAsRetailer(1n, "x", "0x"),
      ).to.be.revertedWithCustomError(supplyChain, "NotCurrentOwner");
    });
  });

  // ------------------------------------------------------------------------
  // markSold
  // ------------------------------------------------------------------------

  describe("markSold", () => {
    async function atRetailer() {
      const f = await loadFixture(deployFixture);
      await f.supplyChain.connect(f.manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");
      await f.supplyChain.connect(f.manufacturer).shipToDistributor(1n, f.distributor.address, "Truck");
      await f.supplyChain.connect(f.distributor).receiveAsDistributor(1n, "DC", "0x");
      await f.supplyChain.connect(f.distributor).shipToRetailer(1n, f.retailer.address, "Van");
      await f.supplyChain.connect(f.retailer).receiveAsRetailer(1n, "Store", "0x");
      return f;
    }

    it("retailer sells the product", async () => {
      const { supplyChain, retailer } = await atRetailer();
      await supplyChain.connect(retailer).markSold(1n, "Store");
      expect((await supplyChain.getProduct(1n)).state).to.equal(State.Sold);
    });

    it("rejects a second sale (terminal state)", async () => {
      const { supplyChain, retailer } = await atRetailer();
      await supplyChain.connect(retailer).markSold(1n, "Store");
      await expect(
        supplyChain.connect(retailer).markSold(1n, "Store"),
      ).to.be.revertedWithCustomError(supplyChain, "InvalidTransition");
    });

    it("rejects non-retailer callers", async () => {
      const { supplyChain, outsider } = await atRetailer();
      await expect(
        supplyChain.connect(outsider).markSold(1n, "x"),
      ).to.be.revertedWithCustomError(supplyChain, "AccessControlUnauthorizedAccount");
    });
  });

  // ------------------------------------------------------------------------
  // Full lifecycle + history immutability
  // ------------------------------------------------------------------------

  describe("Full lifecycle", () => {
    it("walks a product through every state and records 6 history entries", async () => {
      const { supplyChain, manufacturer, distributor, retailer } = await loadFixture(deployFixture);
      await supplyChain.connect(manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");
      await supplyChain.connect(manufacturer).shipToDistributor(1n, distributor.address, "Truck");
      await supplyChain.connect(distributor).receiveAsDistributor(1n, "DC", "0x");
      await supplyChain.connect(distributor).shipToRetailer(1n, retailer.address, "Van");
      await supplyChain.connect(retailer).receiveAsRetailer(1n, "Store", "0x");
      await supplyChain.connect(retailer).markSold(1n, "Store");

      const history = await supplyChain.getHistory(1n);
      expect(history).to.have.length(6);
      expect(history.map(h => Number(h.state))).to.deep.equal([0, 1, 2, 3, 4, 5]);
    });

    it("every invalid transition reverts", async () => {
      const { supplyChain, manufacturer, distributor, retailer } = await loadFixture(deployFixture);
      await supplyChain.connect(manufacturer).registerProduct("Widget", "L1", ethers.ZeroHash, "Factory");

      // Try to skip to retailer receive: blocked by role check (outsider would fail role; retailer fails ownership).
      await expect(
        supplyChain.connect(retailer).receiveAsRetailer(1n, "x", "0x"),
      ).to.be.revertedWithCustomError(supplyChain, "NotCurrentOwner");

      // Double-register a stateChange: ship, then try to ship again.
      await supplyChain.connect(manufacturer).shipToDistributor(1n, distributor.address, "Truck");
      await expect(
        supplyChain.connect(manufacturer).shipToDistributor(1n, distributor.address, "Truck"),
      ).to.be.revertedWithCustomError(supplyChain, "NotCurrentOwner");
    });
  });

  // ------------------------------------------------------------------------
  // View functions
  // ------------------------------------------------------------------------

  describe("Views", () => {
    it("getProduct reverts for unknown IDs", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      await expect(supplyChain.getProduct(42n)).to.be.revertedWithCustomError(supplyChain, "ProductNotFound");
    });

    it("getHistory reverts for unknown IDs", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      await expect(supplyChain.getHistory(42n)).to.be.revertedWithCustomError(supplyChain, "ProductNotFound");
    });

    it("shipNonce reverts for unknown IDs", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      await expect(supplyChain.shipNonce(42n)).to.be.revertedWithCustomError(supplyChain, "ProductNotFound");
    });

    it("receiptDigest is deterministic for the same inputs", async () => {
      const { supplyChain } = await loadFixture(deployFixture);
      const a = await supplyChain.receiptDigest(1n, ethers.ZeroAddress, 1n, "X");
      const b = await supplyChain.receiptDigest(1n, ethers.ZeroAddress, 1n, "X");
      expect(a).to.equal(b);
    });
  });
});
