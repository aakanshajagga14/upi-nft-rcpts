require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawPrivateKey = (process.env.PRIVATE_KEY || "").trim();
const normalizedPrivateKey =
  rawPrivateKey && !rawPrivateKey.startsWith("0x") ? `0x${rawPrivateKey}` : rawPrivateKey;
const hasValidPrivateKey = /^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      // Guard against HH8 during local compile when env key is malformed.
      accounts: hasValidPrivateKey ? [normalizedPrivateKey] : [],
    },
  },
};
