import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { zIndex } from '../theme'

// Served by nginx from the easter-egg Secret, see k8s/frontend/deployment.yaml. Locally it comes
// from the gitignored public/egg/ folder. When the file is missing nothing shows.
const IMAGE_URL = '/egg/killer-feature.png'
const SHOW_MS = 1800
const BACKDROP = '#000'
const FLASH = '#ff1a1a'
const IMAGE_HEIGHT = '118dvh'
const SHAKE_PX = [0, -22, 18, -14, 12, -8, 0]
const SHAKE_SECONDS = 0.28
const ZOOM_SECONDS = 0.16
const ZOOM_FROM = 0.25
const ZOOM_PEAK = 1.3
const FLASH_OPACITY = [0.7, 0, 0.45, 0, 0.25, 0]
const FLASH_SECONDS = 0.6

const STING_SECONDS = 1.4
const STING_VOLUME = 0.32
const STING_ATTACK_SECONDS = 0.03
const STING_START_HZ = 950
const STING_END_HZ = 90
const SILENT_GAIN = 0.0001

// Plays a harsh falling screech made of noise and a sawtooth. Returns a function that frees the audio.
function playSting(): () => void {
  try {
    const context = new AudioContext()
    const now = context.currentTime
    const end = now + STING_SECONDS

    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * STING_SECONDS), context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1
    const noise = context.createBufferSource()
    noise.buffer = buffer

    const screech = context.createOscillator()
    screech.type = 'sawtooth'
    screech.frequency.setValueAtTime(STING_START_HZ, now)
    screech.frequency.exponentialRampToValueAtTime(STING_END_HZ, end)

    const gain = context.createGain()
    gain.gain.setValueAtTime(SILENT_GAIN, now)
    gain.gain.exponentialRampToValueAtTime(STING_VOLUME, now + STING_ATTACK_SECONDS)
    gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, end)

    noise.connect(gain)
    screech.connect(gain)
    gain.connect(context.destination)
    noise.start(now)
    screech.start(now)
    noise.stop(end)
    screech.stop(end)
    return () => void context.close()
  } catch {
    return () => {}
  }
}

// Full-screen photo with a sound, shown on the Konami code. Closes itself after a moment, or on any click or key.
export function KillerFeature({ onDone }: { onDone: () => void }) {
  const reducedMotion = usePrefersReducedMotion()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const image = new Image()
    image.onload = () => setLoaded(true)
    image.onerror = onDone
    image.src = IMAGE_URL
    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [onDone])

  useEffect(() => {
    if (!loaded) return
    const stopSting = playSting()
    const timer = window.setTimeout(onDone, SHOW_MS)
    window.addEventListener('keydown', onDone)
    return () => {
      stopSting()
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onDone)
    }
  }, [loaded, onDone])

  if (!loaded) return null

  return (
    <div
      data-testid="killer-feature"
      aria-hidden
      onClick={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: zIndex.killerFeature,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: BACKDROP,
        cursor: 'pointer',
      }}
    >
      <motion.div
        animate={reducedMotion ? undefined : { x: SHAKE_PX, y: SHAKE_PX.map((px) => -px / 2) }}
        transition={{ duration: SHAKE_SECONDS, repeat: Infinity, ease: 'linear' }}
      >
        <motion.img
          src={IMAGE_URL}
          alt=""
          initial={reducedMotion ? false : { scale: ZOOM_FROM, opacity: 0 }}
          animate={{ scale: reducedMotion ? 1 : [ZOOM_FROM, ZOOM_PEAK, 1], opacity: 1 }}
          transition={{ duration: ZOOM_SECONDS * 2, ease: 'easeOut' }}
          style={{ display: 'block', height: IMAGE_HEIGHT, width: 'auto', filter: 'contrast(1.35)' }}
        />
      </motion.div>
      <motion.div
        animate={{ opacity: FLASH_OPACITY }}
        transition={{ duration: FLASH_SECONDS, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, background: FLASH, mixBlendMode: 'multiply', pointerEvents: 'none' }}
      />
    </div>
  )
}
