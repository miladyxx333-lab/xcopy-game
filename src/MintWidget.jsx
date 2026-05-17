import { useState } from 'react'
import {
  useAccount, useConnect, useDisconnect,
  useReadContract, useWriteContract, useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther } from 'viem'
import { base } from 'wagmi/chains'
import { CONTRACT_ADDRESS, CRYPTODOGOS_ABI, MINT_PRICE, MAX_SUPPLY } from './wagmi.js'

export default function MintWidget() {
  const [qty, setQty] = useState(1)
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors }          = useConnect()
  const { disconnect }                   = useDisconnect()

  // Read contract state
  const { data: totalMinted = 0n } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CRYPTODOGOS_ABI, functionName: 'totalMinted',
    watch: true,
  })
  const { data: mintActive = false } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CRYPTODOGOS_ABI, functionName: 'mintActive',
  })

  // Write — mint
  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const minted    = Number(totalMinted)
  const remaining = MAX_SUPPLY - minted
  const pct       = Math.min(100, (minted / MAX_SUPPLY) * 100)
  const total     = (qty * parseFloat(MINT_PRICE)).toFixed(2)
  const wrongChain = isConnected && chain?.id !== base.id

  const handleMint = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CRYPTODOGOS_ABI,
      functionName: 'mint',
      args: [BigInt(qty)],
      value: parseEther((qty * parseFloat(MINT_PRICE)).toString()),
    })
  }

  return (
    <div className="mint-card">
      <div className="mint-card-title">FUND PROGRESS</div>

      {/* Progress bar */}
      <div className="mint-progress-wrap">
        <div className="mint-progress-bar">
          <div className="mint-fill" style={{ width: pct + '%' }} />
        </div>
        <span className="mint-pct-label">{pct.toFixed(1)}%</span>
      </div>
      <div className="mint-raised">
        {minted} minted · {remaining} remaining
      </div>

      {/* ETH raised estimate */}
      <div className="mint-eth-raised">
        ≈ {(minted * parseFloat(MINT_PRICE)).toFixed(2)} ETH raised
        <span className="mint-goal-label"> / 2.00 ETH goal</span>
      </div>

      {/* Price */}
      <div className="mint-price-display">
        <span className="mint-price-eth">{MINT_PRICE} ETH</span>
        <span className="mint-price-usd">≈ $30 USD</span>
      </div>

      {/* Quantity selector */}
      {isConnected && (
        <div className="mint-qty-row">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span className="qty-num">{qty}</span>
          <button className="qty-btn" onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
          <span className="qty-total">= {total} ETH</span>
        </div>
      )}

      {/* CTA */}
      {!isConnected ? (
        <div className="mint-connect-btns">
          {connectors.map(c => (
            <button key={c.id} className="mint-btn" onClick={() => connect({ connector: c })}>
              {c.name === 'MetaMask' ? '🦊' : '🔵'} {c.name}
            </button>
          ))}
        </div>
      ) : wrongChain ? (
        <button className="mint-btn mint-btn-warn">
          Switch to Base network
        </button>
      ) : isSuccess ? (
        <div className="mint-success">
          ✅ Minted! Check your wallet on OpenSea.
        </div>
      ) : (
        <button
          className="mint-btn"
          onClick={handleMint}
          disabled={isPending || isConfirming || !mintActive || remaining === 0}
        >
          {isPending      ? 'Confirm in wallet...'  :
           isConfirming   ? 'Minting...'            :
           !mintActive    ? 'Mint not active'        :
           remaining === 0 ? 'Sold out'             :
           `🐾 MINT ${qty} DOG${qty > 1 ? 'S' : ''}`}
        </button>
      )}

      {error && (
        <div className="mint-error">
          {error.message?.includes('rejected') ? 'Transaction cancelled.' :
           error.message?.includes('insufficient') ? 'Not enough ETH.' :
           'Error — try again.'}
        </div>
      )}

      {isConnected && (
        <button className="mint-disconnect" onClick={() => disconnect()}>
          {address?.slice(0,6)}…{address?.slice(-4)} ✕
        </button>
      )}

      <div className="mint-note">
        Max 10 per wallet · Contract on Base · Funds go to XCopy acquisition · {' '}
        <a href="https://opensea.io/collection/cryptodogos-122000728" target="_blank" rel="noopener" style={{color:'#00e5ff'}}>
          🌊 OpenSea
        </a>
      </div>
    </div>
  )
}
