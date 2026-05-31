// ed-boss.js — ED-209 boss firing logic and debug entry point

function edFireEnergyLob() {
  if(!gnd.edBalls) gnd.edBalls = [];

  const L1_Y = ROAD_Y + 25;   // y=325
  const L2_Y = ROAD_Y + 100;  // y=400
  const L3_Y = 364;

  const originX = gnd.edX - 60;
  const originY = gnd.edTargetY - 65; // chest height

  const b1LandX = 40 + Math.random() * 460;
  const b2LandX = 40 + Math.random() * 460;
  const b3LandX = 40 + Math.random() * 460;

  [{landX: b1LandX, landY: L1_Y, lane:0},
   {landX: b2LandX, landY: L2_Y, lane:1},
   {landX: b3LandX, landY: L3_Y, lane:2}].forEach((cfg, i) => {
    const travelFrames = 80 + i*8;
    const vx = (cfg.landX - originX) / travelFrames;
    const g = 0.16;
    const vy = (cfg.landY - originY - 0.5*g*travelFrames*travelFrames) / travelFrames;

    gnd.edBalls.push({
      x: originX, y: originY,
      vx, vy, gravity: g,
      landX: cfg.landX, landY: cfg.landY,
      travelFrames,
      landed: false, landTimer: 0,
      alpha: 1, age: 0,
      lane: cfg.lane,
      isRocket: true,
    });
  });

  if(sfxEnabled) {
    playTone(280,"sawtooth",0.2,0.35,120);
    setTimeout(()=>playTone(260,"sawtooth",0.2,0.35,120), 130);
    setTimeout(()=>playTone(240,"sawtooth",0.2,0.35,120), 260);
  }
}

function startDebugGEBoss() {
  startGroundEscape2();
  gnd.distance = gnd.totalDist;
  gnd.speed = 0;
  gnd.phase = "ed_drop";
  gnd.edX = GAME_W - 155;
  gnd.edY = -280;
  gnd.edTargetY = 340;
  gnd.edSquash = 0;
  gnd.edStandAmt = 0;
  gnd.edTimer = 0;
  gnd.edSubPhase = "falling";
  gnd.edPhase = 1;
  gnd.edHp = 25;
  gnd.edMaxHp = 25;
  gnd.edHitFlash = 0;
  gnd.edFacing = 1;
  gnd.edLane = 1;
  gnd.edSliding = false;
  gnd.edSlideShootActive = false;
  gnd.edSlideShoot = null;
  gnd.edDashing = false;
  gnd.edDashTimer = 0;
  gnd.edMoveCount = 0;
  gnd.edLobCooldown = 0;
  gnd.edMoveTimer = undefined;
  gnd.edDyingTimer = 0;
  gnd.edBalls = [];
  gnd.rocketDrawHook = null;
  gnd.edSuperBlastActive = false;
  gnd.edSuperBlastPhase = null;
  gnd.edSuperBlastTimer = 0;
  gnd.edSuperBall = null;
  bullets = bullets.filter(b => !b.enemy);
}
