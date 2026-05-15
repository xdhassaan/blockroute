# SupplyChain DApp — Presentation Script
## CY-326 / CS-411 Blockchain — Semester Project

---

> **Total time:** ~15 minutes slides + 5 minutes live demo + 3 minutes Q&A ≈ 23 minutes
>
> **Division:**
> | Member | Slides | Theme | Time |
> |--------|--------|-------|------|
> | Member A | Slides 1–4 | Introduction, Problem, Solution, Architecture | ~4 min |
> | Member B | Slides 5–8 | Smart Contract, State Machine, Roles, Security | ~4 min |
> | Member C | Slides 9–12 | Frontend DApp, Features, Gas, Testing | ~4 min |
> | Member D | Slides 13–16 + Demo | Stretch Features, Demo, Team, Takeaways | ~4 min + 5 min demo |
>
> **Setup before you begin:**
> - Hardhat node running in terminal A
> - Contract deployed and seeded (`deploy.ts` + `seedProducts.ts`)
> - Frontend running at `http://localhost:5173`
> - MetaMask open with 4 imported accounts (admin, manufacturer, distributor, retailer)
> - Backup demo video open in another tab, paused at 0:00
> - Slides on the projector at slide 1

---

## MEMBER A — Slides 1 through 4
### Theme: Setting the Scene

---

### SLIDE 1 — Title Slide

*[Stand at the front. Click to show slide 1. Pause for 2 seconds while the audience reads the title.]*

"Good [morning/afternoon], everyone.

Today we're presenting our semester project for CY-326 — a system called **SupplyChain DApp**. It's a complete, end-to-end blockchain application for tracking physical products through a supply chain, built on Ethereum using Solidity for the smart contract and React for the frontend.

Before I dive into what we built, let me take thirty seconds to explain *why* this problem is worth solving."

*[Click to advance to Slide 2.]*

---

### SLIDE 2 — The Problem

*[Point to the four cards on the slide.]*

"Physical supply chains today are tracked with spreadsheets, emails, and shared databases — and here's the fundamental problem: **any single party can edit those records**.

A manufacturer can backdate a shipment. A distributor can claim they never received a batch. A retailer can dispute a handoff happened. And there's no way to independently verify the truth, because the ledger itself is mutable and controlled by whoever owns the system.

The consequences are real — counterfeits enter circulation, batches get lost, and disputes end up in court.

*[Point to the bottom callout bar]*

At the root of all of this is one thing: **there is no cryptographic proof of who did what, and when**. We can't audit the chain of custody because there is no chain — just a spreadsheet someone controls.

That's the problem we set out to solve."

*[Click to advance to Slide 3.]*

---

### SLIDE 3 — Our Solution

*[Point to the four numbered pillars.]*

"Our solution puts the entire product lifecycle **on-chain** — on a public Ethereum smart contract where no single party controls the record.

The first pillar is **immutable history**. Every state change is stored in an append-only array on the contract. Nothing is ever deleted or overwritten. Once a handoff is recorded, it's there permanently.

The second is **role-based access control**. Only authorised wallet addresses can perform each action. A distributor can't register a product. A retailer can't ship. The rules are enforced at the EVM level, not in application code that someone could bypass.

The third is **ECDSA signed receipts**. When a product changes hands, the sender can cryptographically sign a receipt. The contract recovers and verifies the signature on-chain — so you have a mathematical proof of who handed over what, to whom, and when.

And the fourth is **public transparency**. Anyone with the contract address can verify the full history of any product, from a browser, without login, without trusting us, without trusting any single party.

*[Pause.]*

The tagline we settled on: **'verify the chain'** — not 'trust the spreadsheet'."

*[Click to advance to Slide 4.]*

---

### SLIDE 4 — System Architecture

*[Point to the three layers on the slide.]*

"Let me show you how the system is structured, because understanding the layers makes everything else easier to follow.

At the top is the **presentation layer** — a React 19 application built with Vite and TypeScript, styled with Tailwind CSS. It has five pages: a dashboard, a product registration form, a timeline view per product, a QR scan page, and an analytics page. My colleagues will go into each of these in detail.

