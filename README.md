# SupplyChain DApp

> **CY-326 / CS-411 Blockchain — Semester Project**
> An end-to-end Ethereum supply-chain tracking system: Solidity smart contract + React DApp.
> Tracks a product from manufacturer → distributor → retailer with role-based access, on-chain
> immutable history, ECDSA-signed receipts, and IPFS-style metadata pinning.

---

## Why this project

Physical supply chains depend on ledger entries that any one party can edit, ship-and-deny, or
backdate. The result is counterfeits, lost batches, and disputed handoffs. Putting the lifecycle
on a public blockchain replaces "trust the spreadsheet" with "verify the chain":

- **Transparency** — every state change is a public event with `indexed` filters
- **Immutability** — history is an append-only on-chain array; no actor can rewrite it
- **Role-based access** — only authorised wallets can perform each role's actions
- **Chain of custody** — receipts can be cryptographically signed (ECDSA) by the shipper

---

## Architecture

```
+--------------------+        +-----------------------+         +------------------+
|  React DApp (Vite) | <----> |  wagmi + viem (RPC)   | <-----> |  Sepolia / local |
|  - Dashboard       |        |  - reads & writes     |         |  Hardhat node    |
|  - Register        |        |  - wallet signatures  |         |                  |
|  - Timeline        |        +-----------------------+         |  SupplyChain.sol |
|  - QR Scan         |                                          |  (AccessControl) |
|  - Analytics       |                                          +------------------+
+--------------------+
```

**Repo layout:**

```
contracts/         SupplyChain.sol          — main contract
test/              SupplyChain.test.ts      — 32 tests, 100% line coverage
scripts/           deploy.ts, seedProducts.ts
frontend/          React + Vite + TS + Tailwind + wagmi + RainbowKit
docs/              architecture, state machine, role matrix, security
slides/            presentation deck
demo/              minute-by-minute demo script & backup video instructions
```

---

## Quick start

Prerequisites: Node.js 20+ (Hardhat warns on 25, but works), npm, Git, MetaMask.

```bash
# 1) Install
npm install
cp .env.example .env       # fill in SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY (optional for local)

# 2) Compile + test
npx hardhat compile
npx hardhat test
npx hardhat coverage       # 100% line/function, 92.86% branch

# 3) Local demo (this is the supported demo path — no wallets to fund, no faucet)
npx hardhat node           # leave running in terminal A
npx hardhat run scripts/deploy.ts --network localhost      # terminal B
npx hardhat run scripts/seedProducts.ts --network localhost

# 4) Frontend
cd frontend
npm install
npm run dev                # http://localhost:5173
```

> **The local Hardhat node satisfies every requirement in the spec** — Solidity contract on
> Ethereum, role-based access, transparency (events), immutability (on-chain history), and a
> live demo. Hardhat ships with 20 pre-funded test accounts; no wallet funding required.
>
> Deploying to the Sepolia public testnet is **purely optional polish** for the presentation
> (a verified Etherscan link). If you want to do it, see [`docs/SEPOLIA.md`](docs/SEPOLIA.md).

---

## Roles & state machine

Four roles enforced by OpenZeppelin `AccessControl`:

| Role                | Permissions                                                         |
|---------------------|---------------------------------------------------------------------|
| `DEFAULT_ADMIN_ROLE`| Grants/revokes the three operational roles                          |
| `MANUFACTURER_ROLE` | `registerProduct`, `shipToDistributor`                              |
| `DISTRIBUTOR_ROLE`  | `receiveAsDistributor`, `shipToRetailer`                            |
| `RETAILER_ROLE`     | `receiveAsRetailer`, `markSold`                                     |

Lifecycle (transitions are strictly linear — any out-of-order call reverts):

```
Manufactured → ShippedToDistributor → ReceivedByDistributor
             → ShippedToRetailer    → ReceivedByRetailer  → Sold
```

See [`docs/STATE_MACHINE.md`](docs/STATE_MACHINE.md) for the diagram.

---

## Gas report

Generated with `hardhat-gas-reporter` (Solidity 0.8.26, optimizer runs=200, EVM cancun).

| Method                  | Min     | Max     | Avg     |
|-------------------------|---------|---------|---------|
| `registerProduct`       | 267,281 | 287,757 | 269,666 |
| `shipToDistributor`     | 136,274 | 136,298 | 136,277 |
| `receiveAsDistributor`  | 114,002 | 208,753 | 131,232 |
| `shipToRetailer`        | 119,360 | 119,384 | 119,364 |
| `receiveAsRetailer`     | 112,714 | 209,933 | 132,158 |
| `markSold`              | —       | —       | 111,572 |
| `grantRole`             | 51,518  | 51,530  | 51,527  |

