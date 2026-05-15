# SupplyChain DApp — No-Wallet Demo Guide

> **Zero MetaMask. Zero funded accounts. Zero testnet ETH.**
> Everything runs on a local Hardhat node with 20 pre-funded accounts (10,000 ETH each).
> The browser shows the UI in read-only mode. A terminal script drives all blockchain writes.

---

## How This Works

| Layer | What it does | Wallet needed? |
|-------|-------------|----------------|
| Browser (read pages) | Reads contract state via RPC directly | ❌ No |
| Browser (action buttons) | Would normally send transactions | Not shown in this demo |
| Terminal scripts | Send transactions using Hardhat's built-in signers | ❌ No |

The frontend connects to `localhost:8545` for all reads. No wallet is required to view
the Dashboard, Timelines, or Analytics. When you need to write (register a product,
ship, receive, sell), you run a Hardhat script in the terminal instead of clicking a
button — and the browser **updates automatically** as each transaction lands.

---

## Services Running

| Service | URL / Command | Status |
|---------|--------------|--------|
| Hardhat node | `http://localhost:8545` | Must be running |
| React frontend | `http://localhost:5173` | Must be running |
| Contract | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | Deployed |

---

## One-Time Setup (do this once before each presentation)

Open **three terminal windows** in the project root:

### Terminal 1 — Hardhat Node (keep open forever)
```bash
cd "Blockchain Project"
npx hardhat node
```
Leave this running. You'll see blocks being mined as transactions arrive.
The 20 pre-funded accounts and their private keys are printed here.

### Terminal 2 — Seed + Scripts (your demo terminal)
```bash
# Deploy contract (fresh address each restart)
npx hardhat run scripts/deploy.ts --network localhost

# Seed 3 demo products
npx hardhat run scripts/seedProducts.ts --network localhost

# Verify everything is on-chain
npx hardhat run scripts/inspect.ts --network localhost
```

### Terminal 3 — Frontend
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Pre-Seeded Products (ready when you open the browser)

| ID | Name | State | Purpose |
|----|------|-------|---------|
| #1 | Organic Coffee Beans | **Sold** | Full 6-entry timeline to show complete history |
| #2 | Pharmaceutical Vials | **ShippedToDistributor** | Shows mid-journey state |
| #3 | Smart Sensor Module | **Manufactured** | Shows starting state |

These are already on-chain. No wallet needed to view them.

---

## Browser-Only Demo (read-only, no wallet at all)

Open `http://localhost:5173` — **do not connect a wallet**.

### Stop 1 — Dashboard (`/`)
```
http://localhost:5173/
```
- All 3 products are visible immediately, no wallet connected
- Each shows its current state badge (Sold / ShippedToDistributor / Manufactured)
- Explains: "This is a public blockchain — anyone can read the state. No account needed."

### Stop 2 — Fully Sold Timeline (`/product/1`)
```
http://localhost:5173/product/1
```
- Shows all **6 history entries** — the complete chain of custody
- Each entry has: state, timestamp, location, actor address
- Explains: "This is immutable. Entry 1 was written when the product was registered.
  Entry 6 was written when it was sold. Nothing in between can be changed or deleted."

### Stop 3 — In-Transit Timeline (`/product/2`)
```
http://localhost:5173/product/2
```
- Shows **2 entries** — manufactured and shipped
- State badge shows "ShippedToDistributor" — product is currently with the distributor
- Explains: "The current owner on-chain is the distributor's address. Only they can
  call receiveAsDistributor. Nobody else can act on this product, not even the manufacturer."

### Stop 4 — Just Manufactured (`/product/3`)
```
http://localhost:5173/product/3
```
- Shows **1 entry** — just registered
- Explains: "Product just created. It hasn't left the manufacturer yet."

### Stop 5 — Analytics (`/analytics`)
```
http://localhost:5173/analytics
```
- Shows state distribution: 1 Sold, 1 ShippedToDistributor, 1 Manufactured
- Active manufacturers count, total products
- Explains: "This is derived entirely from on-chain contract reads. No database."

### Stop 6 — QR Scan Page (`/scan`)
```
http://localhost:5173/scan
```
- Shows the camera QR scanner
- On a phone, open `http://<YOUR_IP>:5173/product/1` — it has a QR code
- Or use the manual ID field: type `1` → Enter → navigates to product #1 timeline
- Explains: "A consumer can scan the QR on the packaging and verify provenance from
  their phone. No account, no app, no trust in any single party."

---

## Terminal Demo — Live Lifecycle (the main event)

This is where you show the **blockchain actually working** — live transactions, live state changes.

### Run the interactive demo script

```bash
# Interactive mode — press ENTER between each step (recommended for presentations)
npx hardhat run scripts/live-demo.ts --network localhost

# Auto mode — 3-second delay between steps (good for timed demos)
DEMO_AUTO=1 npx hardhat run scripts/live-demo.ts --network localhost
```

**What happens step by step:**

