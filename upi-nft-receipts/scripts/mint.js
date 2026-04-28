const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();
const { pinReceiptMetadata } = require("./pinMetadata");

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env");
  }

  const txPath = path.join(__dirname, "..", "transaction.json");
  const addressPath = path.join(__dirname, "..", "frontend", "src", "contractAddress.json");
  const abiPath = path.join(__dirname, "..", "frontend", "src", "UPIReceipt.json");

  const transaction = JSON.parse(fs.readFileSync(txPath, "utf-8"));
  const { contractAddress } = JSON.parse(fs.readFileSync(addressPath, "utf-8"));
  const { abi } = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  const recipient = process.env.RECEIPT_RECIPIENT || wallet.address;

  console.log("Minting Soulbound receipt to:", recipient);
  const tx = await contract.mint(
    recipient,
    transaction.amount,
    transaction.utrHash,
    transaction.senderHash,
    transaction.receiverHash,
    transaction.category,
    transaction.timestamp
  );

  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();

  let mintedTokenId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "ReceiptMinted") {
        mintedTokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch (_) {
      // Skip unrelated logs.
    }
  }

  console.log("Minted tokenId:", mintedTokenId ?? "not found in logs");

  // Privacy architecture note: metadata pinning is optional and can be swapped for
  // encrypted fields or ZK attestation pointers in future iterations.
  if (mintedTokenId) {
    try {
      const pinResult = await pinReceiptMetadata({
        tokenId: mintedTokenId,
        contractAddress,
        transaction,
      });
      if (pinResult) {
        console.log("Pinned metadata CID:", pinResult.IpfsHash);
      } else {
        console.log("PINATA_JWT not set, skipped IPFS pinning.");
      }
    } catch (error) {
      console.error("Metadata pinning failed:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