The middle layer is the **DApp glue** — this is what connects the React frontend to the blockchain. We use `wagmi` for React hooks that handle contract reads and writes, `viem` for the low-level Ethereum primitives, and RainbowKit for the wallet connection modal. These tools abstract away the complexity of talking to the EVM from a browser.

At the bottom is the **network** — either a local Hardhat node running on our machine, or the Sepolia public testnet. In both cases, what the frontend is actually talking to is our smart contract: `SupplyChain.sol`.

*[Point to the tech tags at the bottom.]*

The key technologies: Solidity 0.8.26 for the contract, Hardhat 2.28 for the development framework, React 19 for the frontend, and wagmi v2 for blockchain connectivity.

I'll now hand over to [Member B], who will take you into the contract itself."

*[Step aside / sit down. Member B comes forward.]*

---
---

## MEMBER B — Slides 5 through 8
### Theme: The Smart Contract

---

### SLIDE 5 — Smart Contract Overview

*[Click to advance to Slide 5.]*

"Thanks [Member A].

The heart of the whole system is `SupplyChain.sol`. Let me break it down.

*[Point to the left column.]*

We're on Solidity 0.8.26, targeting the Cancun EVM — the latest version at time of writing. The contract inherits from three OpenZeppelin v5 libraries:

`AccessControl` — this gives us the role system. Every role is a `bytes32` hash, and it maintains a mapping of role to address. `onlyRole` is the modifier we use to gate every function.

`ECDSA` — this handles signature recovery. Given a message hash and a 65-byte signature, `ECDSA.recover()` returns the Ethereum address that signed it. That's how we verify chain-of-custody receipts.

`MessageHashUtils` — this prefixes messages with the EIP-191 Ethereum header before hashing, so signatures made by MetaMask are compatible with the contract's verification.

*[Point to the data structures listed.]*

Every product is a struct: ID, name, batch, a `bytes32` metadata hash, the original manufacturer address, the current owner address, the state, and creation timestamp. Every state change is recorded as a `HistoryEntry` — these are stored in append-only arrays, one per product. There's also a ship nonce per product, which I'll explain in a moment.

*[Point to the right column — deployment stats.]*

We deployed locally at this address. The deployment cost just under 1.9 million gas — that's 3.1% of Ethereum's 60 million block gas limit. Compact for the functionality it provides."

*[Click to advance to Slide 6.]*

---

### SLIDE 6 — Product State Machine

*[Point to the state flow boxes.]*

"Every product goes through exactly six states — and this progression is **strictly linear**.

Manufactured. Shipped to Distributor. Received by Distributor. Shipped to Retailer. Received by Retailer. Sold.

*[Point to the role labels below each box.]*

Each transition is tied to exactly one role and one function. `registerProduct` creates the product in 'Manufactured'. `shipToDistributor` moves it to 'ShippedToDistributor'. And so on.

The mechanism that enforces this is a private function called `_requireTransition`. Every state-changing function calls it before doing anything else, passing in the 'from' and 'to' states. If the requested transition doesn't match what's allowed, the transaction reverts immediately with an `InvalidTransition` error.

*[Point to the invariants section.]*

Five invariants the contract guarantees. Let me highlight the important ones:

You **cannot skip steps** — there's no shortcut from 'Manufactured' directly to 'Sold'.

**Sold is terminal** — once a product is sold, no further state changes are possible. The product's history is sealed.

Every transition **appends** one HistoryEntry — it never pops, never overwrites. The history array only grows.

And the ship nonce: every time a product is shipped, the nonce increments. Receipt signatures are bound to that nonce, so a signature from leg one cannot be replayed on leg two."

*[Click to advance to Slide 7.]*

---

### SLIDE 7 — Role-Based Access Control

*[Point to the table.]*

"Four roles. Each is a `bytes32` identifier — specifically the keccak256 hash of the role name string.

`DEFAULT_ADMIN_ROLE` is held by the deployer. It can grant and revoke the three operational roles.

`MANUFACTURER_ROLE` — can register products and ship to a distributor.

`DISTRIBUTOR_ROLE` — can receive from the manufacturer and ship to a retailer.

`RETAILER_ROLE` — can receive from the distributor and mark a product sold.

*[Point to the 'Two-Key Security Gate' box at the bottom.]*

Now, every single state-changing function enforces **two independent checks** — not one.

