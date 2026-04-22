import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

/**
 * Deploy SupplyChain and optionally grant roles from env vars.
 *
 * Env used when granting roles:
 *   MANUFACTURER_ADDRESS, DISTRIBUTOR_ADDRESS, RETAILER_ADDRESS
 *
 * Run:
 *   Local:   npx hardhat run scripts/deploy.ts --network localhost
 *   Sepolia: npx hardhat run scripts/deploy.ts --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n=> Network: ${network.name}`);
  console.log(`=> Deployer: ${deployer.address}`);
  console.log(`=> Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const sc = await SupplyChain.deploy();
  await sc.waitForDeployment();
  const address = await sc.getAddress();
  console.log(`\n=> SupplyChain deployed to: ${address}`);

  // Grant roles if provided
  const MANUFACTURER_ROLE = await sc.MANUFACTURER_ROLE();
  const DISTRIBUTOR_ROLE  = await sc.DISTRIBUTOR_ROLE();
  const RETAILER_ROLE     = await sc.RETAILER_ROLE();

  const roleGrants: Array<[string, string, string | undefined]> = [
    ["MANUFACTURER", MANUFACTURER_ROLE, process.env.MANUFACTURER_ADDRESS],
    ["DISTRIBUTOR",  DISTRIBUTOR_ROLE,  process.env.DISTRIBUTOR_ADDRESS],
    ["RETAILER",     RETAILER_ROLE,     process.env.RETAILER_ADDRESS],
  ];

  for (const [label, role, addr] of roleGrants) {
    if (!addr) {
      console.log(`   (skipping ${label} role — no env var set)`);
      continue;
    }
    const tx = await sc.grantRole(role, addr);
    await tx.wait();
    console.log(`   ✓ Granted ${label}_ROLE to ${addr}`);
  }

  // Persist deployment info for frontend & downstream scripts
  const outDir = path.resolve(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const payload = {
    network:  network.name,
    chainId:  Number((await ethers.provider.getNetwork()).chainId),
    address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, `${network.name}.json`), JSON.stringify(payload, null, 2));
  console.log(`\n=> Deployment info written to deployments/${network.name}.json`);

  // Also emit a minimal addresses.ts for the frontend to import
  const fePath = path.resolve(__dirname, "..", "frontend", "src", "generated");
  try {
    fs.mkdirSync(fePath, { recursive: true });
    fs.writeFileSync(
      path.join(fePath, "deployment.ts"),
      `// Auto-generated — do not edit by hand.\nexport const SUPPLY_CHAIN_ADDRESS = "${address}" as const;\nexport const SUPPLY_CHAIN_CHAIN_ID = ${payload.chainId};\n`,
    );
    console.log(`=> Wrote frontend/src/generated/deployment.ts`);
  } catch (err) {
    console.log(`   (frontend dir not found yet — skipping generated file)`);
  }

  console.log(`\nDone.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
