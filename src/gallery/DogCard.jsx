import { useEffect, useRef, useState } from 'react'
import DogCanvas from '../dogs/DogCanvas.jsx'

// Renders the canvas only when the card enters the viewport
export default function DogCard({ dog, onClick }) {
  const ref       = useRef(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { rootMargin: '150px' }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const { id, traits, rarity, custom, archetype } = dog

  return (
    <div
      ref={ref}
      className={`dog-card ${custom ? 'dog-card-custom' : ''}`}
      style={{ '--tier-color': rarity.color }}
      onClick={() => onClick(dog)}
    >
      <div className="dog-card-canvas-wrap">
        {vis
          ? <DogCanvas traits={traits} seed={`gallery-${id}`} scale={0.55} className="dog-card-canvas" />
          : <div className="dog-card-skeleton" />
        }
        {custom && <div className="custom-badge">1/1</div>}
      </div>

      <div className="dog-card-meta">
        <span className="dog-card-id">#{typeof id === 'string' ? id : String(id).padStart(4,'0')}</span>
        <span className="dog-card-breed">{traits.type}</span>
        <span className="dog-card-tier">◆ {rarity.tier}</span>
      </div>
    </div>
  )
}
