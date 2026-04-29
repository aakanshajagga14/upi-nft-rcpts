# UPI NFT Receipts — Soulbound Financial Proof Layer on Ethereum

A middleware proof layer where UPI transactions generate Soulbound 
(non-transferable) NFTs on Ethereum as tamper-proof, self-sovereign 
receipts.

Built as part of the Road to Devcon 8 India Ecosystem Program grant.

## What it does

Every UPI payment generates an on-chain NFT receipt containing:
- SHA-256 hashed sender/receiver UPI IDs (privacy-preserving)
- Transaction amount, category, and timestamp
- Masked UTR reference number

Receipts are Soulbound — permanently tied to your wallet, 
non-transferable, and universally verifiable without contacting 
any bank.

## Why Ethereum

- **Neutrality** — no bank or company controls the receipt ledger
- **Composability** — receipts are natively interoperable with 
  DeFi and decentralised identity systems
- **Global verifiability** — anyone anywhere can verify a receipt 
  without Indian banking infrastructure

## Tech stack

- Solidity + Hardhat (ERC-5192 Soulbound NFT)
- Ethereum Sepolia testnet
- IPFS via Pinata (metadata storage)
- Python (UPI transaction simulator)
- React + ethers.js (frontend dashboard)

## Run it locally

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
node scripts/copyABI.js
python simulator.py
node scripts/mint.js
cd frontend && npm install && npm run dev
```

## Project structure
├── contracts/UPIReceipt.sol    # Soulbound NFT smart contract
├── scripts/deploy.js           # Deploy to Sepolia
├── scripts/mint.js             # Mint a receipt
├── simulator.py                # Simulate UPI transaction
├── frontend/                   # React dashboard
└── demo/index.html             # Standalone mockup demo

## Privacy

Sender and receiver UPI IDs are SHA-256 hashed before being 
written on-chain. Amount and timestamp are stored as-is. 
Zero-knowledge selective disclosure is planned for v2.

## Status

- [x] Smart contract (ERC-5192 Soulbound)
- [x] UPI simulator
- [x] Frontend dashboard
- [x] Mockup demo
- [ ] Sepolia live deployment (in progress)
- [ ] ZK proof layer (v2)
