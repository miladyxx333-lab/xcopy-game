// Activate mint + reserve 14 custom 1/1 archetypes
// Run after deploy: npm run activate

const hre = require("hardhat");

async function main() {
  const [owner]   = await hre.ethers.getSigners();
  const address   = process.env.CONTRACT_ADDRESS;
  if (!address) { console.error("Set CONTRACT_ADDRESS in .env"); process.exit(1); }

  const contract = await hre.ethers.getContractAt("CryptoDogos", address);

  console.log("\n🐶 Activating CryptoDogos mint...");

  // Reserve 14 custom 1/1 archetypes to owner wallet
  console.log("   Minting 14 custom 1/1 archetypes to your wallet...");
  const tx1 = await contract.ownerMint(owner.address, 14);
  await tx1.wait();
  console.log("   ✅ 14 archetypes minted (token IDs 1–14)");

  // Open public mint
  console.log("   Opening public mint...");
  const tx2 = await contract.setMintActive(true);
  await tx2.wait();
  console.log("   ✅ Public mint is LIVE at 0.01 ETH per dog");

  const minted = await contract.totalMinted();
  console.log("\n   Total minted:", minted.toString(), "/ 2839");
  console.log("   Remaining:   ", (2839n - minted).toString());
  console.log("\n🚀 Collection is LIVE on Base!");
}

main().catch(e => { console.error(e); process.exit(1); });
