import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "deployments", "localhost.json"), "utf8"));
  const sc = await ethers.getContractAt("SupplyChain", dep.address);
  const states = ["Manufactured", "Shipped→Distributor", "ReceivedByDistributor", "Shipped→Retailer", "ReceivedByRetailer", "Sold"];

  const count = await sc.productCount();
  console.log(`\nContract: ${dep.address}\nTotal products: ${count}\n`);

  for (let id = 1n; id <= count; id++) {
    const p = await sc.getProduct(id);
    console.log(`Product #${p.id} — "${p.name}" (batch ${p.batch})`);
    console.log(`   manufacturer : ${p.manufacturer}`);
    console.log(`   currentOwner : ${p.currentOwner}`);
    console.log(`   state        : ${states[Number(p.state)]}`);

    const history = await sc.getHistory(id);
    console.log(`   history (${history.length} entries):`);
    for (const h of history) {
      const when = new Date(Number(h.timestamp) * 1000).toISOString();
      console.log(`     • ${when}  ${states[Number(h.state)].padEnd(22)}  by ${h.actor.slice(0,10)}…  @ ${h.location}`);
    }
    console.log();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
