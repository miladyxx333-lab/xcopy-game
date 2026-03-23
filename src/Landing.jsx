import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './landing.css'

const FEATURED_CARDS = ['44','46','48','50','67','69','71','72','92','93','96','254','256','248','233','234','235']

const BOOSTERS = [
  { id: 'starter', name: 'STARTER PACK', subtitle: 'GENESIS EDITION', price: '$14.99', cards: 10, rarity: '1 Legendary guaranteed', color: '#0ff', icon: '⚡', desc: 'Perfect entry into the XCOPY arena. Contains 10 random cards with at least 1 guaranteed Legendary.' },
  { id: 'doom', name: 'DOOM PACK', subtitle: 'DARKNESS RISES', price: '$19.99', cards: 10, rarity: '2 Legendary guaranteed', color: '#f0f', icon: '💀', desc: 'Doom-weighted booster. Higher chance of Doom & Death type cards. 2 Legendary guaranteed.' },
  { id: 'legendary', name: 'LEGENDARY PACK', subtitle: 'APEX PREDATOR', price: '$29.99', cards: 10, rarity: '4 Legendary guaranteed', color: '#ff3333', icon: '👑', desc: 'Premium booster with 4 guaranteed Legendary cards. The ultimate collector experience.' },
  { id: 'collector', name: 'COLLECTOR BOX', subtitle: 'COMPLETE EDITION', price: '$99.99', cards: 50, rarity: 'Full set guaranteed', color: '#ffd700', icon: '🏆', desc: '5 boosters + 1 exclusive holographic card. Guaranteed to complete a full set.' },
]

