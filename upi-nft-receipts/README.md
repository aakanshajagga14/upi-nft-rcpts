# UPI Receipts on Ethereum — Self-Sovereign Financial Proof Layer

UPI NFT Receipts is a middleware proof layer that turns simulated UPI transactions into Soulbound NFTs (ERC-5192) on Ethereum Sepolia.

This is **not** a direct NPCI/UPI integration. The prototype demonstrates an infrastructure-ready design that is API-pluggable with UPI payment providers in future deployments.

## Overview

- Simulate a UPI payment in Python.
- Hash identity fields and UTR with SHA-256 for baseline privacy.
- Mint a non-transferable Soulbound NFT receipt on Ethereum.
- Read receipts in a premium React dashboard with Etherscan verification QR.

## Why Ethereum

- Neutral, credibly decentralized infrastructure for financial attestation.
- Global verifiability for grant, compliance, and accounting audit trails.
- Composability with future DeFi/identity/reputation layers.

## Privacy Model

- Sender UPI ID, receiver UPI ID, and UTR are stored as SHA-256 hashes.
- Amount and timestamp are intentionally plaintext in this research prototype.
- `zk_ready: true` in simulator output flags a future selective-disclosure ZK layer.

## Tech Stack

| Layer | Stack |
|---|---|
| Smart contract | Solidity `^0.8.20`, ERC-5192 Soulbound, OpenZeppelin |
| Deployment/tooling | Hardhat + ethers.js |
| Simulation | Python |
| Frontend | React + Vite + ethers.js + qrcode.react |
| Metadata/storage path | IPFS-ready architecture via Pinata-compatible design |
| Network | Sepolia |

## Setup

```bash
npm install
```

Create `.env` in root:

```env
PRIVATE_KEY=
SEPOLIA_RPC_URL=
RECEIPT_RECIPIENT=
PINATA_JWT=
```

## Run Order

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
node scripts/copyABI.js
python simulator.py
node scripts/mint.js
cd frontend && npm install && npm run dev
```

## Script Notes

- `scripts/deploy.js`: deploys `UPIReceipt` and writes `frontend/src/contractAddress.json`.
- `scripts/copyABI.js`: copies ABI into `frontend/src/UPIReceipt.json`.
- `scripts/mint.js`: reads `transaction.json` and mints Soulbound receipt to your wallet (or `RECEIPT_RECIPIENT`).
- `scripts/pinMetadata.js`: optional Pinata uploader used by `mint.js` when `PINATA_JWT` is set.
- `simulator.py`: generates a middleware payload for minting.

## Frontend Functionality

- MetaMask connect.
- Fetches `ReceiptMinted` events for connected wallet.
- Resolves each receipt via `getReceipt(tokenId)`.
- Renders premium receipt cards + QR link to Sepolia Etherscan token view.

## Research and Program Context

Submitted as part of the **Road to Devcon 8 India Ecosystem Program grant**.

- Live demo: [Demo Site](https://aakanshajagga14.github.io/upi-nft-rcpts/upi-nft-receipts/demo/)
- arXiv paper: [TBD](https://arxiv.org)
