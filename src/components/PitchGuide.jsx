import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { startMatchTone, setMatchTone, stopMatchTone } from '../audio/noisePlayer'
import {
  SPEC, START_HZ, START_TONE_DB, MIN_TONE_DB, MAX_TONE_DB,
  matchSoundFor, refineOptions, refineStep, setGuideDone,
} from '../audio/yourSound'
import OctaveOptions from './OctaveOptions'

// The step-by-step guide to finding your pitch, shown the first time someone taps
// Match my tinnitus. The same steps as the iOS app (ios/Silence/PitchGuideView.swift):
//   1 Before you start · 2 Set a comfortable level · 3 Whistle or hiss?
//   4 Get close (the seven ladder sounds) · 5 Narrow it down (four rounds)
//   6 Octave check · 7 Done
// The pitch arithmetic is in yourSound.js (refineStep, octave check), tested
// against the examples in shared/silence-pitch-spec.json, like the app's.
// Safety: the sound starts at levelStartDb (−50 dBFS) and can't go above
// levelMaxDb (−20 dBFS). Closing the dialog (Cancel, Escape) stops it.

const STEPS = ['start', 'level', 'kind', 'ladder', 'refine', 'octave', 'done']
const LADDER = SPEC.ladderHz
const ROUNDS = SPEC.refineStepsSemitones

