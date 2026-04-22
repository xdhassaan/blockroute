# Architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ Presentation                                                      │
│   React 19 + Vite + TypeScript + TailwindCSS                      │
│   - pages: Dashboard, RegisterProduct, Timeline, Scan, Analytics  │
│   - components: NavBar, RoleGate, StateBadge, Address             │
└────────────────────────────┬─────────────────────────────────────┘
                             │ React hooks
┌────────────────────────────┴─────────────────────────────────────┐
│ DApp glue                                                         │
│   wagmi v2 (React hooks for contract reads/writes)                │
│   viem v2 (low-level RPC + signature primitives)                  │
│   RainbowKit (wallet connect modal)                               │
│   @tanstack/react-query (caching layer wagmi sits on)             │
└────────────────────────────┬─────────────────────────────────────┘
                             │ JSON-RPC (eth_call, eth_sendRawTx)
┌────────────────────────────┴─────────────────────────────────────┐
│ Network                                                           │
│   localhost  : Hardhat node, chainId 31337                        │
│   sepolia    : Sepolia testnet, chainId 11155111                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ EVM
┌────────────────────────────┴─────────────────────────────────────┐
│ Smart contract                                                    │
│   SupplyChain.sol (Solidity 0.8.26, EVM cancun, optimizer 200)    │
│   - OpenZeppelin AccessControl  (role gating)                     │
│   - OpenZeppelin ECDSA          (signature recovery)              │
│   - Custom errors, indexed events, append-only history            │
└──────────────────────────────────────────────────────────────────┘
```

## Why these choices

- **Hardhat** over Foundry: the team is comfortable with TypeScript, and Hardhat's TS test
  ergonomics + typechain bindings cut iteration time on a 2-day deadline.
- **wagmi + viem** over raw ethers: hooks compose cleanly with React Query for caching;
  type-safe ABI inference avoids string typos in contract calls.
- **RainbowKit** over a hand-rolled connect modal: covers MetaMask, WalletConnect, Coinbase,
  Rabby, etc. with one component — important for the live demo across multiple wallets.
- **OpenZeppelin AccessControl** over a custom role mapping: well-audited, dev-friendly,
  exposes standard `RoleGranted` / `RoleRevoked` events for off-chain monitoring.
- **bytes32 metadata CID** over storing IPFS strings: gas-efficient and lets us re-use the
  same field whether or not the team integrates a real pinning service.

## Data flow — example: distributor receives a shipment

1. **User action**: distributor opens `/product/1` in their browser, sees "Confirm receipt".
2. **Frontend** calls wagmi's `useWriteContract` with `receiveAsDistributor(productId, location, signature)`.
3. **MetaMask** prompts the user, signs and broadcasts the transaction.
4. **EVM** executes:
   - `onlyRole(DISTRIBUTOR_ROLE)` passes
   - `_requireProduct` confirms id exists
   - `_requireOwner` confirms `currentOwner == msg.sender`
   - `_requireTransition(ShippedToDistributor → ReceivedByDistributor)` passes
   - if `signature.length > 0`, `_verifyReceipt` recovers the signer and equality-checks against `manufacturer`
   - `state` updated, `HistoryEntry` pushed, `StateChanged` event emitted
5. **Frontend** detects the new block via React Query / wagmi block watcher, refetches
   `getProduct` + `getHistory`, updates the timeline view.

## Why on-chain history (not events alone)

Events are great for off-chain consumers but cannot be read from another contract and rely
on archive nodes for full history. We store the lifecycle on-chain so anyone reading the
contract can verify the full chain of custody without trusting an indexer. Events
duplicate the same data with `indexed` filters for fast off-chain queries — best of both.
