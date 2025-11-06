const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy PharmaChain
  const PharmaChain = await ethers.getContractFactory("PharmaChain");
  const pharmaChain = await PharmaChain.deploy();
  await pharmaChain.waitForDeployment();
  console.log("PharmaChain deployed to:", await pharmaChain.getAddress());

  // Deploy QualityToken
  const QualityToken = await ethers.getContractFactory("QualityToken");
  const qualityToken = await QualityToken.deploy();
  await qualityToken.waitForDeployment();
  console.log("QualityToken deployed to:", await qualityToken.getAddress());

  // Set PharmaChain address in QualityToken
  await qualityToken.setPharmaChainAddress(await pharmaChain.getAddress());
  console.log("PharmaChain address set in QualityToken");

  // Save contract addresses
  const fs = require("fs");
  const contracts = {
    pharmaChain: await pharmaChain.getAddress(),
    qualityToken: await qualityToken.getAddress()
  };
  
  // Create frontend directory if it doesn't exist
  if (!fs.existsSync("./frontend")) {
    fs.mkdirSync("./frontend");
  }
  
  fs.writeFileSync("./frontend/contracts.json", JSON.stringify(contracts, null, 2));
  console.log("Contract addresses saved to frontend/contracts.json");

  console.log("\n✅ Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   PharmaChain:", await pharmaChain.getAddress());
  console.log("   QualityToken:", await qualityToken.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });