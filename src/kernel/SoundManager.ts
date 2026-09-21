// Helix OS - High Fidelity Web Audio Synthesizer & Tactile Sound Engine
import { Settings } from './Settings';

export type SoundEffectType =
  | 'click'
  | 'toggle'
  | 'focus'
  | 'open'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'shade'
  | 'snap'
  | 'toast'
  | 'error'
  | 'success'
  | 'boot'
  | 'key'
  | 'dock'
  | 'trash'
  | 'bell'
  | 'launch';

export type SoundEffect = SoundEffectType;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private unlock() {
    if (this.isUnlocked) return;
    const ctx = this.initContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
      window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
    }
  }

  public playTone(freq: number, durationMs = 150, waveType: OscillatorType = 'sine', volumeScale = 1.0): void {
    const settings = Settings.get();
    if (!settings.soundEffectsEnabled || settings.isMuted || settings.volume <= 0) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const masterVol = (settings.volume / 100) * 0.25 * volumeScale;
      const now = ctx.currentTime;
      const durationSec = durationMs / 1000;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(masterVol, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.01);
    } catch {
      // Audio playback fallback
    }
  }

  public playMelody(notes: { freq: number; durationMs: number; wave?: OscillatorType }[]): void {
    let delay = 0;
    notes.forEach((note) => {
      setTimeout(() => {
        this.playTone(note.freq, note.durationMs, note.wave || 'sine');
      }, delay);
      delay += note.durationMs;
    });
  }

  public play(type: SoundEffectType): void {
    const settings = Settings.get();
    if (!settings.soundEffectsEnabled || settings.isMuted || settings.volume <= 0) {
      return;
    }

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const masterVol = (settings.volume / 100) * 0.22; // Safe non-distorting scaling

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'click': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

          gainNode.gain.setValueAtTime(masterVol * 0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'toggle': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.04);

          gainNode.gain.setValueAtTime(masterVol * 0.45, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'dock': {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(540, now);
          osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

          gainNode.gain.setValueAtTime(masterVol * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.055);
          break;
        }

        case 'open': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(440, now);
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

          osc2.frequency.setValueAtTime(660, now);
          osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

          gainNode.gain.setValueAtTime(masterVol * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.09);
          osc2.stop(now + 0.09);
          break;
        }

        case 'close': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.07);

          gainNode.gain.setValueAtTime(masterVol * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'shade':
        case 'minimize': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

          gainNode.gain.setValueAtTime(masterVol * 0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.07);
          break;
        }

        case 'maximize': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380, now);
          osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);

          gainNode.gain.setValueAtTime(masterVol * 0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.07);
          break;
        }

        case 'snap': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

          gainNode.gain.setValueAtTime(masterVol * 0.45, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'toast':
        case 'success': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';

          osc1.frequency.setValueAtTime(587.33, now); // D5
          osc1.frequency.setValueAtTime(880, now + 0.06); // A5

          gainNode.gain.setValueAtTime(masterVol * 0.45, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

          osc1.connect(gainNode);
          osc1.start(now);
          osc1.stop(now + 0.16);
          break;
        }

        case 'error': {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(160, now + 0.06);

          gainNode.gain.setValueAtTime(masterVol * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.13);
          break;
        }

        case 'boot': {
          // Elegant synth chord: F#3 - C#4 - F#4 - A#4
          const freqs = [185.0, 277.18, 369.99, 466.16];
          freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.04);
            osc.frequency.exponentialRampToValueAtTime(f * 1.002, now + 0.8);

            g.gain.setValueAtTime(0.0001, now + idx * 0.04);
            g.gain.exponentialRampToValueAtTime(masterVol * 0.35, now + 0.15 + idx * 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + 0.9);
          });
          break;
        }

        case 'key': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

          gainNode.gain.setValueAtTime(masterVol * 0.15, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.025);
          break;
        }

        case 'bell': {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);

          gainNode.gain.setValueAtTime(masterVol * 0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.26);
          break;
        }

        case 'trash': {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

          gainNode.gain.setValueAtTime(masterVol * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'launch': {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

          gainNode.gain.setValueAtTime(masterVol * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

          osc.connect(gainNode);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }
      }
    } catch {
      // Graceful fallback if Web Audio is unavailable
    }
  }
}

export const SoundManager = new SoundEngine();
