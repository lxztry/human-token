/**
 * HumanToken Sound Effects
 * Uses Web Audio API to generate synthesized sounds
 * No external audio files needed
 */

type SoundType = 'deduct' | 'warning' | 'achievement' | 'challenge' | 'death' | 'send' | 'click'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Audio not supported or blocked
  }
}

function playToneSequence(notes: Array<{ freq: number; duration: number; type?: OscillatorType; vol?: number }>) {
  try {
    const ctx = getAudioContext()
    let time = ctx.currentTime

    notes.forEach(({ freq, duration, type = 'sine', vol = 0.3 }) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = type
      oscillator.frequency.setValueAtTime(freq, time)

      gainNode.gain.setValueAtTime(vol, time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration)

      oscillator.start(time)
      oscillator.stop(time + duration)

      time += duration
    })
  } catch {
    // Audio not supported
  }
}

export const playSound = (type: SoundType) => {
  switch (type) {
    case 'deduct':
      // Cash register "cha-ching" effect
      playToneSequence([
        { freq: 1200, duration: 0.05, type: 'square', vol: 0.2 },
        { freq: 1600, duration: 0.08, type: 'square', vol: 0.2 },
        { freq: 2000, duration: 0.15, type: 'sine', vol: 0.25 },
      ])
      break

    case 'warning':
      // Low balance warning beep
      playToneSequence([
        { freq: 800, duration: 0.1, type: 'square', vol: 0.15 },
        { freq: 600, duration: 0.1, type: 'square', vol: 0.15 },
      ])
      break

    case 'achievement':
      // Triumphant fanfare
      playToneSequence([
        { freq: 523, duration: 0.1, type: 'sine', vol: 0.3 },
        { freq: 659, duration: 0.1, type: 'sine', vol: 0.3 },
        { freq: 784, duration: 0.15, type: 'sine', vol: 0.3 },
        { freq: 1047, duration: 0.25, type: 'sine', vol: 0.35 },
      ])
      break

    case 'challenge':
      // Challenge complete sound
      playToneSequence([
        { freq: 440, duration: 0.08, type: 'sine', vol: 0.25 },
        { freq: 554, duration: 0.08, type: 'sine', vol: 0.25 },
        { freq: 659, duration: 0.12, type: 'sine', vol: 0.3 },
      ])
      break

    case 'death':
      // Sad game-over sound
      playToneSequence([
        { freq: 400, duration: 0.3, type: 'sawtooth', vol: 0.2 },
        { freq: 300, duration: 0.4, type: 'sawtooth', vol: 0.15 },
        { freq: 200, duration: 0.5, type: 'sawtooth', vol: 0.1 },
      ])
      break

    case 'send':
      // Subtle send confirmation
      playToneSequence([
        { freq: 880, duration: 0.06, type: 'sine', vol: 0.15 },
        { freq: 1100, duration: 0.06, type: 'sine', vol: 0.12 },
      ])
      break

    case 'click':
      // UI click feedback
      playTone(600, 0.03, 'square', 0.1)
      break
  }
}

export const sounds = { playSound }
export type { SoundType }