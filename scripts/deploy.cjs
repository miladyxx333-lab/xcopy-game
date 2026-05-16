// Deploy CryptoDogos to Base mainnet
// Run: npm run deploy

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n🐶 CryptoDogos — Deploying to Base...");
  console.log("   Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ No ETH on Base. Add ETH to your wallet first.");
    process.exit(1);
  }

  console.log("\n   Deploying contract...");
  const CryptoDogos = await hre.ethers.getContractFactory("CryptoDogos");
  const contract    = await CryptoDogos.deploy(deployer.address);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ CONTRACT DEPLOYED!");
  console.log("   Address:", address);
  console.log("   Network: Base (8453)");
  console.log("   Owner:  ", deployer.address);
  console.log("\n   OpenSea: https://opensea.io/collection/cryptodogos");
  console.log("   BaseScan: https://basescan.org/address/" + address);
  console.log("\n   Next steps:");
  console.log("   1. Add to .env: CONTRACT_ADDRESS=" + address);
  console.log("   2. Run: npm run activate   → opens public mint");
  console.log("   3. Run: npm run mint-custom → reserves 14 archetypes to your wallet");
}

main().catch(e => { console.error(e); process.exit(1); });