First, the role check via the `onlyRole` modifier. This rejects anyone who doesn't hold the right role. But that alone isn't enough.

Second, the ownership check — `_requireOwner`. The caller must currently hold the product. This is critical: a manufacturer who shipped a product no longer owns it. Even though they still hold `MANUFACTURER_ROLE`, they cannot act on that product again.

Why does this matter? Consider a compromised manufacturer key. The attacker can't act on products the manufacturer no longer owns. And they can't receive products as a distributor or retailer because they don't have those roles. The blast radius of a key compromise is tightly scoped."

*[Click to advance to Slide 8.]*

---

### SLIDE 8 — Security Features

*[Point to the ECDSA card.]*

"Let me walk through the security architecture.

ECDSA signed receipts — the shipper signs a message before the transfer. The message includes the chain ID, the contract address, the product ID, the receiver's address, the current ship nonce, and a context tag. The context tag is either `'RECEIVE_FROM_MFG'` or `'RECEIVE_FROM_DIST'` — it distinguishes the two legs of the journey.

When the receiver calls `receiveAsDistributor` or `receiveAsRetailer`, the contract reconstructs that exact message, hashes it, and calls `ECDSA.recover` on the provided signature. The recovered address must equal the previous owner's address. If it doesn't — revert.

*[Point to the Replay Protection card.]*

Replay protection: that six-component message is what makes replay attacks impossible. Same signature cannot be used on a different chain, a different deployment, a different product, a different leg, or in a future shipping round. All six components must match.

*[Point to the Intentional Omissions card.]*

We explicitly chose *not* to add three common OpenZeppelin extensions.

No `Pausable` — the contract holds no ether and makes no external calls. There's no exploit path that pausing would stop. Adding it would just create an admin foot-gun.

No `ReentrancyGuard` — re-entrancy requires a `.call` or ether transfer. We have neither. Adding the guard would be misleading — it implies a risk that doesn't exist.

No upgradeable proxy — this one is a philosophical choice. An upgradeable contract means an admin could swap out the logic and potentially rewrite history. That fundamentally undermines what we're building. If there's a bug, you deploy v2 and migrate forward.

I'll hand over now to [Member C], who will show you the frontend."

*[Step aside. Member C comes forward.]*

---
---

## MEMBER C — Slides 9 through 12
### Theme: The Frontend DApp & Quality

---

### SLIDE 9 — Frontend Pages

*[Click to advance to Slide 9.]*

"Thank you [Member B].

So we have this contract — now let's talk about how users actually interact with it. We built a full React DApp with five pages.

*[Walk through the route table row by row.]*

The **Dashboard** at `/` is the landing page. As soon as you connect your wallet, it reads your address, checks which role you hold, and shows you the products you're responsible for — either ones you manufactured or ones you currently own. Each product shows a 'next action' hint based on your role and the product's current state.

`/register` is the **product registration page** — only visible to manufacturers. You fill in the name, batch number, an optional description, and an image. The frontend hashes all of that into a `bytes32` metadata digest, and that digest gets stored on-chain. We'll talk more about how that works in a moment.

`/product/:id` is the **Timeline** page — the centrepiece of the DApp. It shows the product's full immutable history, the current state, and — critically — a role-gated action panel. The action buttons only appear if you hold the right role *and* you're the current owner *and* the product is in the right state. All three conditions must be true simultaneously.

`/scan` opens the device camera and uses the `html5-qrcode` library to read QR codes. Scan any product's QR code, and it auto-navigates to that product's timeline. No typing, no lookup.

And `/analytics` gives a high-level view — state distribution across all products, active manufacturers, total product count.

*[Point to the footer.]*

For wallet connectivity, we use RainbowKit. One component gives us MetaMask, WalletConnect, Coinbase Wallet, and Rabby — all tested and working."

*[Click to advance to Slide 10.]*

---

### SLIDE 10 — IPFS Metadata & QR Codes

*[Point to the left panel — IPFS flow.]*

"Two stretch features I'm particularly proud of — let me walk through how they work under the hood.

The first is IPFS-style metadata pinning. When a manufacturer registers a product, they can upload a product image and fill in a description. That information needs to live somewhere — but storing raw strings and images on Ethereum would be prohibitively expensive.

