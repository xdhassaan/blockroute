/**
 * live-demo.ts
 * Runs a complete product lifecycle end-to-end in the terminal.
 * No MetaMask required. No wallet funding required.
 * Hardhat's signer[1/2/3] hold 10,000 ETH each on the local node.
 *
 * Usage:
 *   npx hardhat run scripts/live-demo.ts --network localhost
 *
 * Watch the browser at http://localhost:5173 — it updates in real time.
 */

import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// ── helpers ─────────────────────────────────────────────────────────────────

const STATES = [
  "Manufactured",
  "ShippedToDistributor",
  "ReceivedByDistributor",
  "ShippedToRetailer",
  "ReceivedByRetailer",
  "Sold",
] as const;

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
  red:    "\x1b[31m",
  white:  "\x1b[37m",
};

function banner(text: string) {
  const line = "─".repeat(60);
  console.log(`\n${C.cyan}${C.bold}${line}${C.reset}`);
  console.log(`${C.cyan}${C.bold}  ${text}${C.reset}`);
  console.log(`${C.cyan}${C.bold}${line}${C.reset}`);
}

function step(n: number, label: string) {
  console.log(`\n${C.yellow}${C.bold}  Step ${n}/6 — ${label}${C.reset}`);
}

function ok(msg: string) {
  console.log(`${C.green}  ✓ ${msg}${C.reset}`);
}

function info(label: string, value: string) {
  console.log(`${C.dim}    ${label.padEnd(18)}${C.reset}${value}`);
}

async function pause(seconds: number) {
  process.stdout.write(`${C.dim}    (next step in ${seconds}s — switch browser tab now...)${C.reset}`);
  await new Promise(r => setTimeout(r, seconds * 1000));
  process.stdout.write("\n");
}

