const fs = require("fs");
const path = require("path");

function main() {
  const source = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "UPIReceipt.sol",
    "UPIReceipt.json"
  );
  const destination = path.join(__dirname, "..", "frontend", "src", "UPIReceipt.json");

  if (!fs.existsSync(source)) {
    throw new Error("ABI source not found. Run `npx hardhat compile` first.");
  }

  const artifact = JSON.parse(fs.readFileSync(source, "utf-8"));
  fs.writeFileSync(destination, JSON.stringify({ abi: artifact.abi }, null, 2), "utf-8");

  console.log("ABI copied to:", destination);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