So what we do: we take all the metadata — name, batch, description, image, timestamp — package it as a JSON object, and hash it with keccak256 client-side. The resulting `bytes32` hash is what gets stored on-chain. The content lives off-chain.

*[Point to the three flow boxes.]*

The hash is tamper-evident — if anyone changes the metadata, the hash won't match. And if you set the `VITE_WEB3_STORAGE_TOKEN` environment variable, the frontend will actually upload to web3.storage and use a real IPFS CID. The on-chain field is the same either way.

*[Point to the right panel — QR flow.]*

The second feature is QR codes. Every product's Timeline page generates a QR code that encodes the URL `/product/{id}`. You can print it, put it on the packaging, and then anyone with a phone can scan it.

*[Point to the 4 numbered steps.]*

The `/scan` page opens the camera, decodes the QR, extracts the product ID, and auto-navigates to the timeline. A consumer can verify the full chain of custody from their phone, without connecting a wallet, without any account. Just the contract address."

*[Click to advance to Slide 11.]*

---

### SLIDE 11 — Gas Report

*[Point to the gas table.]*

"Let's talk about gas costs — how much it actually costs to run each operation on-chain.

`registerProduct` is the most expensive at around 270,000 gas — that's expected, because it initialises a whole new Product struct and writes the first HistoryEntry to storage for the first time.

The subsequent transitions — ship and receive operations — are cheaper, between 110,000 and 136,000 gas, because they update existing storage slots rather than creating new ones.

*[Point to the min/max spread for receiveAsDistributor and receiveAsRetailer.]*

Notice the spread on the two receive functions — 114,000 minimum up to 209,000 maximum. That gap is the ECDSA signature path. An empty signature costs the baseline. A full signature with on-chain verification adds roughly 95,000 gas, because the keccak hash, the `ecrecover` opcode, and storing the signature bytes all add up.

*[Point to the three stat boxes at the bottom.]*

Total deployment: 1.86 million gas — just 3.1% of Ethereum's 60 million block gas limit. And at typical mainnet gas prices, each state change costs roughly 50 cents to two dollars. For a high-volume use case, you'd move to an L2 like Base or Arbitrum and bring that down to fractions of a cent."

*[Click to advance to Slide 12.]*

---

### SLIDE 12 — Test Coverage

*[Point to the four big percentage numbers.]*

"We have 32 tests. 100% statement coverage. 100% function coverage. 100% line coverage. 92.86% branch coverage.

The 7.14% missing on branches is one specific defensive code path — a `try/catch` inside the signature verification for a malformed signature that produces an exception rather than a wrong-signer result. It's there as a safety net, but it's genuinely difficult to trigger deterministically in a test environment.

*[Point to the test categories checklist.]*

The test suite covers every happy path and every failure mode. Every role attempting an action they're not allowed. Every transition attempted out of order. ECDSA — valid signature passes, tampered signature fails, wrong signer fails, and replay of an already-used signature fails. A full lifecycle traversal test that walks one product from Manufactured through all six states to Sold. And view function tests to confirm that `receiptDigest` is deterministic — same inputs always produce the same hash.

*[Pause.]*

Run it yourself: `npx hardhat test` for the tests, `npx hardhat coverage` for the full coverage report.

I'll pass it over to [Member D] to cover the stretch features and the demo."

*[Step aside. Member D comes forward.]*

---
---

## MEMBER D — Slides 13 through 16 + Live Demo
### Theme: Stretch Features, Demo, and Close

---

### SLIDE 13 — Stretch Features Delivered

*[Click to advance to Slide 13.]*

"Thanks [Member C].

The project specification set out the core requirements — Solidity contract, role-based access, transparency, immutability, live demo. We delivered all of that, and then built six additional features on top.

*[Walk through the six cards.]*

**One — IPFS-style metadata pinning.** Already covered by [Member C], but to summarise: product images and descriptions are hashed on-chain, with optional real IPFS pinning.

**Two — QR code per product.** Every product gets a scannable QR linking to its timeline. Consumer-facing provenance verification from a phone.

**Three — ECDSA signed receipts.** Full cryptographic chain-of-custody with six-component replay protection. This goes well beyond what the spec required.

**Four — Analytics dashboard.** Live charts of product state distribution, active manufacturer count, and a top-five manufacturer leaderboard. All derived from on-chain contract reads — no separate database.

