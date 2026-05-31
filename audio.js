// ─── Audio engine ─────────────────────────────────────────────
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // iOS requires resume after a user gesture
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, duration, vol=0.3, freqEnd=null) {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime+duration);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime+duration);
  } catch(e) {}
}

function sfxShoot()      { if(sfxEnabled) playTone(880, "square", 0.08, 0.15, 440); }
function sfxHitEnemy()   { if(sfxEnabled) playTone(220, "sawtooth", 0.12, 0.2, 110); }
function sfxExplode()    { if(sfxEnabled) playTone(120, "sawtooth", 0.35, 0.4, 40); }
function sfxPlayerHit()  { if(sfxEnabled) playTone(180, "square", 0.4, 0.5, 60); }
function sfxWaveClear()  {
  if(!sfxEnabled) return;
  playTone(523, "square", 0.1, 0.2);
  setTimeout(()=>playTone(659, "square", 0.1, 0.2), 120);
  setTimeout(()=>playTone(784, "square", 0.2, 0.2), 240);
}
function sfxBossHit()    { if(sfxEnabled) playTone(80, "sawtooth", 0.2, 0.5, 50); }
function sfxWin() {
  if(!sfxEnabled) return;
  [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,"square",0.2,0.25),i*150));
}
function sfxMenuMove()   { if(sfxEnabled) playTone(440, "square", 0.05, 0.1); }
function sfxMenuSelect() { if(sfxEnabled) playTone(880, "square", 0.08, 0.15, 1200); }
