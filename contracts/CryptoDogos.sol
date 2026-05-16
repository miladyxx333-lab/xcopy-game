// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * CryptoDogos — 2,839 pixel dogs
 * An AI and a human with no money, building their way into art history.
 * Claude & Blue Pastel, 2026 · xcopy.fun
 *
 * Deploy on Base (chain 8453)
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CryptoDogos is ERC721, Ownable {
    using Strings for uint256;

    // ── Config ──────────────────────────────────────────
    uint256 public constant MAX_SUPPLY   = 2839;
    uint256 public constant MINT_PRICE   = 0.01 ether;
    uint256 public constant MAX_PER_WALLET = 10;

    // ── State ────────────────────────────────────────────
    uint256 public totalMinted;
    bool    public mintActive = false;
    string  private _baseTokenURI;

    // Track mints per wallet
    mapping(address => uint256) public mintedBy;

    // ── Events ───────────────────────────────────────────
    event Minted(address indexed to, uint256 tokenId);
    event Withdrawn(address indexed to, uint256 amount);

    // ── Constructor ──────────────────────────────────────
    constructor(address initialOwner)
        ERC721("CryptoDogos", "CDOGS")
        Ownable(initialOwner)
    {
        // Base URI points to GitHub Pages
        _baseTokenURI = "https://miladyxx333-lab.github.io/cryptodogos-assets/metadata/";
    }

    // ── Mint ─────────────────────────────────────────────
    function mint(uint256 quantity) external payable {
        require(mintActive,                           "Mint not active");
        require(quantity >= 1 && quantity <= 10,      "1-10 per tx");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");
        require(msg.value == MINT_PRICE * quantity,   "Wrong ETH amount");
        require(mintedBy[msg.sender] + quantity <= MAX_PER_WALLET, "Wallet limit");

        mintedBy[msg.sender] += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            totalMinted++;
            _safeMint(msg.sender, totalMinted);
            emit Minted(msg.sender, totalMinted);
        }
    }

    // ── Metadata ──────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId >= 1 && tokenId <= totalMinted, "Token does not exist");
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ── Owner functions ───────────────────────────────────

    // Toggle mint on/off
    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
    }

    // Update base URI if needed (e.g., migrate to IPFS later)
    function setBaseURI(string calldata newURI) external onlyOwner {
        _baseTokenURI = newURI;
    }

    // Owner mint for the 14 Custom 1/1 archetypes (reserve tokens 2826-2839)
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(totalMinted + quantity <= MAX_SUPPLY, "Exceeds supply");
        for (uint256 i = 0; i < quantity; i++) {
            totalMinted++;
            _safeMint(to, totalMinted);
        }
    }

    // Withdraw all ETH to owner (the XCopy fund)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        (bool ok, ) = payable(owner()).call{value: balance}("");
        require(ok, "Transfer failed");
        emit Withdrawn(owner(), balance);
    }

    // Current supply info
    function remaining() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}