**Five — `seedProducts.ts`.** A deployment script that creates three demo products at different lifecycle stages — one sold, one in transit, one just manufactured — so the demo audience immediately has something meaningful to look at.

**Six — `try-cheat.ts`.** A security test script that sends four adversarial transactions — each one should fail. We run it live during the demo to show that the contract enforces its rules even when the UI is bypassed entirely.

All six delivered and working."

*[Click to advance to Slide 14.]*

---

### SLIDE 14 — Demo Flow

*[Point to the timeline steps.]*

"Here's how the demo runs — eight minutes, eight steps.

We already have the Hardhat node running and three seeded products loaded. Here's what we'll show you live:

**Step one:** The frontend is running at localhost. You'll see the Dashboard showing those three pre-seeded products at different stages — one sold, one in transit, one just manufactured. This immediately shows the system in a live state.

**Step two, the architecture slide:** We already covered this. Moving on.

**Step three:** We point to the contract address shown in the DApp's footer. That address matches exactly what was printed when `deploy.ts` ran. The DApp is reading directly from the contract — no middleware, no API layer you have to trust.

**Step four:** We switch MetaMask to the Manufacturer account, navigate to `/register`, fill in a product name, upload an image, and submit. MetaMask pops up, we confirm, and within a few seconds a new product appears — ID 4 — in 'Manufactured' state.

**Step five:** Still as Manufacturer, we open product 4, ship it to the Distributor address, sign the transaction. Then we switch MetaMask to the Distributor account. The Timeline page now shows a 'Confirm receipt' button — because the role gate and ownership check now pass for this wallet. We confirm receipt.

**Step six — the security beat:** We switch MetaMask to the Retailer account and try to perform an action on product 4. No action buttons appear. The UI correctly gates based on role and state. Then — to show the contract enforces this independently of the UI — we run `try-cheat.ts` in the terminal. Four transactions. Four reverts. The contract is the truth, not the interface.

**Step seven:** We scan the QR code printed for product 1 — the fully sold one — on a phone. The phone opens product 1's timeline and shows all six history entries with timestamps and addresses.

**Step eight:** We open `/analytics`, show the state distribution chart, and transition back to the slides.

*[Pause.]*

Let's go ahead and do that now."

*[LIVE DEMO — approximately 5 minutes. Member C drives the browser/MetaMask if possible, since they built the frontend. Member D narrates.]*

---

> **DEMO NARRATION GUIDE** *(speak these lines as you demo)*
>
> - *While showing Dashboard:* "You can see three products here — one sold, one in transit, one just manufactured. Each one shows the current state and who holds it. The role badge up top tells us we're connected as admin right now."
>
> - *While registering product:* "I'm filling in the product name, batch number, uploading a photo. The frontend will hash all of this to a 32-byte digest — that's what goes on-chain. The image itself stays off-chain."
>
> - *While shipping:* "I paste in the distributor's address. The contract will verify that address actually holds DISTRIBUTOR_ROLE before accepting the transaction. You'll see MetaMask pop up now..."
>
> - *While switching to distributor:* "I've switched MetaMask to the distributor account. Same page, different wallet — and now the action panel shows 'Confirm receipt'. The role gate is live."
>
> - *While running try-cheat.ts:* "Now let me bypass the UI entirely. [run script in terminal] Four attempts. Four reverts. The contract doesn't care what interface you use — the rules are in the EVM."
>
> - *While scanning QR:* "This is the QR code for product 1. I'll scan it with my phone now..." [scan] "It opened the timeline automatically — six history entries, every handoff, every timestamp, every address. This is the full chain of custody, readable by anyone."

---

*[Return to slides after demo.]*

*[Click to advance to Slide 15.]*

---

### SLIDE 15 — Team Contributions

*[Point to the four member cards.]*

"Let me briefly walk through who did what.

**[Member A]** led the smart contract design — every line of `SupplyChain.sol`, the NatSpec documentation, the Slither static analysis, and the threat model. The security architecture we described today was their work.

**[Member B]** owned the tooling — the Hardhat configuration, the full 32-test suite, coverage reporting, the gas reporter, and the deployment automation scripts including the one that auto-generates the frontend config from the deployed address.

