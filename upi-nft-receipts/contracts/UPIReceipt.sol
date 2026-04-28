// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @dev ERC-5192 interface for Soulbound NFTs.
interface IERC5192 {
    /// @notice Emitted when token locking status changes.
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    /// @notice Returns true when token is locked (non-transferable).
    function locked(uint256 tokenId) external view returns (bool);
}

contract UPIReceipt is ERC721, Ownable, IERC5192 {
    struct Receipt {
        uint256 amount;
        string utrHash;
        string senderHash;
        string receiverHash;
        string category;
        uint256 timestamp;
    }

    uint256 public tokenCounter;
    mapping(uint256 tokenId => Receipt) private receipts;

    event ReceiptMinted(address indexed owner, uint256 indexed tokenId);

    constructor() ERC721("UPI NFT Receipt", "UPIR") {}

    /// @notice Mints a Soulbound receipt NFT to `to`.
    /// @dev Only owner can mint because this contract acts as middleware verifier.
    function mint(
        address to,
        uint256 amount,
        string calldata utrHash,
        string calldata senderHash,
        string calldata receiverHash,
        string calldata category,
        uint256 timestamp
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter;
        tokenCounter += 1;

        _safeMint(to, tokenId);

        receipts[tokenId] = Receipt({
            amount: amount,
            utrHash: utrHash,
            senderHash: senderHash,
            receiverHash: receiverHash,
            category: category,
            timestamp: timestamp
        });

        emit Locked(tokenId);
        emit ReceiptMinted(to, tokenId);

        return tokenId;
    }

    function getReceipt(uint256 tokenId) external view returns (Receipt memory) {
        require(_ownerOf(tokenId) != address(0), "Receipt does not exist");
        return receipts[tokenId];
    }

    /// @dev Soulbound mechanism: all transfer paths are disabled.
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Soulbound mechanism: all transfer paths are disabled.
    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Soulbound mechanism: all transfer paths are disabled.
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: non-transferable");
    }

    function locked(uint256 tokenId) external view override returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Receipt does not exist");
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}