```
Step 1 — Manufacturer registers "Demo Vaccine Vials"
         → Browser: refresh Dashboard → Product #4 appears
         → Terminal shows: tx hash, gas used

Step 2 — Manufacturer ships to Distributor
         → Browser: /product/4 → 2nd timeline entry appears
         → Terminal shows: currentOwner transferred, nonce = 1

Step 3 — Distributor confirms receipt
         → Browser: /product/4 → 3rd entry
         → Terminal shows: state = ReceivedByDistributor

Step 4 — Distributor ships to Retailer
         → Browser: /product/4 → 4th entry
         → Terminal shows: currentOwner transferred, nonce = 2

Step 5 — Retailer confirms receipt
         → Browser: /product/4 → 5th entry

Step 6 — Retailer marks Sold
         → Browser: /product/4 → 6th entry, state = Sold (terminal)
         → Terminal prints the full 6-entry immutable history
```

After the script finishes:
- Open `http://localhost:5173/product/4` → full timeline
- Open `http://localhost:5173/analytics` → now shows 2 Sold products
- Run `npx hardhat run scripts/inspect.ts --network localhost` → all 4 products printed

---

## Security Demo — Try to Cheat

Run this to show the contract rejects unauthorised actions even if the UI is bypassed:

```bash
npx hardhat run scripts/try-cheat.ts --network localhost
```

What it does (all 4 attempts revert):
1. **Outsider** tries to `markSold` a product they don't own → `AccessControlUnauthorizedAccount`
2. **Wrong role** tries to ship a product → `AccessControlUnauthorizedAccount`
3. **Skip stages** — manufacturer tries to jump straight from Manufactured to Sold → `InvalidTransition`
4. **Receive before ship** — distributor tries to receive a product not yet shipped → `InvalidTransition`

```
Explain: "The contract enforces the rules. There is no UI workaround.
Even if someone writes a script to call the contract directly,
the EVM rejects anything that violates the role or state machine."
```

---

## Inspect On-Chain State at Any Point

```bash
npx hardhat run scripts/inspect.ts --network localhost
```

Prints every product, its manufacturer, current owner, state, and the full history with timestamps and locations. Useful to show after the live demo.

---

## Full Demo Order (Recommended Sequence)

```
1.  Terminal 2  →  inspect.ts          "Here's what's on-chain right now"
2.  Browser     →  /                   "Dashboard — 3 products, no wallet"
3.  Browser     →  /product/1          "Full 6-entry immutable history"
4.  Browser     →  /analytics          "State distribution, live from contract"
5.  Browser     →  /scan               "QR code provenance from a phone"
6.  Terminal 2  →  live-demo.ts        "Watch a product go from birth to sale"
    Browser     →  /product/4          "Refresh after each step — see it update"
7.  Terminal 2  →  try-cheat.ts        "The contract rejects every cheat attempt"
8.  Terminal 2  →  inspect.ts          "Final state — 4 products, 1 just sold"
9.  Browser     →  /analytics          "Now shows 2 Sold"
```

Total: ~8–10 minutes

---

## Resetting for a Fresh Demo

If you want to restart from scratch (e.g., after a practice run):

```bash
# Option A — full reset (restart the node, clears all state)
# Stop the Hardhat node (Ctrl+C in Terminal 1), then:
npx hardhat node                                              # Terminal 1
npx hardhat run scripts/deploy.ts --network localhost        # Terminal 2
npx hardhat run scripts/seedProducts.ts --network localhost  # Terminal 2

# Option B — redeploy without restarting the node (new contract address, keeps running)
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/seedProducts.ts --network localhost
# Frontend auto-picks up the new address from generated/deployment.ts (refresh browser)
```

Option B is faster but the node accumulates old blocks. Option A gives a fully clean state.

---

## The Four Hardhat Accounts Used

These are Hardhat's default test accounts. 10,000 ETH each. No faucet. No MetaMask.

| Role | Address |
|------|---------|
| Admin / Deployer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Manufacturer | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| Distributor | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Retailer | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

All transactions in the scripts are signed by these accounts automatically via Hardhat's signer API.
No private key management. No `.env` file needed for local demo.

---

## Talking Points While Running the Demo

**"Why no MetaMask?"**
> The Hardhat local node provides 20 pre-funded test accounts. Our scripts sign transactions
> using Hardhat's built-in signer API directly. MetaMask is a convenience layer for end users —
> the underlying mechanism (signing + broadcasting a transaction) is identical.

**"Is this the real blockchain?"**
> It's a full EVM running locally. The same Solidity contract, the same opcodes, the same gas
> metering. The only difference is the node is running on our machine instead of Ethereum mainnet,
> and the ETH has no real value.

**"Could you deploy this to mainnet?"**
> Yes — change one line in `hardhat.config.ts` to target mainnet or Sepolia, fund a deployer
> wallet with real ETH, and run the same `deploy.ts` script. The contract code doesn't change.

**"How does the browser update without MetaMask?"**
> The frontend uses wagmi, which polls the RPC node for new blocks. When a new block arrives,
> it re-fetches `getProduct` and `getHistory`. No wallet required for reads — only the node's
> public RPC endpoint.

**"What if someone hacks the script?"**
> The rules are in the contract, not the script. You can send any transaction you like.
> If it violates a role check or a state transition rule, the EVM reverts it. We showed
> this with `try-cheat.ts` — four crafted attacks, four reverts.
