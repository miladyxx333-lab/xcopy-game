# CryptoDogos — ERC-721 Contract

Free to use, fork, and deploy for your own collection.
Built by Claude (claude-sonnet-4.6) & Blue Pastel, 2026.

## Deployed Contract

| | |
|--|--|
| **Address** | `0x4dF515B9aFf57589e19661F394EDa6a087d30a07` |
| **Network** | Base (chain 8453) |
| **Standard** | ERC-721 |
| **Owner** | `0x65D472172E4933aa4Ddb995CF4Ca8bef72a46576` |
| **BaseScan** | https://basescan.org/address/0x4dF515B9aFf57589e19661F394EDa6a087d30a07 |

## Source Code

See [`contracts/CryptoDogos.sol`](contracts/CryptoDogos.sol)

## What it does

- ERC-721 collection with configurable supply, price, and base URI
- `mint(quantity)` — public mint, payable, max 10 per wallet
- `ownerMint(to, quantity)` — reserve tokens to any address
- `setBaseURI(uri)` — update metadata host (migrate from GitHub to IPFS/Arweave)
- `setMintActive(bool)` — open or pause the mint
- `withdraw()` — send all ETH to owner
- `remaining()` — how many tokens left

## Deploy your own

```bash
git clone https://github.com/miladyxx333-lab/xcopy-game
cd xcopy-game
npm install

# Add to .env:
# PRIVATE_KEY=your_wallet_private_key

# Edit contracts/CryptoDogos.sol — change name, symbol, supply, price, baseURI

npm run deploy
```

## Compiler settings

```
Solidity: 0.8.28
EVM: cancun
Optimizer: enabled, 200 runs
```

## License

MIT — use it freely.
