let audioCtx = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, type, duration, volume = 0.1) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playBreakSound() {
  playTone(150, 'square', 0.1, 0.05);
  setTimeout(() => playTone(100, 'square', 0.05, 0.05), 20);
}

export function playPlaceSound() {
  playTone(80, 'triangle', 0.1, 0.1);
}

export function playPigSound() {
  playTone(300, 'sawtooth', 0.15, 0.05);
  setTimeout(() => playTone(250, 'sawtooth', 0.1, 0.05), 100);
}

export function playSheepSound() {
  playTone(400, 'sawtooth', 0.2, 0.05);
  setTimeout(() => playTone(350, 'sawtooth', 0.15, 0.05), 150);
}

export function playVillagerSound() {
  playTone(200, 'triangle', 0.2, 0.08);
}

export function playZombieSound() {
  playTone(80, 'sawtooth', 0.4, 0.1);
  setTimeout(() => playTone(60, 'sawtooth', 0.3, 0.1), 200);
}

export function playHurtSound() {
  playTone(200, 'square', 0.1, 0.15);
  setTimeout(() => playTone(150, 'square', 0.1, 0.15), 100);
}