**Deployment:** 1,861,706 gas (3.1% of 60M block limit).

The min/max spread on the receive functions reflects the optional ECDSA signature path
(empty signature ≈ 114k gas; full signature verify ≈ 209k gas).

---

## Test coverage

```
File              |  % Stmts | % Branch |  % Funcs |  % Lines
------------------|----------|----------|----------|----------
SupplyChain.sol   |    100   |   92.86  |    100   |    100
```

32 tests pass, covering: deployment, every role, every transition, every failure path,
ECDSA signature accept/reject/replay, and full lifecycle traversal. Run with
`npx hardhat test` and `npx hardhat coverage`.

---

## Static analysis (Slither)

Slither v0.10+ run as `python -m slither . --filter-paths "node_modules|@openzeppelin"`.
Reports **3 findings on the project contract**, all reviewed and dispositioned:

| # | Severity      | Finding                                                                              | Disposition                                                                                                    |
|---|---------------|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| 1 | Informational | `incorrect-equality` — `_requireProductView` uses `p.id == 0`                        | **Accepted (false positive).** IDs start at 1; `id == 0` is the explicit "not found" sentinel. Not a balance check. |
| 2 | Informational | `timestamp` — comparison flagged in `_requireProductView`                            | **Accepted (false positive).** Slither mis-attributes the `p.id == 0` comparison; no `block.timestamp` is involved here. |
| 3 | Informational | `uninitialized-local` — `_requireTransition.ok`                                      | **Fixed.** Added explicit `bool ok = false;` initialiser.                                                       |

No medium or high findings on `SupplyChain.sol`. Findings inside OpenZeppelin contracts are
out of scope (audited library).

---

## Security notes

**Threat model**

- *Unauthorised actions:* every state-changing function gates on `onlyRole(...)` and an
  `_requireOwner` check ensures the caller currently holds the product. Outsiders, mismatched
  roles, and bystanders are all rejected with custom errors.
- *Replay of receipts:* signed receipts include `chainid`, contract address, productId,
  receiver, an incrementing `_shipNonce`, and a context tag (`RECEIVE_FROM_MFG` /
  `RECEIVE_FROM_DIST`). The same signature cannot be replayed across chains, contracts,
  products, legs, or after the next ship.
- *Front-running of transfers:* a malicious mempool watcher cannot redirect a shipment —
  recipient addresses are bound at the `shipToX(...)` call, and only the named recipient
  can subsequently `receiveAs...`.
- *Lost or compromised role keys:* the admin can revoke any granted role at any time.
  No upgrade path exists, so admin-key compromise cannot rewrite history but it can grant
  new roles. In a production deployment the admin should be a multisig.

**What we deliberately did NOT include, and why**

- **`Pausable`** — the contract makes no external calls and holds no value. There is no
  exploit path to pause; adding it would add gas and an admin foot-gun without benefit.
- **`ReentrancyGuard`** — no `.call`, no token transfers, no ether flows. Re-entrancy is
  structurally impossible.
- **Upgradeability (proxy pattern)** — supply-chain history must be immutable; an
  upgradeable contract can have its logic swapped, undermining that guarantee. If a bug
  is found, deploy a v2 and migrate.
- **On-chain rich querying / indexing** — events are `indexed` so off-chain indexers
  (or the analytics page reading event logs) handle this efficiently.

---

## Stretch features delivered

- **IPFS-style metadata pinning** — frontend hashes off-chain JSON+image, stores the
  bytes32 digest on-chain; optional real pinning to web3.storage when a token is set.
- **QR code lookup** — every product has a generated QR code; the `/scan` page uses the
  device camera to deep-link to that product's timeline.
- **ECDSA signed receipts** — receivers can submit a shipper signature; the contract
  recovers and verifies it against the previous owner. Replay protected by chain id +
  contract + product id + receiver + nonce + context tag.
- **Analytics dashboard** — derives state distribution and top manufacturers from
  contract reads.

---

## Team contributions

| Member | Stream                                                             |
|--------|--------------------------------------------------------------------|
| A      | Smart contract design, NatSpec, Slither hardening, security notes  |
| B      | Hardhat tooling, test suite, coverage, gas report, deployments     |
| C      | React DApp — wallet integration, role gating, timeline, QR, analytics |
| D      | Documentation, slide deck, demo script, presentation rehearsal     |

(Replace with actual member names before submission.)

---

## License

MIT — academic project.
