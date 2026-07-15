import { MusicType } from '../types';

let activeIntervals: number[] = [];
let activeGainNodes: AudioNode[] = [];
let activeOscillators: OscillatorNode[] = [];

// Helper to clear active audio sources
export function stopProceduralMusic() {
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];

  activeOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // Ignore
    }
  });
  activeOscillators = [];
  activeGainNodes = [];
}

/**
 * Procedural music synthesizer using Web Audio API.
 * Synthesizes 3 offline, royalty-free audio tracks.
 * Returns a stop handle and the MediaStream destination for recording.
 */
export function playProceduralMusic(
  track: MusicType, 
  audioCtx: AudioContext,
  volume: number = 0.5
): { stop: () => void; destinationNode: MediaStreamAudioDestinationNode } {
  // Clear any existing track playing first
  stopProceduralMusic();

  const destinationNode = audioCtx.createMediaStreamDestination();
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(volume, audioCtx.currentTime);
  
  // Route to BOTH user speakers AND the stream destination
  masterGain.connect(audioCtx.destination);
  masterGain.connect(destinationNode);

  if (track === 'none') {
    return { stop: stopProceduralMusic, destinationNode };
  }

  const now = audioCtx.currentTime;

  if (track === 'lofi') {
    // --- LOFI DREAMS (72 BPM) ---
    // Chords: Cmaj7 (C3, E3, G3, B3) -> Am7 (A2, C3, E3, G3) -> Fmaj7 (F2, A3, C4, E4) -> G7 (G2, B3, D4, F4)
    const chords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [87.31,  220.00, 261.63, 329.63], // Fmaj7
      [98.00,  246.94, 293.66, 349.23], // G7
    ];

    const melodyScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
    const chordDuration = 3.5; // seconds
    let chordIndex = 0;

    const playChordStep = () => {
      const currentChord = chords[chordIndex];
      const stepTime = audioCtx.currentTime;

      // Play pad chords
      currentChord.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        // Soft, warm triangle wave
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        // Low-pass filter to sound warm and lofi
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, stepTime);
        filter.Q.setValueAtTime(1, stepTime);

        // Envelope: soft attack and long release
        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.08, stepTime + 0.8);
        gain.gain.setValueAtTime(0.08, stepTime + chordDuration - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(stepTime);
        osc.stop(stepTime + chordDuration);

        activeOscillators.push(osc);
      });

      // Play a soft sub bass note
      const baseNote = currentChord[0] / 2;
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(baseNote, stepTime);
      subGain.gain.setValueAtTime(0, stepTime);
      subGain.gain.linearRampToValueAtTime(0.12, stepTime + 0.4);
      subGain.gain.setValueAtTime(0.12, stepTime + chordDuration - 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, stepTime + chordDuration);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(stepTime);
      subOsc.stop(stepTime + chordDuration);
      activeOscillators.push(subOsc);

      chordIndex = (chordIndex + 1) % chords.length;
    };

    // Play first chord immediately
    playChordStep();
    const chordInterval = window.setInterval(playChordStep, chordDuration * 1000);
    activeIntervals.push(chordInterval);

    // Play random soft melody note every 1.5s
    const playMelodyStep = () => {
      const stepTime = audioCtx.currentTime;
      if (Math.random() > 0.3) {
        const randomNote = melodyScale[Math.floor(Math.random() * melodyScale.length)];
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(randomNote, stepTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, stepTime);

        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.04, stepTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(stepTime);
        osc.stop(stepTime + 1.3);
        activeOscillators.push(osc);
      }
    };
    const melodyInterval = window.setInterval(playMelodyStep, 1500);
    activeIntervals.push(melodyInterval);

    // Crackle noise generator for high vinyl fidelity
    const playCrackleStep = () => {
      const stepTime = audioCtx.currentTime;
      if (Math.random() > 0.5) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(Math.random() * 8000 + 4000, stepTime);
        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.003, stepTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.05);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(stepTime);
        osc.stop(stepTime + 0.06);
        activeOscillators.push(osc);
      }
    };
    const crackleInterval = window.setInterval(playCrackleStep, 250);
    activeIntervals.push(crackleInterval);

  } else if (track === 'inspirational') {
    // --- INSPIRATIONAL RISE (85 BPM) ---
    // Majestic swell pad chords: Dsus2 (146.83) -> A (110.00) -> Bm (123.47) -> G (98.00)
    const chords = [
      [146.83, 220.00, 293.66, 369.99], // Dsus2/F#
      [110.00, 220.00, 277.18, 329.63], // A
      [123.47, 185.00, 246.94, 293.66], // Bm
      [98.00,  196.00, 246.94, 293.66], // G
    ];

    const bellScale = [293.66, 329.63, 369.99, 440.00, 587.33, 659.25, 739.99]; // D major pentatonic
    const chordDuration = 4.0; // 4 seconds per chord
    let chordIndex = 0;

    const playChordStep = () => {
      const currentChord = chords[chordIndex];
      const stepTime = audioCtx.currentTime;

      currentChord.forEach(freq => {
        // High quality warm pad
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator(); // detuned for fatness
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, stepTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq + 1.2, stepTime); // slight detune

        filter.type = 'lowpass';
        // Swelling sweep on filter frequency
        filter.frequency.setValueAtTime(150, stepTime);
        filter.frequency.exponentialRampToValueAtTime(1200, stepTime + 2.5);
        filter.frequency.setValueAtTime(1200, stepTime + chordDuration - 0.8);
        filter.frequency.exponentialRampToValueAtTime(150, stepTime + chordDuration);
        filter.Q.setValueAtTime(2, stepTime);

        // Swelling volume envelope
        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.06, stepTime + 1.8);
        gain.gain.setValueAtTime(0.06, stepTime + chordDuration - 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + chordDuration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc1.start(stepTime);
        osc2.start(stepTime);
        osc1.stop(stepTime + chordDuration);
        osc2.stop(stepTime + chordDuration);

        activeOscillators.push(osc1, osc2);
      });

      // Swelling deep sub bass
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(currentChord[0] / 2, stepTime);
      subGain.gain.setValueAtTime(0, stepTime);
      subGain.gain.linearRampToValueAtTime(0.14, stepTime + 1.5);
      subGain.gain.setValueAtTime(0.14, stepTime + chordDuration - 0.6);
      subGain.gain.exponentialRampToValueAtTime(0.001, stepTime + chordDuration);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(stepTime);
      subOsc.stop(stepTime + chordDuration);
      activeOscillators.push(subOsc);

      chordIndex = (chordIndex + 1) % chords.length;
    };

    playChordStep();
    const chordInterval = window.setInterval(playChordStep, chordDuration * 1000);
    activeIntervals.push(chordInterval);

    // Fast sparkling bells climbing up
    const playBellStep = () => {
      const stepTime = audioCtx.currentTime;
      if (Math.random() > 0.4) {
        const bellFreq = bellScale[Math.floor(Math.random() * bellScale.length)];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Pure sparkling FM-like bells using sine + subtle triangle wave mix
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bellFreq, stepTime);

        gain.gain.setValueAtTime(0, stepTime);
        gain.gain.linearRampToValueAtTime(0.03, stepTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 1.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(stepTime);
        osc.stop(stepTime + 1.9);
        activeOscillators.push(osc);
      }
    };
    const bellInterval = window.setInterval(playBellStep, 800);
    activeIntervals.push(bellInterval);

  } else if (track === 'synthwave') {
    // --- SYNTHWAVE PULSE (110 BPM) ---
    // Fast pulsing arpeggiated retro bassline: Am -> G -> F -> Em
    const bassRoots = [55.00, 48.99, 43.65, 41.20]; // A1, G1, F1, E1
    const padChords = [
      [220.00, 261.63, 329.63], // Am
      [196.00, 246.94, 293.66], // G
      [174.61, 220.00, 261.63], // F
      [164.81, 196.00, 246.94], // Em
    ];
    
    const arpeggioNotes = [
      [220.00, 329.63, 440.00, 523.25, 659.25, 440.00], // Am
      [196.00, 293.66, 392.00, 493.88, 587.33, 392.00], // G
      [174.61, 261.63, 349.23, 440.00, 523.25, 349.23], // F
      [164.81, 246.94, 329.63, 392.00, 493.88, 329.63], // Em
    ];

    const barDuration = 4.0; // 4 seconds per bar
    let barIndex = 0;
    let tickCount = 0;

    const playBassTick = () => {
      const stepTime = audioCtx.currentTime;
      const root = bassRoots[barIndex];
      
      // Bouncing octave bass
      const actualFreq = tickCount % 2 === 0 ? root : root * 2;

      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(actualFreq, stepTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, stepTime);
      filter.frequency.exponentialRampToValueAtTime(100, stepTime + 0.2);

      gain.gain.setValueAtTime(0, stepTime);
      gain.gain.linearRampToValueAtTime(0.08, stepTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(stepTime);
      osc.stop(stepTime + 0.25);
      activeOscillators.push(osc);

      // Play arpeggio note
      const arpScale = arpeggioNotes[barIndex];
      const arpNote = arpScale[tickCount % arpScale.length];
      
      const arpOsc = audioCtx.createOscillator();
      const arpGain = audioCtx.createGain();
      
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpNote, stepTime);
      
      arpGain.gain.setValueAtTime(0, stepTime);
      arpGain.gain.linearRampToValueAtTime(0.03, stepTime + 0.01);
      arpGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.3);
      
      arpOsc.connect(arpGain);
      arpGain.connect(masterGain);
      
      arpOsc.start(stepTime);
      arpOsc.stop(stepTime + 0.32);
      activeOscillators.push(arpOsc);

      // Advance clock
      tickCount++;
      if (tickCount >= 16) { // 16 ticks per bar (4 seconds at 4 ticks per second)
        tickCount = 0;
        barIndex = (barIndex + 1) % bassRoots.length;
        
        // Also play a nice slow neon chord pad on bar boundaries
        const currentChord = padChords[barIndex];
        currentChord.forEach(freq => {
          const padOsc = audioCtx.createOscillator();
          const padGain = audioCtx.createGain();
          const padFilter = audioCtx.createBiquadFilter();

          padOsc.type = 'sawtooth';
          padOsc.frequency.setValueAtTime(freq, stepTime);

          padFilter.type = 'lowpass';
          padFilter.frequency.setValueAtTime(800, stepTime);

          padGain.gain.setValueAtTime(0, stepTime);
          padGain.gain.linearRampToValueAtTime(0.04, stepTime + 0.5);
          padGain.gain.setValueAtTime(0.04, stepTime + 3.0);
          padGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 3.9);

          padOsc.connect(padFilter);
          padFilter.connect(padGain);
          padGain.connect(masterGain);

          padOsc.start(stepTime);
          padOsc.stop(stepTime + 4.0);
          activeOscillators.push(padOsc);
        });
      }
    };

    // Play bass tickers every 250ms (quarter-notes at 120BPM/110BPM ratio)
    playBassTick();
    const bassInterval = window.setInterval(playBassTick, 250);
    activeIntervals.push(bassInterval);
  }

  return {
    stop: stopProceduralMusic,
    destinationNode
  };
}
