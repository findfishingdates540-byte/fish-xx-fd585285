// Simple notification sound using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (required for autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for a pleasant notification chime
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Use a sine wave for a soft, pleasant sound
    oscillator.type = 'sine';

    // Play two notes for a friendly "ding-dong" effect
    oscillator.frequency.setValueAtTime(830, now); // First note (G#5)
    oscillator.frequency.setValueAtTime(1046, now + 0.1); // Second note (C6)

    // Envelope for smooth attack and decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1); // Hold
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.12); // Second note attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Decay

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } catch (error) {
    // Silently fail if audio is not supported
    console.log('Could not play notification sound:', error);
  }
};

export const playBuddyRequestSound = () => {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for a slightly different sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';

    // Three ascending notes for buddy request
    oscillator.frequency.setValueAtTime(523, now); // C5
    oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(784, now + 0.2); // G5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.setValueAtTime(0.25, now + 0.1);
    gainNode.gain.setValueAtTime(0.25, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

export const playLikeReceivedSound = () => {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for a heart-like "flutter" sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';

    // Two quick ascending notes like a heartbeat
    oscillator.frequency.setValueAtTime(698, now); // F5
    oscillator.frequency.setValueAtTime(880, now + 0.08); // A5
    oscillator.frequency.setValueAtTime(1047, now + 0.16); // C6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.16);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    oscillator.start(now);
    oscillator.stop(now + 0.35);
  } catch (error) {
    console.log('Could not play like notification sound:', error);
  }
};
