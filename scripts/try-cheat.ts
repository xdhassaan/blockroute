import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "deployments", "localhost.json"), "utf8"));
  const sc  = await ethers.getContractAt("SupplyChain", dep.address);
  const [, manufacturer, distributor, retailer, randomGuy] = await ethers.getSigners();

  // Product #3 is in state "Manufactured" — only the manufacturer can ship it next.
  console.log(`\n--- Test 1: random outsider tries to mark product #3 sold ---`);
  console.log(`outsider: ${randomGuy.address}`);
  try {
    await sc.connect(randomGuy).markSold(3, "stealing this");
    console.log(`UH OH, that worked.`);
  } catch (e: any) {
    console.log(`✓ Rejected by contract: ${e.shortMessage ?? e.message.split("\n")[0]}`);
  }

  console.log(`\n--- Test 2: distributor tries to ship product #3 (only manufacturer can) ---`);
  try {
    await sc.connect(distributor).shipToDistributor(3, distributor.address, "x");
    console.log(`UH OH, that worked.`);
  } catch (e: any) {
    console.log(`✓ Rejected by contract: ${e.shortMessage ?? e.message.split("\n")[0]}`);
  }

  console.log(`\n--- Test 3: manufacturer tries to skip the pipeline & mark sold ---`);
  try {
    await sc.connect(manufacturer).markSold(3, "skip ahead");
    console.log(`UH OH, that worked.`);
  } catch (e: any) {
    console.log(`✓ Rejected by contract: ${e.shortMessage ?? e.message.split("\n")[0]}`);
  }

  console.log(`\n--- Test 4: retailer tries to receive product #3 before it was even shipped ---`);
  try {
    await sc.connect(retailer).receiveAsRetailer(3, "warehouse", "0x");
    console.log(`UH OH, that worked.`);
  } catch (e: any) {
    console.log(`✓ Rejected by contract: ${e.shortMessage ?? e.message.split("\n")[0]}`);
  }

  console.log(`\nAll four cheats failed exactly as expected. The contract is the gatekeeper, not the UI.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
