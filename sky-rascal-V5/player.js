// ─── Mobile detection ─────────────────────────────────────────
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
               || ('ontouchstart' in window);

const touchCtrl    = document.getElementById("touchControls");
const joystickZone = document.getElementById("joystickZone");
const joystickThumb= document.getElementById("joystickThumb");
const shootBtn     = document.getElementById("shootBtn");
const pauseBtn     = document.getElementById("pauseBtn");

function updateTouchVisibility() {
  if (!isMobile) return;
  const activeStates = ["playing","bossdying","tunnel","tunnelready","shipboss","shipenter","escaping","wave4intro","wave5intro","headdetach","cinematic","ground","ground2"];
  touchCtrl.style.display = activeStates.includes(state) ? "block" : "none";
}

// ─── Virtual joystick ─────────────────────────────────────────
const joy = { dx: 0, dy: 0, active: false, id: null, startX: 0, startY: 0 };
const joyR = 55;

joystickZone.addEventListener("touchstart", e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  const rect = joystickZone.getBoundingClientRect();
  joy.active = true; joy.id = t.identifier;
  joy.startX = rect.left + rect.width / 2;
  joy.startY = rect.top  + rect.height / 2;
  joy.dx = 0; joy.dy = 0;
}, { passive: false });

joystickZone.addEventListener("touchmove", e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    if (t.identifier !== joy.id) continue;
    let dx = t.clientX - joy.startX;
    let dy = t.clientY - joy.startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > joyR) { dx = dx/dist*joyR; dy = dy/dist*joyR; }
    joy.dx = dx / joyR; joy.dy = dy / joyR;
    joystickThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}, { passive: false });

function joyEnd(e) {
  e.preventDefault();
  joy.dx = 0; joy.dy = 0; joy.active = false;
  joystickThumb.style.transform = "translate(-50%,-50%)";
}
joystickZone.addEventListener("touchend",   joyEnd, { passive: false });
joystickZone.addEventListener("touchcancel",joyEnd, { passive: false });

let touchShooting = false;
shootBtn.addEventListener("touchstart", e => { e.preventDefault(); touchShooting = true;  }, { passive: false });
shootBtn.addEventListener("touchend",   e => { e.preventDefault(); touchShooting = false; }, { passive: false });
shootBtn.addEventListener("touchcancel",e => { e.preventDefault(); touchShooting = false; }, { passive: false });
if (pauseBtn) {
  pauseBtn.addEventListener("touchend", e => {
    e.preventDefault(); getAudio();
    const active = ["playing","bossdying","tunnel","tunnelready","shipboss","shipenter","escaping","wave4intro","wave5intro","headdetach","cinematic","ground","ground2"];
    if (active.includes(state) || paused) { paused=!paused; pauseIndex=0; sfxMenuMove(); }
  }, { passive: false });
}

// ─── Keyboard ─────────────────────────────────────────────────
const keys = {};
document.addEventListener("keydown", e => {
  getAudio();
  keys[e.key] = true;

  const activeStates = ["playing","bossdying","tunnel","tunnelready","shipboss","shipenter","escaping","wave4intro","wave5intro","headdetach","cinematic","ground","ground2"];
  if ((e.key === "Escape" || e.key === "p" || e.key === "P") && activeStates.includes(state)) {
    paused = !paused; pauseIndex = 0; sfxMenuMove(); return;
  }
  if (paused) {
    if (e.key === "ArrowUp"   || e.key === "w" || e.key === "W") { pauseIndex = (pauseIndex+1)%2; sfxMenuMove(); }
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { pauseIndex = (pauseIndex+1)%2; sfxMenuMove(); }
    else if (e.key === "Enter" || e.key === " ") handlePauseSelect();
    else if (e.key === "Escape") { paused = false; sfxMenuMove(); }
    return;
  }
  if (state === "cinematic" && (e.key === " " || e.key === "Escape")) {
    startGameActual(); return;
  }
  if (state === "start") {
    if (e.key === "ArrowUp"   || e.key === "w" || e.key === "W") menuUp();
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") menuDown();
    else if (e.key === "Enter" || e.key === " ") handleMenuSelect();
    else if (e.key === "Escape") menuBack();
  } else if (state === "gameover" || state === "win") {
    paused = false;
    state = "start"; menuIndex = 0; debugOpen = false;
  }
});
document.addEventListener("keyup", e => { keys[e.key] = false; });
canvas.addEventListener("click", e => {
  getAudio();
  if (paused) { handlePauseClick(e); return; }
  if (state === "start") {
    handleMenuClick(e);
  } else if (state === "gameover" || state === "win") {
    paused = false;
    state = "start"; menuIndex = 0; debugOpen = false;
  }
});
canvas.addEventListener("touchend", e => {
  e.preventDefault();
  getAudio();
  if (paused) { handlePauseTap(e); return; }
  if (state === "start") {
    handleMenuTap(e);
  } else if (state === "gameover" || state === "win") {
    paused = false;
    state = "start"; menuIndex = 0; debugOpen = false;
  }
}, { passive: false });

// ─── Player input ─────────────────────────────────────────────
