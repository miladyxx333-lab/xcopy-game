import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import DogCard from './DogCard.jsx'
import DogCanvas from '../dogs/DogCanvas.jsx'
import { getAllDogs, getCustoms, filterDogs, ALL_BREEDS } from './generateCollection.js'
import './collection.css'

const PER_PAGE   = 48
const TIERS      = ['ALL','COMMON','UNCOMMON','RARE','LEGENDARY']
const TIER_COLORS = { COMMON:'#888', UNCOMMON:'#ff7722', RARE:'#b026ff', LEGENDARY:'#ffe600' }

export default function Collection() {
  // Ensure body is scrollable
  useEffect(() => {
    document.body.classList.remove('game-active')
    document.body.style.overflow = ''
    window.scrollTo(0, 0)
  }, [])

  const [tier,   setTier]   = useState('ALL')
  const [breed,  setBreed]  = useState('ALL')
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [selected, setSelected] = useState(null)
  const [showCustoms, setShowCustoms] = useState(true)
  const [tab, setTab]       = useState('generated') // 'generated' | 'custom'
  const modalRef = useRef(null)

  // Lazy-load the full collection once
  const allDogs   = useMemo(() => getAllDogs(),   [])
  const customs   = useMemo(() => getCustoms(),   [])

  // Filtered + sorted dogs
  const filtered = useMemo(() => {
    const f = filterDogs(allDogs, { tier, breed, search })
    return f
  }, [allDogs, tier, breed, search])

  // Stats
  const stats = useMemo(() => {
    const s = { COMMON:0, UNCOMMON:0, RARE:0, LEGENDARY:0 }
    allDogs.forEach(d => s[d.rarity.tier]++)
    return s
  }, [allDogs])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const pageDogs   = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const goPage = (p) => {
    setPage(Math.max(1, Math.min(p, totalPages)))
    window.scrollTo({ top: 160, behavior: 'smooth' })
  }

  // Reset page when filter changes
  const setTierF   = (v) => { setTier(v);   setPage(1) }
  const setBreedF  = (v) => { setBreed(v);  setPage(1) }
  const setSearchF = (v) => { setSearch(v); setPage(1) }

  // Modal keyboard close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Download dog as PNG from modal
  const downloadDog = (dog) => {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 640
    const ctx = c.getContext('2d')
    ctx.imageSmoothingEnabled = false
    const src = modalRef.current?.querySelector('canvas')
    if (src) {
      ctx.drawImage(src, 0, 0, 512, 640)
      const a = document.createElement('a')
      a.href = c.toDataURL('image/png')
      a.download = `cryptodogo_${typeof dog.id === 'string' ? dog.id : String(dog.id).padStart(4,'0')}_${dog.traits.type.toLowerCase().replace(/\s+/g,'_')}.png`
      a.click()
    }
  }

  return (
    <div className="collection-page">
      <div className="coll-scanlines" />

      {/* ── NAV ────────────────────────────────────────── */}
      <nav className="coll-nav">
        <Link to="/" className="coll-nav-logo">🐶 CRYPTODOGOS</Link>
        <div className="coll-nav-links">
          <Link to="/">HOME</Link>
          <Link to="/play" className="coll-nav-play">▶ ARENA</Link>
        </div>
      </nav>

      <div className="coll-inner">
        {/* ── HEADER ─────────────────────────────────── */}
        <div className="coll-header">
          <span className="coll-tag">// THE_COLLECTION</span>
          <h1 className="coll-title">2,839 <span className="acc-amber">PIECES</span></h1>
          <p className="coll-subtitle">
            2,825 generated + 14 custom 1/1 archetypes. Every dog is rendered live from its traits.
          </p>
          <div className="coll-stats-row">
            {Object.entries(stats).map(([t, n]) => (
              <div key={t} className="coll-stat" style={{ '--tc': TIER_COLORS[t] }}>
                <span className="cs-num">{n.toLocaleString()}</span>
                <span className="cs-lbl">{t}</span>
              </div>
            ))}
            <div className="coll-stat" style={{ '--tc': '#ffe600' }}>
              <span className="cs-num">14</span>
              <span className="cs-lbl">CUSTOM 1/1</span>
            </div>
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────── */}
        <div className="coll-tabs">
          <button className={`coll-tab ${tab==='generated'?'active':''}`} onClick={() => setTab('generated')}>
            GENERATED ({allDogs.length.toLocaleString()})
          </button>
          <button className={`coll-tab coll-tab-custom ${tab==='custom'?'active':''}`} onClick={() => setTab('custom')}>
            ◆◆◆◆ CUSTOM 1/1 (14)
          </button>
        </div>

        {tab === 'custom' ? (
          /* ── CUSTOM 1/1 GRID ─────────────────────── */
          <div className="coll-custom-section">
            <p className="coll-custom-note">
              14 unique archetypes, each hand-coded pixel by pixel by Claude. No two alike.
              Each one is a LEGENDARY 1/1 — exists only once in this collection.
            </p>
            <div className="coll-custom-grid">
              {customs.map(dog => (
                <DogCard key={dog.id} dog={dog} onClick={setSelected} />
              ))}
            </div>
          </div>
        ) : (
          /* ── GENERATED GRID ──────────────────────── */
          <>
            {/* Filters */}
            <div className="coll-filters">
              <div className="filter-tier">
                {TIERS.map(t => (
                  <button
                    key={t}
                    className={`tier-pill ${tier===t?'active':''}`}
                    style={{ '--tc': TIER_COLORS[t] || '#888' }}
                    onClick={() => setTierF(t)}
                  >{t === 'ALL' ? 'ALL' : `◆ ${t}`}</button>
                ))}
              </div>

              <div className="filter-right">
                <select className="filter-select" value={breed} onChange={e => setBreedF(e.target.value)}>
                  <option value="ALL">ALL BREEDS</option>
                  {ALL_BREEDS.filter(b => b !== 'ALL').map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <input
                  className="filter-search"
                  placeholder="Search breed..."
                  value={search}
                  onChange={e => setSearchF(e.target.value)}
                />
              </div>
            </div>

            {/* Count */}
            <div className="coll-count">
              {filtered.length.toLocaleString()} dogs · page {page}/{totalPages || 1}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="coll-empty">No dogs match this filter.</div>
            ) : (
              <div className="coll-grid">
                {pageDogs.map(dog => (
                  <DogCard key={dog.id} dog={dog} onClick={setSelected} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="coll-pagination">
                <button onClick={() => goPage(1)}       disabled={page===1}>«</button>
                <button onClick={() => goPage(page-1)}  disabled={page===1}>‹</button>

                {/* Page numbers — show window of 5 around current */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  return start + i
                }).map(p => (
                  <button
                    key={p}
                    className={p === page ? 'active-page' : ''}
                    onClick={() => goPage(p)}
                  >{p}</button>
                ))}

                <button onClick={() => goPage(page+1)}      disabled={page===totalPages}>›</button>
                <button onClick={() => goPage(totalPages)}  disabled={page===totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL ──────────────────────────────────────── */}
      {selected && (
        <div className="dog-modal-overlay" onClick={() => setSelected(null)}>
          <div className="dog-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>

            <div className="modal-left">
              <DogCanvas
                traits={selected.traits}
                seed={`modal-${selected.id}`}
                scale={1}
                className="modal-canvas"
              />
              <button className="modal-dl-btn" onClick={() => downloadDog(selected)}>
                ↓ DOWNLOAD PNG
              </button>
            </div>

            <div className="modal-right">
              <div className="modal-id">
                #{typeof selected.id === 'string' ? selected.id : String(selected.id).padStart(4,'0')}
                {selected.custom && <span className="modal-custom-tag">CUSTOM 1/1</span>}
              </div>
              <div className="modal-breed">{selected.traits.type}</div>
              <div className="modal-tier" style={{ color: selected.rarity.color }}>
                {'◆'.repeat({ COMMON:1, UNCOMMON:2, RARE:3, LEGENDARY:4 }[selected.rarity.tier])}
                &nbsp;{selected.rarity.tier}
                {!selected.custom && <span className="modal-score"> · {selected.rarity.score}/{selected.rarity.max} pts</span>}
              </div>

              <div className="modal-traits">
                {[
                  ['HAT',        selected.traits.hat],
                  ['EARS',       selected.traits.beard],
                  ['EYEWEAR',    selected.traits.glasses],
                  ['OUTFIT',     selected.traits.body],
                  ['COLLAR',     selected.traits.chain],
                  ['FUR',        selected.traits.skin],
                  ['EYES',       selected.traits.eye],
                  ['MOUTH',      selected.traits.mouth],
                  ['MARKINGS',   selected.traits.hair],
                  ['ACCESSORY',  selected.traits.accessory],
                  ['BACKGROUND', selected.traits.bg],
                  ['FRAME',      selected.traits.frame],
                  ['PALETTE',    selected.traits.palette],
                ].map(([label, val]) => (
                  <div key={label} className="trait-row">
                    <span className="trait-label">{label}</span>
                    <span className="trait-val">{val?.split('(')[0].trim() || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
