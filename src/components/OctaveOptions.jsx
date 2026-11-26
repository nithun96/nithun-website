import { useTranslation } from 'react-i18next'
import { octaveOptions } from '../audio/yourSound'

/**
 * The octave check's options: the pitch, an octave lower and an octave higher
 * (any outside the range left out), each with Play and Choose. Shared by the
 * slider and the guide. `playingHz` is the option playing now, or null.
 */
export default function OctaveOptions({ chosen, hz, playingHz, onPlay, onChoose }) {
  const { t } = useTranslation()
  return (
    <ul className="ys-options">
      {octaveOptions(chosen).map(o => {
        const name = t(`silence.yourSound.octave.${o.id}`)
        const on = playingHz === o.hz
        return (
          <li key={o.id} className="ys-option">
            <button type="button" className="ys-btn ys-play" aria-pressed={on}
              aria-label={t(on ? 'silence.yourSound.stopOption' : 'silence.yourSound.playOption', { option: name, pitch: hz(o.hz) })}
              onClick={() => onPlay(o)}>
              <span className="ys-dot" aria-hidden="true" />
              {t(on ? 'silence.yourSound.stop' : 'silence.yourSound.play')}
            </button>
            <span className="ys-option-name" aria-hidden="true">
              {name} <span className="ys-option-hz">{hz(o.hz)}</span>
            </span>
            <button type="button" className="ys-btn ys-btn-main"
              aria-label={t('silence.yourSound.chooseOption', { option: name, pitch: hz(o.hz) })}
              onClick={() => onChoose(o.hz)}>
              {t('silence.yourSound.choose')}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