export default function PitchGuide({ hz, startKind, onKind, onStopSound, onUse, onSlider, onClose }) {
  const { t } = useTranslation()
  const titleRef = useRef(null)
  const timer = useRef(null)
  const [step, setStep] = useState('start')
  const [level, setLevel] = useState(START_TONE_DB)
  const [kind, setKind] = useState(startKind)
  const [playingHz, setPlayingHz] = useState(null)   // what's sounding now, or null
  const [rung, setRung] = useState(0)                // Get close: which of the seven
  const [round, setRound] = useState(0)              // Narrow it down: which round
  const [current, setCurrent] = useState(START_HZ)   // the pitch so far

  // Each new step: focus its heading, so screen readers announce it (after the
  // dialog has opened, on the first step)
  useEffect(() => {
    const id = requestAnimationFrame(() => titleRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [step, round])

  // Leaving the guide (Cancel, Escape, the slider) stops the sound
  useEffect(() => () => { clearTimeout(timer.current); stopMatchTone() }, [])

  const stop = () => {
    clearTimeout(timer.current)
    stopMatchTone()
    setPlayingHz(null)
  }

  // Play `atHz` at the level set in step 2, with the sound picked in step 3.
  // `seconds`: stop by itself after that long (the sounds to compare); without
  // it, keep playing (setting the level). Started inside the tap, so browsers allow it.
  const play = (atHz, { seconds = SPEC.guidePlaySeconds, atLevel = level, as = kind } = {}) => {
    clearTimeout(timer.current)
    startMatchTone(atHz, atLevel, () => { clearTimeout(timer.current); setPlayingHz(null) }, as)
      ?.catch(() => setPlayingHz(null))
    onStopSound()
    setPlayingHz(atHz)
    if (seconds) timer.current = setTimeout(stop, seconds * 1000)
  }

  const toggle = atHz => (playingHz === atHz ? stop() : play(atHz))

  const go = next => setStep(next)

  // 2 · Set a comfortable level: always from levelStartDb, playing until Next
  const startLevel = () => {
    setLevel(START_TONE_DB)
    play(START_HZ, { seconds: 0, atLevel: START_TONE_DB })
    go('level')
  }

  const changeLevel = db => {
    setLevel(db)
    if (playingHz !== null) setMatchTone(playingHz, db, kind)
  }

  // 3 · Whistle or hiss? Then 4 · Get close starts with its first sound
  const chooseKind = answer => {
    const k = matchSoundFor(answer)
    setKind(k)
    onKind(k)
    setRung(0)
    play(LADDER[0], { as: k })
    go('ladder')
  }

  const showRung = i => {
    setRung(i)
    play(LADDER[i])
  }

  const pickRung = () => {
    stop()
    setCurrent(LADDER[rung])
    setRound(0)
    go('refine')
  }

  // 5 · Narrow it down
  const answerRound = answer => {
    stop()
    setCurrent(refineStep(current, ROUNDS[round], answer))
    if (round + 1 < ROUNDS.length) setRound(round + 1)
    else go(SPEC.octaveCheck ? 'octave' : 'done')
  }

  // 6 · Octave check → 7 · Done
  const finishOctave = atHz => {
    stop()
    setCurrent(atHz)
    setGuideDone()
    go('done')
  }

  const toSlider = () => {
    stop()
    onSlider(step === 'start' || step === 'level' || step === 'kind' ? START_HZ : current)
  }

  const n = STEPS.indexOf(step) + 1
  const title = (
    <>
      <p className="ys-k ys-count">{t('silence.yourSound.guide.stepOf', { n, total: STEPS.length })}</p>
      <h3 ref={titleRef} tabIndex={-1} className="ys-step-title">
        {t(`silence.yourSound.guide.${step}Title`)}
        {step === 'refine' && (
          <span className="ys-step-sub">{t('silence.yourSound.guide.refineCount', { n: round + 1, total: ROUNDS.length })}</span>
        )}
      </h3>
    </>
  )
  const skip = (
    <p className="ys-skip">
      <button type="button" className="ys-link" onClick={toSlider}>{t('silence.yourSound.guide.skip')}</button>
    </p>
  )
  const cancel = <button type="button" className="ys-btn" onClick={onClose}>{t('silence.yourSound.cancel')}</button>
  const playButton = (atHz, label, stopLabel, ariaLabel) => {
    const on = playingHz === atHz
    return (
      <button type="button" className="ys-btn ys-play" aria-pressed={on} aria-label={ariaLabel}
        onClick={() => toggle(atHz)}>
        <span className="ys-dot" aria-hidden="true" />
        {on ? stopLabel : label}
      </button>
    )
  }

  return (
    <div className="ys-guide">
      {title}

      {step === 'start' && (
        <>
          <p>{t('silence.yourSound.guide.start1')}</p>
          <p className="ys-muted">{t('silence.yourSound.guide.start2')}</p>
          <div className="ys-actions">
            <button type="button" className="ys-btn ys-btn-main" onClick={startLevel}>{t('silence.yourSound.guide.start')}</button>
            {cancel}
          </div>
          {skip}
        </>
      )}

      {step === 'level' && (
        <>
          <p>{t('silence.yourSound.guide.level1')}</p>
          <p className="ys-muted">{t('silence.yourSound.guide.level2')}</p>
          <div className="ys-row">
            <label className="ys-k" htmlFor="ys-guide-level">{t('silence.yourSound.soundVolume')}</label>
            <span className="ys-val" aria-hidden="true">{t('silence.yourSound.levelValue', { db: level })}</span>
          </div>
          <input id="ys-guide-level" className="ys-slider" type="range" min={MIN_TONE_DB} max={MAX_TONE_DB} step="1"
            value={level} aria-valuetext={t('silence.yourSound.levelValue', { db: level })}
            onChange={e => changeLevel(parseInt(e.target.value, 10))} />
          <div className="ys-actions">
            {playButton(START_HZ, t('silence.yourSound.play'), t('silence.yourSound.stop'))}
          </div>
          <div className="ys-actions">
            <button type="button" className="ys-btn ys-btn-main" onClick={() => { stop(); go('kind') }}>
              {t('silence.yourSound.guide.next')}
            </button>
            {cancel}
          </div>
          {skip}
        </>
      )}

      {step === 'kind' && (
        <>
          <p>{t('silence.yourSound.guide.kindText')}</p>
          <div className="ys-actions">
            {['whistle', 'hiss', 'unsure'].map(a => (
              <button key={a} type="button" className="ys-btn ys-btn-main" onClick={() => chooseKind(a)}>
                {t(`silence.yourSound.guide.${a}`)}
              </button>
            ))}
          </div>
          <div className="ys-actions">{cancel}</div>
          {skip}
        </>
      )}

      {step === 'ladder' && (
        <>
          <p>{t('silence.yourSound.guide.ladderText')}</p>
          <p className="ys-rung" aria-live="polite">
            <span className="ys-rung-n">{t('silence.yourSound.guide.ladderCount', { n: rung + 1, total: LADDER.length })}</span>
            {' '}<span className="ys-rung-hz">{hz(LADDER[rung])}</span>
          </p>
          <div className="ys-actions">
            {playButton(LADDER[rung], t('silence.yourSound.guide.playAgain'), t('silence.yourSound.stop'))}
            <button type="button" className="ys-btn" disabled={rung === 0} onClick={() => showRung(rung - 1)}>
              {t('silence.yourSound.guide.previous')}
            </button>
            <button type="button" className="ys-btn" disabled={rung === LADDER.length - 1} onClick={() => showRung(rung + 1)}>
              {t('silence.yourSound.guide.next')}
            </button>
          </div>
          <div className="ys-actions">
            <button type="button" className="ys-btn ys-btn-main" onClick={pickRung}>{t('silence.yourSound.guide.closest')}</button>
            {cancel}
          </div>
          {skip}
        </>
      )}

      {step === 'refine' && (() => {
        const o = refineOptions(current, ROUNDS[round])
        return (
          <>
            <p>{t('silence.yourSound.guide.refineText')}</p>
            <div className="ys-actions">
              {o.down !== null && playButton(o.down, t('silence.yourSound.guide.play1'), t('silence.yourSound.guide.stop1'))}
              {o.up !== null && playButton(o.up, t('silence.yourSound.guide.play2'), t('silence.yourSound.guide.stop2'))}
            </div>
            <div className="ys-actions">
              {o.down !== null && (
                <button type="button" className="ys-btn ys-btn-main" onClick={() => answerRound('down')}>{t('silence.yourSound.guide.closer1')}</button>
              )}
              {o.up !== null && (
                <button type="button" className="ys-btn ys-btn-main" onClick={() => answerRound('up')}>{t('silence.yourSound.guide.closer2')}</button>
              )}
              <button type="button" className="ys-btn" onClick={() => answerRound('unsure')}>{t('silence.yourSound.guide.unsure')}</button>
            </div>
            <div className="ys-actions">{cancel}</div>
          {skip}
          </>
        )
      })()}

      {step === 'octave' && (
        <>
          <p className="ys-muted">{t('silence.yourSound.octaveHint')}</p>
          <OctaveOptions chosen={current} hz={hz} playingHz={playingHz}
            onPlay={o => toggle(o.hz)} onChoose={finishOctave} />
          <div className="ys-actions">
            <button type="button" className="ys-btn" onClick={() => finishOctave(current)}>{t('silence.yourSound.skip')}</button>
            {cancel}
          </div>
          {skip}
        </>
      )}

      {step === 'done' && (
        <>
          <p className="ys-found">{t('silence.yourSound.centred', { pitch: hz(current) })}</p>
          <div className="ys-actions">
            <button type="button" className="ys-btn ys-btn-main" onClick={() => onUse(current)}>{t('silence.yourSound.usePitch')}</button>
            <button type="button" className="ys-btn" onClick={() => onSlider(current)}>{t('silence.yourSound.guide.fineTune')}</button>
            <button type="button" className="ys-btn" onClick={startLevel}>{t('silence.yourSound.guide.startAgain')}</button>
            {cancel}
          </div>
        </>
      )}
    </div>
  )
}
