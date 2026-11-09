import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { createNoisePlayer } from '../audio/noisePlayer'

// Read with sound: a post can be read with one of Silence's sounds playing
// quietly underneath. The sound is made live in the browser by the same player
// as /silence (no files, nothing fetched). Tap a sound to start it, tap it again
// to stop. Once the choice has scrolled out of view, a small "Stop" pill stays
// in the corner so the reader never has to scroll back up to turn it off.
// Leaving the post stops the sound.
//
// To remove: delete this file, its <ReadWithSound /> line in
// WritingPostPage.jsx, the .rws styles in global.css and writing.readWith* in
// both translation files.

const SOUNDS = ['rain', 'ocean', 'brown', 'pink']
const VOLUME = 0.6   // quieter than Silence: it sits under the reading

export default function ReadWithSound() {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(null)   // sound id, or null
  const [inView, setInView] = useState(true)     // is the row of sounds on screen?
  const [player] = useState(() => {
    const p = createNoisePlayer(setPlaying)
    p.setVolume(VOLUME)
    return p
  })
  const rowRef = useRef(null)

  useEffect(() => () => player.stop(), [player])

  useEffect(() => {
    const el = rowRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const toggle = id => {
    if (playing === id) player.stop()
    else player.play(id, t(`silence.sounds.${id}`)).catch(() => setPlaying(null))
  }

  return (
    <>
      <div ref={rowRef} className="rws" role="group" aria-label={t('writing.readWithLabel')}>
        <span className="rws-label" aria-hidden="true">{t('writing.readWith')}</span>
        {SOUNDS.map(id => (
          <button key={id} type="button" className="rws-pill" aria-pressed={playing === id} onClick={() => toggle(id)}>
            <span className="rws-dot" aria-hidden="true" />
            {t(`silence.sounds.${id}`)}
          </button>
        ))}
      </div>

      {/* Portalled to body: the page's entrance animation would otherwise pin
          the "fixed" dock to the page instead of the screen */}
      {playing && !inView && createPortal(
        <aside className="rws-dock" aria-label={t('writing.readWithLabel')}>
          <span className="rws-dot on" aria-hidden="true" />
          <span>{t('writing.readWithPlaying', { sound: t(`silence.sounds.${playing}`) })}</span>
          <button type="button" className="rws-stop" onClick={() => player.stop()}>{t('writing.readWithStop')}</button>
        </aside>,
        document.body,
      )}
    </>
  )
}
