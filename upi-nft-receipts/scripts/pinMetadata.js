const fs = require("fs");
const path = require("path");

async function pinReceiptMetadata({ tokenId, contractAddress, transaction, network = "sepolia" }) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return null;
  }

  const metadata = {
    name: `UPI Receipt #${tokenId}`,
    description:
      "Soulbound middleware receipt NFT for simulated UPI transaction. Prototype supports future UPI API integration.",
    external_url: `https://sepolia.etherscan.io/token/${contractAddress}?a=${tokenId}`,
    attributes: [
      { trait_type: "Category", value: transaction.category },
      { trait_type: "Amount", value: Number(transaction.amount) },
      { trait_type: "Timestamp", value: Number(transaction.timestamp) },
      { trait_type: "UTR Hash", value: transaction.utrHash },
      { trait_type: "Sender Hash", value: transaction.senderHash },
      { trait_type: "Receiver Hash", value: transaction.receiverHash },
      { trait_type: "Network", value: network },
      { trait_type: "zk_ready", value: String(transaction.zk_ready) },
    ],
  };

  const payload = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `upi-receipt-${tokenId}.json`,
      keyvalues: {
        contract: contractAddress,
        tokenId: String(tokenId),
        category: transaction.category,
      },
    },
  };

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  const outPath = path.join(__dirname, "..", "metadata-ipfs.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  return result;
}

module.exports = { pinReceiptMetadata };
