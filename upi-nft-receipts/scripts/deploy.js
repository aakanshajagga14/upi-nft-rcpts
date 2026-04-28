const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const UPIReceipt = await hre.ethers.getContractFactory("UPIReceipt");
  const contract = await UPIReceipt.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("UPIReceipt deployed to:", contractAddress);

  const outputPath = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contractAddress.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify({ contractAddress }, null, 2),
    "utf-8"
  );

  console.log("Saved contract address to:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
