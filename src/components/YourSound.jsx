import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getYourSound, setTone, setFocus, setMatchedPitch, setMatchSound,
  startMatchTone, setMatchTone, stopMatchTone,
} from '../audio/noisePlayer'
import {
  SPEC, START_HZ, START_TONE_DB, MIN_TONE_DB, MAX_TONE_DB, MATCH_SOUNDS,
  positionToHz, hzToPosition, semitoneUp, semitoneDown, formatHz, octaveOptions,
} from '../audio/yourSound'

// Your sound, as in the iOS app: a tone slider (darker … brighter) and "Match my
// tinnitus", which finds the pitch of your tinnitus with a quiet tone or hiss so
// the sound can be lifted around it. The EQ itself is in the shared player, so the
// settings apply wherever Silence plays. Kept in this browser only.

const PITCH_STEPS = 1000   // the pitch slider's resolution (log scale)

export default function YourSound({ onStopSound }) {
  const { t, i18n } = useTranslation()
  const [s, setS] = useState(getYourSound)   // { tone, matchedHz, focusOn, matchSound }
  const [open, setOpen] = useState(false)
  const openerRef = useRef(null)    // where focus goes back to when the dialog closes
  const focusRef = useRef(null)
  const matchRef = useRef(null)

  const hz = v => formatHz(v, i18n.language)

  const amount = Math.round(Math.abs(s.tone) * 100)
  const toneText = amount === 0 ? t('silence.yourSound.toneNeutral')
    : t(s.tone < 0 ? 'silence.yourSound.toneDarker' : 'silence.yourSound.toneBrighter', { amount })

  const openMatch = e => {
    openerRef.current = e.currentTarget
    setOpen(true)
  }

  const closeMatch = used => {
    setOpen(false)
    // After "Use this pitch" the opener is gone; the focus switch takes its place
    requestAnimationFrame(() => (used ? focusRef.current : openerRef.current)?.focus())
  }

  const forget = () => {
    setS(setMatchedPitch(null))
    requestAnimationFrame(() => matchRef.current?.focus())   // the button that replaces this one
  }

  return (
    <section className="ys" aria-labelledby="ys-title">
      <div className="give-head">
        <h2 id="ys-title">{t('silence.yourSound.heading')}</h2>
        <p>{t('silence.yourSound.intro')}</p>
      </div>

      <div className="ys-grid">
        <div className="ys-block">
          <div className="ys-row">
            <label className="ys-k" htmlFor="ys-tone">{t('silence.yourSound.tone')}</label>
            <span className="ys-val" aria-hidden="true">{toneText}</span>
          </div>
          <input id="ys-tone" className="ys-slider" type="range" min="-1" max="1" step="0.1"
            value={s.tone} aria-valuetext={toneText}
            onChange={e => setS(setTone(parseFloat(e.target.value)))} />
          <div className="ys-ends" aria-hidden="true">
            <span>{t('silence.yourSound.darker')}</span>
            <span>{t('silence.yourSound.brighter')}</span>
          </div>
        </div>

        <div className="ys-block">
          {s.matchedHz !== null ? (
            <>
              <button ref={focusRef} type="button" className="ys-switch" aria-pressed={s.focusOn}
                onClick={() => setS(setFocus(!s.focusOn))}>
                <span className="ys-switch-text">
                  <span className="ys-switch-name">{t('silence.yourSound.focus')}</span>
                  <span className="ys-switch-sub">{t('silence.yourSound.centred', { pitch: hz(s.matchedHz) })}</span>
                </span>
                <span className="ys-state">
                  <span className="ys-dot" aria-hidden="true" />
                  {t(s.focusOn ? 'silence.yourSound.on' : 'silence.yourSound.off')}
                </span>
              </button>
              <div className="ys-actions">
                <button type="button" className="ys-btn" onClick={openMatch}>{t('silence.yourSound.matchAgain')}</button>
                <button type="button" className="ys-btn" onClick={forget}>
                  {t('silence.yourSound.forget')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="ys-p">{t('silence.yourSound.matchIntro')}</p>
              <button ref={matchRef} type="button" className="ys-btn ys-btn-main" onClick={openMatch}>{t('silence.yourSound.match')}</button>
            </>
          )}
        </div>
      </div>

      <p className="ys-note">{t('silence.yourSound.medical')}</p>

      {open && (
        <MatchDialog
          startHz={s.matchedHz ?? START_HZ}
          startKind={s.matchSound}
          hz={hz}
          onKind={k => setS(setMatchSound(k))}
          onStopSound={onStopSound}
          onUse={pitch => { setS(setMatchedPitch(pitch)); closeMatch(true) }}
          onClose={() => closeMatch(false)}
        />
      )}
    </section>
  )
}

// Find the pitch of your tinnitus with a soft tone or hiss. A modal <dialog>:
// the browser keeps focus inside it, and Escape closes it. Closing stops the sound.
// Safety: the sound always starts at −50 dBFS and can't go above −20 dBFS (both
// from shared/silence-pitch-spec.json).
//
// Two steps: find the pitch, then (after "Use this pitch") an octave check,
// because it's easy to pick the right note in the wrong octave.
function MatchDialog({ startHz, startKind, hz, onStopSound, onKind, onUse, onClose }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  const octaveRef = useRef(null)
  const [pitch, setPitch] = useState(startHz)
  const [level, setLevel] = useState(START_TONE_DB)
  const [kind, setKind] = useState(startKind)
  const [playing, setPlaying] = useState(false)
  const [chosen, setChosen] = useState(null)   // the pitch from step 1, during the octave check

  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => stopMatchTone()   // leaving the page or closing stops the sound
  }, [])

  useEffect(() => {
    if (playing) setMatchTone(pitch, level, kind)
  }, [playing, pitch, level, kind])

  useEffect(() => {
    if (chosen !== null) octaveRef.current?.focus()   // the new step's heading
  }, [chosen])

  // Start at `atLevel`. Start the sound first, then stop the other sound, so the
  // audio stays awake between
  const start = (atPitch, atLevel) => {
    startMatchTone(atPitch, atLevel, () => setPlaying(false), kind)?.catch(() => setPlaying(false))
    onStopSound()
    setPlaying(true)
  }

  const play = () => {
    setLevel(START_TONE_DB)   // always start very quietly
    start(pitch, START_TONE_DB)
  }

  const stop = () => {
    stopMatchTone()
    setPlaying(false)
  }

  const chooseKind = k => {
    setKind(k)
    onKind(k)
  }

  // Octave check: play an option (at the level already set), or stop it
  const playOption = o => {
    if (playing && pitch === o.hz) { stop(); return }
    setPitch(o.hz)
    if (!playing) start(o.hz, level)
  }

  const finish = hzToUse => {
    stop()
    onUse(hzToUse)
  }

  const toUse = () => {
    if (!SPEC.octaveCheck) { finish(pitch); return }
    setChosen(pitch)
  }

  const pitchText = hz(pitch)

  return (
    // onCancel: Escape. preventDefault keeps React in charge of closing.
    <dialog ref={ref} className="ys-dialog" aria-labelledby="ys-dialog-title"
      onCancel={e => { e.preventDefault(); onClose() }} onClose={onClose}>
      <h2 id="ys-dialog-title">{t('silence.yourSound.match')}</h2>

      {chosen === null ? (
        <>
          <p>{t('silence.yourSound.safety1')}</p>
          <p className="ys-muted">{t('silence.yourSound.safety2')}</p>

          <fieldset className="ys-choice">
            <legend className="ys-k">{t('silence.yourSound.compare')}</legend>
            <div className="ys-seg">
              {MATCH_SOUNDS.map(k => (
                <label key={k} className="ys-seg-opt">
                  <input type="radio" name="ys-kind" value={k} checked={kind === k}
                    onChange={() => chooseKind(k)} />
                  <span className="ys-dot" aria-hidden="true" />
                  {t(k === 'hiss' ? 'silence.yourSound.hiss' : 'silence.yourSound.toneSound')}
                </label>
              ))}
            </div>
            <p className="ys-hint">{t('silence.yourSound.compareHint')}</p>
          </fieldset>

          <button type="button" className="ys-btn ys-btn-main" aria-pressed={playing} onClick={playing ? stop : play}>
            <span className="ys-dot" aria-hidden="true" />
            {t(kind === 'hiss'
              ? (playing ? 'silence.yourSound.stopHiss' : 'silence.yourSound.playHiss')
              : (playing ? 'silence.yourSound.stopTone' : 'silence.yourSound.playTone'))}
          </button>

          <fieldset className="ys-fields" disabled={!playing}>
            <div className="ys-row">
              <label className="ys-k" htmlFor="ys-pitch">{t('silence.yourSound.pitch')}</label>
              <span className="ys-val" aria-hidden="true">{pitchText}</span>
            </div>
            <input id="ys-pitch" className="ys-slider" type="range" min="0" max={PITCH_STEPS} step="1"
              value={Math.round(hzToPosition(pitch) * PITCH_STEPS)} aria-valuetext={pitchText}
              onChange={e => setPitch(positionToHz(parseInt(e.target.value, 10) / PITCH_STEPS))} />
            <div className="ys-steps">
              <button type="button" className="ys-btn ys-step" aria-label={t('silence.yourSound.lower')}
                onClick={() => setPitch(semitoneDown)}>−</button>
              <button type="button" className="ys-btn ys-step" aria-label={t('silence.yourSound.higher')}
                onClick={() => setPitch(semitoneUp)}>+</button>
            </div>

            <div className="ys-row">
              <label className="ys-k" htmlFor="ys-level">{t('silence.yourSound.soundVolume')}</label>
              <span className="ys-val" aria-hidden="true">{t('silence.yourSound.levelValue', { db: level })}</span>
            </div>
            <input id="ys-level" className="ys-slider" type="range" min={MIN_TONE_DB} max={MAX_TONE_DB} step="1"
              value={level} aria-valuetext={t('silence.yourSound.levelValue', { db: level })}
              onChange={e => setLevel(parseInt(e.target.value, 10))} />
          </fieldset>

          <div className="ys-actions">
            <button type="button" className="ys-btn ys-btn-main" disabled={!playing} onClick={toUse}>
              {t('silence.yourSound.usePitch')}
            </button>
            <button type="button" className="ys-btn" onClick={onClose}>{t('silence.yourSound.cancel')}</button>
          </div>
        </>
      ) : (
        <>
          <h3 ref={octaveRef} tabIndex={-1} className="ys-step-title">{t('silence.yourSound.octaveTitle')}</h3>
          <p className="ys-muted">{t('silence.yourSound.octaveHint')}</p>
          <ul className="ys-options">
            {octaveOptions(chosen).map(o => {
              const name = t(`silence.yourSound.octave.${o.id}`)
              const on = playing && pitch === o.hz
              return (
                <li key={o.id} className="ys-option">
                  <button type="button" className="ys-btn ys-play" aria-pressed={on}
                    aria-label={t(on ? 'silence.yourSound.stopOption' : 'silence.yourSound.playOption', { option: name, pitch: hz(o.hz) })}
                    onClick={() => playOption(o)}>
                    <span className="ys-dot" aria-hidden="true" />
                    {t(on ? 'silence.yourSound.stop' : 'silence.yourSound.play')}
                  </button>
                  <span className="ys-option-name" aria-hidden="true">
                    {name} <span className="ys-option-hz">{hz(o.hz)}</span>
                  </span>
                  <button type="button" className="ys-btn ys-btn-main"
                    aria-label={t('silence.yourSound.chooseOption', { option: name, pitch: hz(o.hz) })}
                    onClick={() => finish(o.hz)}>
                    {t('silence.yourSound.choose')}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="ys-actions">
            <button type="button" className="ys-btn" onClick={() => finish(chosen)}>{t('silence.yourSound.skip')}</button>
            <button type="button" className="ys-btn" onClick={onClose}>{t('silence.yourSound.cancel')}</button>
          </div>
        </>
      )}
      <p className="ys-note">{t('silence.yourSound.kept')}</p>
    </dialog>
  )
}