function Landing() {
  const [scrollY, setScrollY] = useState(0)
  const [hovered, setHovered] = useState(null)
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [featIdx, setFeatIdx] = useState(0)

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setFeatIdx(i => (i + 1) % FEATURED_CARDS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const addToCart = (booster) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === booster.id)
      if (existing) {
        return prev.map(item => item.id === booster.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...booster, qty: 1 }]
    })
    setShowNotif(true)
    setTimeout(() => setShowNotif(false), 2000)
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const n = Math.max(1, item.qty + delta)
        return { ...item, qty: n }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((acc, item) => {
    const p = parseFloat(item.price.replace('$', ''))
    return acc + (p * item.qty)
  }, 0)

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0)

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-x">X</span>COPY<span className="logo-dot">::</span><span className="logo-arena">ARENA</span>
        </div>
        <div className="nav-links">
          <a href="#about">ABOUT</a>
          <a href="#gallery">GALLERY</a>
          <a href="#store">STORE</a>
          <Link to="/play" className="nav-play-btn">▶ PLAY NOW</Link>
          <div className="nav-cart" onClick={() => setIsCartOpen(true)}>
            <span className="cart-icon">🛒</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg-grid" />
        <div className="hero-particles">
          {Array.from({length: 20}).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className="hero-badge">TRADING CARD GAME</div>
          <h1 className="hero-title">
            <span className="title-line-1">XCOPY</span>
            <span className="title-line-2">::ARENA</span>
          </h1>
          <p className="hero-subtitle">
            240+ unique cards • On-chain art by <span className="xcopy-credit">XCOPY</span> • Collect, Trade, Dominate
          </p>
          <div className="hero-ctas">
            <Link to="/play" className="cta-primary">
              <span className="cta-icon">▶</span> PLAY FREE
            </Link>
            <a href="#store" className="cta-secondary">
              <span className="cta-icon">🃏</span> BUY BOOSTERS
            </a>
          </div>
        </div>
        <div className="hero-card-fan" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          {[FEATURED_CARDS[featIdx], FEATURED_CARDS[(featIdx+1)%FEATURED_CARDS.length], FEATURED_CARDS[(featIdx+2)%FEATURED_CARDS.length]].map((id, i) => (
            <img key={`${id}-${i}`} src={`/cards/${id}.png`} alt="card" className={`fan-card fan-card-${i}`} />
          ))}
        </div>
      </section>

      {/* ABOUT XCOPY */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <div className="about-art">
            <img src={`/cards/${FEATURED_CARDS[5]}.png`} alt="XCOPY Art" className="about-card-img" />
            <div className="about-card-glow" />
          </div>
          <div className="about-text">
            <h2 className="section-title">THE <span className="accent-pink">ART</span></h2>
            <p className="about-desc">
              All artwork featured in XCOPY::ARENA is created by <strong className="xcopy-name">XCOPY</strong>, 
              a London-based crypto artist known for exploring themes of death, dystopia, and 
              existential dread through glitchy, animated visual art.
            </p>
            <p className="about-desc">
              XCOPY's work exists at the intersection of digital art and blockchain technology, 
              pioneering the NFT art movement. This game pays homage to his iconic visual style — 
              <em>we do not claim ownership of the original artwork.</em>
            </p>
            <div className="about-disclaimer">
              <span className="disclaimer-icon">⚠️</span>
              <span>This is a fan-made tribute game. All art is property of XCOPY. 
              This project is not affiliated with or endorsed by XCOPY.</span>
            </div>
            <div className="about-stats">
              <div className="stat-item"><span className="stat-num">240+</span><span className="stat-label">UNIQUE CARDS</span></div>
              <div className="stat-item"><span className="stat-num">4</span><span className="stat-label">CARD TYPES</span></div>
              <div className="stat-item"><span className="stat-num">34</span><span className="stat-label">EFFECT TYPES</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CARD GALLERY */}
      <section id="gallery" className="gallery-section">
        <h2 className="section-title">CARD <span className="accent-cyan">GALLERY</span></h2>
        <p className="gallery-subtitle">Preview some of the 240+ cards in the collection</p>
        <div className="gallery-scroll">
          <div className="gallery-track">
            {[...FEATURED_CARDS, ...FEATURED_CARDS].map((id, i) => (
              <div key={`g-${i}`} className="gallery-card">
                <img src={`/cards/${id}.png`} alt={`Card ${id}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARD TYPES */}
      <section className="types-section">
        <h2 className="section-title">CARD <span className="accent-pink">TYPES</span></h2>
        <div className="types-grid">
          {[
            { name: 'FLY', color: '#0ff', icon: '🦋', desc: 'Swift creatures that dominate the skies. Fast and evasive.' },
            { name: 'DEATH', color: '#f0f', icon: '💀', desc: 'Dark entities from the void. Drain and destroy opponents.' },
            { name: 'DOOM', color: '#ff3333', icon: '🔥', desc: 'Apocalyptic forces of destruction. Raw devastating power.' },
            { name: 'LEGENDARY', color: '#ffd700', icon: '👑', desc: 'The rarest and most powerful cards in the game.' },
          ].map(t => (
            <div key={t.name} className="type-card" style={{ '--type-color': t.color }}>
              <div className="type-icon">{t.icon}</div>
              <h3 className="type-name" style={{ color: t.color }}>{t.name}</h3>
              <p className="type-desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STORE */}
      <section id="store" className="store-section">
        <h2 className="section-title">BOOSTER <span className="accent-cyan">STORE</span></h2>
        <p className="store-subtitle">Physical booster packs shipped worldwide. Each pack contains randomized cards from the full 240+ card collection.</p>
        
        <div className="boosters-grid">
          {BOOSTERS.map(b => (
            <div key={b.id} className={`booster-card ${hovered === b.id ? 'booster-hovered' : ''}`}
              style={{ '--booster-color': b.color }}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}>
              <div className="booster-glow" />
              <div className="booster-icon">{b.icon}</div>
              <h3 className="booster-name">{b.name}</h3>
              <div className="booster-subtitle">{b.subtitle}</div>
              <div className="booster-preview">
                {Array.from({length: Math.min(5, b.cards)}).map((_, i) => (
                  <img key={i} src={`/cards/${FEATURED_CARDS[(i * 3 + BOOSTERS.indexOf(b)) % FEATURED_CARDS.length]}.png`} 
                    alt="" className="booster-preview-card" style={{ transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 5}px)` }} />
                ))}
              </div>
              <div className="booster-details">
                <div className="booster-detail"><span>📦</span> {b.cards} Cards</div>
                <div className="booster-detail"><span>⭐</span> {b.rarity}</div>
              </div>
              <p className="booster-desc">{b.desc}</p>
              <div className="booster-price">{b.price}</div>
              <button className="booster-buy-btn" style={{ borderColor: b.color, color: b.color }} onClick={() => addToCart(b)}>
                ADD TO CART
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PLAY CTA */}
      <section className="play-cta-section">
        <div className="play-cta-inner">
          <h2 className="play-cta-title">ENTER THE <span className="accent-pink">ARENA</span></h2>
          <p className="play-cta-desc">Battle against AI opponents with your collection. Free to play, no account needed.</p>
          <Link to="/play" className="cta-primary cta-large">
            <span className="cta-icon">▶</span> LAUNCH GAME
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-x">X</span>COPY<span className="logo-dot">::</span><span className="logo-arena">ARENA</span>
          </div>
          <div className="footer-disclaimer">
            Fan-made tribute game. All artwork by <a href="https://xcopy.art" target="_blank" rel="noopener" className="xcopy-link">XCOPY</a>. 
            Not affiliated with or endorsed by XCOPY. This project is for educational and entertainment purposes only.
          </div>
          <div className="footer-links">
            <a href="https://xcopy.art" target="_blank" rel="noopener">XCOPY.ART</a>
            <a href="https://twitter.com/xcaborz" target="_blank" rel="noopener">TWITTER</a>
            <a href="https://github.com/miladyxx333-lab/xcopy-game" target="_blank" rel="noopener">GITHUB</a>
          </div>
          <div className="footer-copy">© 2026 XCOPY::ARENA — Fan Project — All Art © XCOPY</div>
        </div>
      </footer>

      {/* CART DRAWER */}
      <div className={`cart-drawer ${isCartOpen ? 'cart-drawer-open' : ''}`}>
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />
        <div className="cart-content">
          <div className="cart-header">
            <h3>ORDER_SUMMARY</h3>
            <button className="cart-close" onClick={() => setIsCartOpen(false)}>×</button>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart-msg">Your collection is empty... for now.</div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item" style={{ '--item-color': item.color }}>
                  <div className="cart-item-info">
                    <div className="cart-item-icon">{item.icon}</div>
                    <div className="cart-item-meta">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{item.price}</div>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className="remove-item" onClick={() => removeFromCart(item.id)}>REMOVE</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <span>TOTAL</span>
                <span className="total-amount">${cartTotal.toFixed(2)}</span>
              </div>
              <button className="checkout-btn" onClick={() => alert('Proceeding to encrypted checkout...')}>
                SIGN & CHECKOUT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION */}
      {showNotif && (
        <div className="cart-notification">
          ✅ Added to cart! ({cartCount} items)
        </div>
      )}
    </div>
  )
}

export default Landing
