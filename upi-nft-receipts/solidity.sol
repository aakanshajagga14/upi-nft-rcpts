// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UPIReceipt
 * @notice Middleware proof layer: Soulbound NFT receipts for UPI transactions
 * @dev Non-transferable ERC-721 following ERC-5192 standard.
 *      This contract is NOT a direct NPCI integration — it is an
 *      infrastructure-ready layer designed to be API-pluggable
 *      with UPI payment apps in the future.
 *
 * Privacy note: sender/receiver UPI IDs are SHA-256 hashed off-chain
 * before being passed to this contract. Amount + timestamp are stored
 * as-is. A zero-knowledge proof layer for selective disclosure is
 * planned as future scope (v2).
 */
contract UPIReceipt is ERC721, Ownable {

    // ── State ──────────────────────────────────────────────────────
    uint256 private _tokenCounter;

    struct Receipt {
        uint256 amount;        // Amount in paise (50000 = Rs.500)
        string  utrHash;       // SHA-256 hash of 12-digit UTR
        string  senderHash;    // SHA-256 hash of sender UPI ID
        string  receiverHash;  // SHA-256 hash of receiver UPI ID
        string  category;      // "Rent" | "Food" | "Medical" etc.
        uint256 timestamp;     // Unix timestamp of transaction
        // Future v2: bytes32 zkCommitment for ZK selective disclosure
    }

    mapping(uint256 => Receipt) private _receipts;

    // ── Events ─────────────────────────────────────────────────────
    event ReceiptMinted(
        address indexed owner,   // indexed — frontend filters by wallet
        uint256 indexed tokenId,
        uint256 amount,
        string  category,
        uint256 timestamp
    );

    // ERC-5192: signals token is permanently locked (soulbound)
    event Locked(uint256 tokenId);

    // ── Constructor ─────────────────────────────────────────────────
    constructor() ERC721("UPI NFT Receipt", "UPIR") Ownable(msg.sender) {
        _tokenCounter = 0;
    }

    // ── Mint ────────────────────────────────────────────────────────
    /**
     * @notice Mint a Soulbound receipt NFT for a UPI transaction
     * @dev Only callable by contract owner (the middleware backend)
     *      All sensitive fields must be hashed off-chain before calling
     */
    function mint(
        address to,
        uint256 amount,
        string calldata utrHash,
        string calldata senderHash,
        string calldata receiverHash,
        string calldata category,
        uint256 timestamp
    ) external onlyOwner {
        uint256 tokenId = _tokenCounter;
        _tokenCounter++;

        _safeMint(to, tokenId);

        _receipts[tokenId] = Receipt({
            amount:       amount,
            utrHash:      utrHash,
            senderHash:   senderHash,
            receiverHash: receiverHash,
            category:     category,
            timestamp:    timestamp
        });

        // ERC-5192: emit Locked immediately — token is soulbound forever
        emit Locked(tokenId);
        emit ReceiptMinted(to, tokenId, amount, category, timestamp);
    }

    // ── Read ────────────────────────────────────────────────────────
    function getReceipt(uint256 tokenId)
        external view returns (Receipt memory)
    {
        require(_ownerOf(tokenId) != address(0), "Receipt does not exist");
        return _receipts[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCounter;
    }

    // ── Soulbound: block ALL transfers ──────────────────────────────
    // Both overrides required — missing either one is a bug
    function transferFrom(address, address, uint256)
        public pure override
    {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory)
        public pure override
    {
        revert("Soulbound: non-transferable");
    }

    // ── ERC-5192 ────────────────────────────────────────────────────
    // Every token is always locked — no exceptions
    function locked(uint256) external pure returns (bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId)
        public view override returns (bool)
    {
        // 0xb45a3c0e = ERC-5192 interface ID
        return interfaceId == 0xb45a3c0e ||
               super.supportsInterface(interfaceId);
    }
}