async function waitForEnter(prompt = "    Press ENTER for next step...") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>(resolve => rl.question(`${C.dim}${prompt}${C.reset}`, () => { rl.close(); resolve(); }));
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Set DEMO_AUTO=1 for non-interactive mode (no keypresses):
  //   DEMO_AUTO=1 npx hardhat run scripts/live-demo.ts --network localhost
  const AUTO = process.env.DEMO_AUTO === "1";
  const advance = AUTO ? () => pause(3) : () => waitForEnter();

  // ── load contract ──────────────────────────────────────────────────────
  const dep = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "deployments", "localhost.json"), "utf8")
  );
  const [admin, manufacturer, distributor, retailer] = await ethers.getSigners();

  const sc    = await ethers.getContractAt("SupplyChain", dep.address);
  const mfgSC = sc.connect(manufacturer);
  const disSC = sc.connect(distributor);
  const retSC = sc.connect(retailer);

  // ── opening banner ─────────────────────────────────────────────────────
  banner("SupplyChain DApp — Live Demo");
  console.log(`\n  Contract : ${C.cyan}${dep.address}${C.reset}`);
  console.log(`  Network  : ${C.cyan}Hardhat localhost (chainId 31337)${C.reset}`);
  console.log(`\n  Accounts (all pre-funded with 10,000 ETH — no faucet needed):`);
  info("admin",        admin.address);
  info("manufacturer", manufacturer.address);
  info("distributor",  distributor.address);
  info("retailer",     retailer.address);

  const before = await sc.productCount();
  console.log(`\n  Current product count on-chain: ${C.bold}${before}${C.reset}`);
  console.log(`\n  ${C.dim}Open http://localhost:5173 in your browser — it will update live.${C.reset}`);

  await advance();

  // ── Step 1 — Register product ──────────────────────────────────────────
  step(1, "Manufacturer registers a new product");
  console.log(`${C.dim}    Calling: registerProduct("Demo Vaccine Vials", "DEMO-001", 0x00...00, "Factory Berlin")${C.reset}`);
  console.log(`${C.dim}    Signed by: ${manufacturer.address}${C.reset}\n`);

  const tx1 = await mfgSC.registerProduct(
    "Demo Vaccine Vials",
    "DEMO-001",
    ethers.ZeroHash,
    "Factory Berlin"
  );
  const r1 = await tx1.wait();
  const productId = (await sc.productCount());
  ok(`Product #${productId} created in "Manufactured" state`);
  info("tx hash",  r1!.hash);
  info("gas used", r1!.gasUsed.toString());
  console.log(`\n  ${C.blue}→ Refresh browser → Dashboard → new product #${productId} should appear${C.reset}`);

  await advance();

  // ── Step 2 — Ship to distributor ───────────────────────────────────────
  step(2, "Manufacturer ships to Distributor");
  console.log(`${C.dim}    Calling: shipToDistributor(${productId}, distributor, "Truck DHL-22")${C.reset}`);
  console.log(`${C.dim}    Contract checks: MANUFACTURER_ROLE ✓, currentOwner == manufacturer ✓, recipient has DISTRIBUTOR_ROLE ✓${C.reset}\n`);

  const tx2 = await mfgSC.shipToDistributor(productId, distributor.address, "Truck DHL-22");
  const r2 = await tx2.wait();
  ok(`State → ShippedToDistributor`);
  ok(`currentOwner transferred to distributor`);
  info("tx hash",  r2!.hash);
  info("ship nonce", (await sc.shipNonce(productId)).toString());
  console.log(`\n  ${C.blue}→ Refresh /product/${productId} → timeline shows 2nd entry${C.reset}`);

  await advance();

  // ── Step 3 — Distributor receives ──────────────────────────────────────
  step(3, "Distributor confirms receipt");
  console.log(`${C.dim}    Calling: receiveAsDistributor(${productId}, "Distribution Centre Karachi", 0x)${C.reset}`);
  console.log(`${C.dim}    Signature: 0x (optional — skipped for demo)${C.reset}`);
  console.log(`${C.dim}    Contract checks: DISTRIBUTOR_ROLE ✓, currentOwner == distributor ✓${C.reset}\n`);

  const tx3 = await disSC.receiveAsDistributor(productId, "Distribution Centre Karachi", "0x");
  const r3 = await tx3.wait();
  ok(`State → ReceivedByDistributor`);
  info("tx hash", r3!.hash);
  console.log(`\n  ${C.blue}→ Refresh /product/${productId} → timeline shows 3rd entry${C.reset}`);

  await advance();

  // ── Step 4 — Distributor ships to retailer ─────────────────────────────
  step(4, "Distributor ships to Retailer");
  console.log(`${C.dim}    Calling: shipToRetailer(${productId}, retailer, "Van Express-7")${C.reset}`);
  console.log(`${C.dim}    Contract checks: DISTRIBUTOR_ROLE ✓, currentOwner == distributor ✓, recipient has RETAILER_ROLE ✓${C.reset}\n`);

  const tx4 = await disSC.shipToRetailer(productId, retailer.address, "Van Express-7");
  const r4 = await tx4.wait();
  ok(`State → ShippedToRetailer`);
  ok(`currentOwner transferred to retailer`);
  info("tx hash",  r4!.hash);
  info("ship nonce", (await sc.shipNonce(productId)).toString());
  console.log(`\n  ${C.blue}→ Refresh /product/${productId} → 4th timeline entry${C.reset}`);

  await advance();

  // ── Step 5 — Retailer receives ─────────────────────────────────────────
  step(5, "Retailer confirms receipt");
  console.log(`${C.dim}    Calling: receiveAsRetailer(${productId}, "Pharmacy Lahore", 0x)${C.reset}\n`);

  const tx5 = await retSC.receiveAsRetailer(productId, "Pharmacy Lahore", "0x");
  const r5 = await tx5.wait();
  ok(`State → ReceivedByRetailer`);
  info("tx hash", r5!.hash);
  console.log(`\n  ${C.blue}→ Refresh /product/${productId} → 5th entry${C.reset}`);

  await advance();

  // ── Step 6 — Mark Sold ─────────────────────────────────────────────────
  step(6, "Retailer marks product as Sold");
  console.log(`${C.dim}    Calling: markSold(${productId}, "Sold to customer — POS terminal 3")${C.reset}`);
  console.log(`${C.dim}    This is the terminal state. No further transitions possible.${C.reset}\n`);

  const tx6 = await retSC.markSold(productId, "Sold to customer — POS terminal 3");
  const r6 = await tx6.wait();
  ok(`State → Sold  (TERMINAL — no further changes possible)`);
  info("tx hash", r6!.hash);

  // ── Final summary ──────────────────────────────────────────────────────
  banner("Complete — Full Lifecycle Recorded On-Chain");

  const history = await sc.getHistory(productId);
  console.log(`\n  Product #${productId} — "${(await sc.getProduct(productId)).name}"`);
  console.log(`  ${history.length} immutable history entries:\n`);

  for (const [i, h] of history.entries()) {
    const when = new Date(Number(h.timestamp) * 1000).toISOString().replace("T", " ").slice(0, 19);
    const sig  = h.signature !== "0x" ? ` ${C.green}[SIGNED]${C.reset}` : "";
    console.log(`  ${C.dim}${i + 1}.${C.reset} ${C.bold}${STATES[Number(h.state)].padEnd(25)}${C.reset}  ${C.dim}${when}  @${C.reset} ${h.location}${sig}`);
  }

  const after = await sc.productCount();
  console.log(`\n  Total products on-chain: ${C.bold}${after}${C.reset}`);
  console.log(`\n  ${C.blue}→ Open http://localhost:5173/analytics to see the updated state distribution${C.reset}`);
  console.log(`  ${C.blue}→ Open http://localhost:5173/product/${productId} for the full immutable timeline${C.reset}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
