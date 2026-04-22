import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { SupplyChain } from "../typechain-types";

/**
 * Seed three demo products across different lifecycle stages. Run AFTER deploy.ts.
 *
 * Behaviour on the `hardhat`/`localhost` network: uses the default 20 signers and
 * grants roles automatically.
 *
 * Behaviour on live networks (e.g. sepolia): the deployer must already have
 * granted roles (or this script will grant them if MANUFACTURER_ADDRESS etc.
 * are set in .env AND the deployer is the sole signer; otherwise it expects
 * the caller to be funded on all three role wallets — not a typical setup).
 *
 *   npx hardhat run scripts/seedProducts.ts --network localhost
 */
async function main() {
  const depFile = path.resolve(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(depFile)) {
    throw new Error(`No deployment file at ${depFile}. Run scripts/deploy.ts first.`);
  }
  const { address } = JSON.parse(fs.readFileSync(depFile, "utf8")) as { address: string };

  const signers = await ethers.getSigners();
  const [admin, manufacturer, distributor, retailer] = signers;

  console.log(`\n=> Using SupplyChain at ${address} on ${network.name}`);
  console.log(`   admin:        ${admin.address}`);
  console.log(`   manufacturer: ${manufacturer.address}`);
  console.log(`   distributor:  ${distributor.address}`);
  console.log(`   retailer:     ${retailer.address}`);

  const sc = (await ethers.getContractAt("SupplyChain", address)) as unknown as SupplyChain;

  // Grant roles if the admin is us and the roles aren't already set.
  const [mfgRole, distRole, retailRole] = await Promise.all([
    sc.MANUFACTURER_ROLE(),
    sc.DISTRIBUTOR_ROLE(),
    sc.RETAILER_ROLE(),
  ]);
  for (const [role, addr, label] of [
    [mfgRole,    manufacturer.address, "MANUFACTURER"],
    [distRole,   distributor.address,  "DISTRIBUTOR"],
    [retailRole, retailer.address,     "RETAILER"],
  ] as const) {
    if (!(await sc.hasRole(role, addr))) {
      const tx = await sc.connect(admin).grantRole(role, addr);
      await tx.wait();
      console.log(`   ✓ Granted ${label} to ${addr}`);
    }
  }

  const cid = (tag: string) => ethers.keccak256(ethers.toUtf8Bytes(`ipfs:${tag}`));

  // Product 1: walks the full lifecycle.
  console.log("\n=> [1] Creating and fully shipping product 1...");
  let id = await registerAndGetId(sc.connect(manufacturer), "Organic Coffee Beans, 1kg", "BATCH-2026-001", cid("coffee"), "Farm, Colombia");
  await (await sc.connect(manufacturer).shipToDistributor(id, distributor.address, "Truck to Bogota")).wait();
  await (await sc.connect(distributor).receiveAsDistributor(id, "Bogota Distribution Center", "0x")).wait();
  await (await sc.connect(distributor).shipToRetailer(id, retailer.address, "Container to Karachi")).wait();
  await (await sc.connect(retailer).receiveAsRetailer(id, "Karachi Cafe HQ", "0x")).wait();
  await (await sc.connect(retailer).markSold(id, "Sold to customer Jane Doe")).wait();
  console.log(`   ✓ Product ${id} -> Sold`);

  // Product 2: stuck in transit to distributor (mid-lifecycle).
  console.log("\n=> [2] Creating product 2 (in transit to distributor)...");
  id = await registerAndGetId(sc.connect(manufacturer), "Pharmaceutical Vials, Batch B", "BATCH-2026-002", cid("pharma"), "Lab, Zurich");
  await (await sc.connect(manufacturer).shipToDistributor(id, distributor.address, "Air freight DHL")).wait();
  console.log(`   ✓ Product ${id} -> ShippedToDistributor`);

  // Product 3: just manufactured.
  console.log("\n=> [3] Creating product 3 (just manufactured)...");
  id = await registerAndGetId(sc.connect(manufacturer), "Smart Sensor Module v4", "BATCH-2026-003", cid("sensor"), "Factory, Shenzhen");
  console.log(`   ✓ Product ${id} -> Manufactured`);

  const count = await sc.productCount();
  console.log(`\nDone. productCount() = ${count}\n`);
}

async function registerAndGetId(
  scWithSigner: SupplyChain,
  name: string,
  batch: string,
  metadataCID: string,
  location: string,
): Promise<bigint> {
  const tx = await scWithSigner.registerProduct(name, batch, metadataCID, location);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("no receipt");
  // Prefer the ProductRegistered event to avoid off-by-one risk.
  const iface = scWithSigner.interface;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === "ProductRegistered") {
        return parsed.args.productId as bigint;
      }
    } catch {
      /* skip unrelated logs */
    }
  }
  throw new Error("ProductRegistered event not found in receipt");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