**[Member C]** built the entire React frontend — the wagmi integration, the role-gated UI, the Timeline page, the QR scan feature, and the analytics dashboard.

**And myself** — I focused on documentation: the four docs files covering architecture, state machine, role matrix, and the Sepolia guide. I wrote the demo script, prepared this slide deck, and coordinated the presentation rehearsal.

*[Pause.]*

Replace these placeholders with our actual names before we submit."

*[Click to advance to Slide 16.]*

---

### SLIDE 16 — Key Takeaways & Thank You

*[Point to the four pillars.]*

"So — what did we actually build and demonstrate today?

**Transparency.** Every state change is a public on-chain event with indexed filters. Anyone with the contract address can verify the full history of any product, forever, without any permission from us.

**Immutability.** The `HistoryEntry` array only grows. No function in the contract deletes or modifies past entries. The record is sealed.

**Role-based access.** OpenZeppelin AccessControl plus our ownership check means the rules are enforced at the EVM level — not in application code, not in a database, not by trusting us. In the EVM.

**Quality.** Thirty-two tests. One hundred percent line coverage. Slither-reviewed. ECDSA receipts with full replay protection. Six stretch features. A complete demo script and a backup video.

*[Point to the tech stack strip.]*

Everything runs on: Solidity, Hardhat, React, wagmi, RainbowKit, TypeScript, and Tailwind.

*[Pause. Look up at the audience.]*

We built a system where 'trust the spreadsheet' becomes 'verify the chain'. Thank you for listening.

We're happy to take questions."

*[All four members stand at the front for Q&A.]*

---
---

## Q&A Talking Points

Keep these ready. Likely questions and short answers:

**"Why Hardhat instead of Foundry?"**
> The team is more comfortable with TypeScript. Hardhat's TypeChain bindings give full autocomplete and type checking for contract calls in tests — that cut iteration time significantly on a tight deadline.

**"Why not deploy on mainnet?"**
> Gas costs — each state change is $0.50–$2 on mainnet at typical prices. For a demo, Hardhat localhost gives us 20 pre-funded accounts and no faucet dependency. Sepolia is optionally supported if you want an Etherscan link.

**"Why no Pausable?"**
> The contract holds no ether and makes no external calls. There's no exploit path that pausing would stop. Adding it would create an admin foot-gun without any security benefit.

**"What happens if a private key is stolen?"**
> The admin revokes that role immediately. Past actions recorded under that key are immutable — they can't be erased — but no further actions can be taken. In a production deployment, the admin should be a multisig (Gnosis Safe) so revoking itself requires multiple signatures.

**"Why store history on-chain instead of just using events?"**
> Other smart contracts can't read events. Archive nodes are required for full event history. On-chain storage is canonical and self-contained — anyone can call `getHistory(id)` and get the complete record without trusting an indexer.

**"What about gas costs at scale?"**
> For a high-volume supply chain, you'd deploy on an L2 (Base, Arbitrum, Optimism) where the same transactions cost fractions of a cent. The contract is network-agnostic — you'd just change the `hardhat.config.ts` target.

**"Is the ECDSA signature mandatory?"**
> No — empty bytes skips verification. We made it optional for demo flexibility. In a production deployment you'd make it mandatory and require the shipper to sign before handing off.

**"Can a product go backwards?"**
> No. `_requireTransition` only allows forward steps. A sold product cannot be un-sold, and no function exists to reverse a state.

---

## Slide-to-Member Quick Reference

| Slide | Title | Speaker |
|-------|-------|---------|
| 1 | Title | Member A |
| 2 | The Problem | Member A |
| 3 | Our Solution | Member A |
| 4 | System Architecture | Member A |
| 5 | Smart Contract Overview | Member B |
| 6 | Product State Machine | Member B |
| 7 | Role-Based Access Control | Member B |
| 8 | Security Design | Member B |
| 9 | React DApp — Five Pages | Member C |
| 10 | IPFS Pinning + QR Codes | Member C |
| 11 | Gas Report | Member C |
| 12 | Test Coverage | Member C |
| 13 | Stretch Features | Member D |
| 14 | Live Demo Walkthrough | Member D (narrates), Member C (drives browser) |
| 15 | Team Contributions | Member D |
| 16 | Key Takeaways | Member D |
