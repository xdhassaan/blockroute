# Sepolia deployment & verification (OPTIONAL)

> **You do not need this to pass or to demo the project.** The course spec only requires a
> Solidity contract on Ethereum with a live demo, which the local Hardhat node satisfies in
> full (with 20 pre-funded test accounts, no faucet, no wallet management). This guide is
> here only if you want the extra polish of a verified Etherscan link in your slides.

This walks the team through deploying `SupplyChain.sol` to the Sepolia testnet,
verifying it on Etherscan, and seeding three demo products. If you do this, do it
**at least 24 hours before the presentation** to dodge faucet throttling and
Etherscan-verification flakiness.

## 0. Prerequisites

You will need:

- **Four Sepolia wallets** (admin, manufacturer, distributor, retailer). Recommended: one
  MetaMask profile per role so you can switch fast during the live demo.
- **Sepolia ETH on each wallet** — at least 0.05 ETH per wallet covers all demo transactions
  with margin.
- **A Sepolia RPC URL** — free options:
  - Alchemy: <https://www.alchemy.com> → create an app, choose Ethereum Sepolia
  - Infura: <https://www.infura.io> → similar
  - dRPC public:  <https://sepolia.drpc.org>  (no signup, may rate-limit)
- **An Etherscan API key** for source verification — free at <https://etherscan.io/myapikey>
  (one key works across mainnet + all testnets in v2 API).

## 1. Faucets

Get Sepolia ETH from any of:

- <https://www.alchemy.com/faucets/ethereum-sepolia>
- <https://faucet.quicknode.com/ethereum/sepolia>
- <https://sepoliafaucet.com>
- <https://www.infura.io/faucet/sepolia>

Most faucets give 0.05–0.5 ETH per claim, throttled per wallet per day. **Claim for all
four wallets at least the day before the demo.**

## 2. Configure `.env`

In the repo root:

```dotenv
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0x...                  # admin wallet's private key
ETHERSCAN_API_KEY=YOUR_KEY

MANUFACTURER_ADDRESS=0x...
DISTRIBUTOR_ADDRESS=0x...
RETAILER_ADDRESS=0x...
```

> **Never commit `.env`.** It's gitignored — keep it that way.

## 3. Deploy

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

You'll see the deployed address printed. It's also written to
`deployments/sepolia.json` and to `frontend/src/generated/deployment.ts` so the
frontend picks it up automatically.

## 4. Verify on Etherscan

```bash
npx hardhat verify --network sepolia <deployed-address>
```

The contract has no constructor arguments, so no arg-list is needed. Wait ~30 seconds
and check `https://sepolia.etherscan.io/address/<address>#code` — you want the green
"Contract Source Code Verified" badge.

If verification fails (rare), retry with the explicit standard-json input:

```bash
npx hardhat verify --network sepolia <address> --force
```

## 5. Seed demo products

`seedProducts.ts` uses the same set of signers, so on Sepolia you need the manufacturer,
distributor, and retailer private keys all loaded as Hardhat accounts. The simplest path:

1. Add all four private keys to `hardhat.config.ts` under `networks.sepolia.accounts`,
2. `npx hardhat run scripts/seedProducts.ts --network sepolia`

Or alternatively skip seeding and walk the demo through the UI live with one fresh
product (more authentic, slightly more risk).

## 6. Frontend against Sepolia

```bash
cd frontend
npm run dev
```

Connect MetaMask, switch to "Sepolia" network. The DApp picks up the address written by
`deploy.ts` automatically.

## 7. Print QR codes for demo

Open `/product/1`, `/product/2`, `/product/3` — each shows its QR code in the top-right.
Right-click → save image, print on paper, bring to the demo. The `/scan` page reads them.

## Common issues

- **"insufficient funds" on a `shipToDistributor` call** — the wallet you're connected to
  doesn't have Sepolia ETH. Switch wallet or top up.
- **Etherscan verify hangs** — service is rate-limited; retry in 60s or use the standard
  `--force` flag.
- **MetaMask shows wrong chain** — switch network to Sepolia (chainId 11155111). The DApp
  reads `SUPPLY_CHAIN_CHAIN_ID` from `frontend/src/generated/deployment.ts`.
