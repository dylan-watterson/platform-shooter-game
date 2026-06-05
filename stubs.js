// stubs.js — remaining systems not yet split into own files
function spawnLaserCannon() {
  cannon.active = true; cannon.dead = false;
  cannon.hp = 80; cannon.maxHp = 80;
  cannon.phase2 = false;
  cannon.phase2hp = 30; cannon.phase2maxHp = 30;
  cannon.bodyExploding = false; cannon.bodyExplodeTimer = 0;
  cannon.posIdx = 2;
  cannon.y = CANNON_POSITIONS[2];
  cannon.targetY = cannon.y;
  cannon.cstate = "waiting";
  cannon.stateTimer = 60;
  cannon.laserY = cannon.y;
  cannon.laserAlpha = 0;
  enemies = [];
  initAbsorbers();
}

function updateLaserCannon() {
  if (!cannon.active || cannon.dead) return;

  cannon.stateTimer--;

  if (cannon.cstate === "moving") {
    // Slide toward target
    cannon.y += (cannon.targetY - cannon.y) * 0.1;
    // Arrived?
    if (Math.abs(cannon.y - cannon.targetY) < 1) {
      cannon.y = cannon.targetY;
      cannon.cstate = "waiting";
      cannon.stateTimer = 60 + Math.random()*40;
    }

  } else if (cannon.cstate === "waiting") {
    if (cannon.stateTimer <= 0) {
      cannon.cstate = "charging";
      cannon.stateTimer = cannon.phase2 ? 25 : 50;
      cannon.laserY = cannon.y;
      cannon.laserAlpha = 1;
    }

  } else if (cannon.cstate === "charging") {
    if (cannon.stateTimer <= 0) {
      cannon.cstate = "firing";
      cannon.stateTimer = cannon.phase2 ? 50 : 80;
    }

  } else if (cannon.cstate === "firing") {
    // Laser fully active — check player hit
    if (player.invincible <= 0) {
      if (Math.abs(player.y + player.h/2 - cannon.laserY) < 14 && player.x < GAME_W - 55) {
        playerHit(); updateHUD(); player.invincible=90;
        explode(player.x+player.w/2,player.y+player.h/2,"#ff4040","#ff0000",20);
        sfxPlayerHit();
      }
    }
    if (cannon.stateTimer <= 0) {
      cannon.cstate = "fading";
      cannon.stateTimer = 30;
    }

  } else if (cannon.cstate === "fading") {
    cannon.laserAlpha = cannon.stateTimer / 30;
    if (cannon.stateTimer <= 0) {
      cannon.laserAlpha = 0;
      let newIdx;
      do { newIdx = Math.floor(Math.random()*5); } while (newIdx === cannon.posIdx);
      cannon.posIdx = newIdx;
      cannon.targetY = CANNON_POSITIONS[newIdx];
      cannon.cstate = "moving";
      cannon.stateTimer = 0;
    }
  }

  // Body exploding transition
  if (cannon.bodyExploding) {
    cannon.bodyExplodeTimer--;
    if (frameCount%3===0) {
      explode(GAME_W-30+Math.random()*30, cannon.y+(Math.random()-0.5)*50, "#ff4020","#ffcc00", 12);
      if (frameCount%9===0) sfxExplode();
    }
    if (cannon.bodyExplodeTimer <= 0) {
      cannon.bodyExploding = false;
      cannon.phase2 = true;
      // Phase 2: faster firing, doesn't move
      cannon.cstate = "waiting";
      cannon.stateTimer = 40;
    }
    return;
  }

  // Player bullets vs cannon
  bullets = bullets.filter(b => {
    b.x += b.vx;
    if (b.x > GAME_W) return false;

    if (!cannon.phase2) {
      // Phase 1 — hit the body
      if (b.x >= GAME_W - 75 && Math.abs(b.y - cannon.y) < 32) {
        cannon.hp--;
        explode(b.x, b.y, "#ff6040","#ffcc00", 6);
        sfxHitEnemy();
        if (cannon.hp <= 0) {
          // Body destroyed — start explosion sequence
          cannon.bodyExploding = true;
          cannon.bodyExplodeTimer = 90;
          cannon.cstate = "waiting"; cannon.stateTimer = 9999;
          score += 1000;
        }
        return false;
      }
    } else {
      // Phase 2 — only the barrel tip is hittable
      const bTipX = GAME_W - 55 - 42; // barrel tip world X
      if (Math.abs(b.x - bTipX) < 15 && Math.abs(b.y - cannon.y) < 14) {
        cannon.phase2hp--;
        explode(b.x, b.y, "#00ffff","#ffffff", 8);
        if(sfxEnabled) playTone(600,"square",0.04,0.08,400);
        if (cannon.phase2hp <= 0) {
          cannon.dead = true; cannon.active = false;
          for (let i=0;i<8;i++) explode(GAME_W-55+(Math.random()-0.5)*60, cannon.y+(Math.random()-0.5)*60,"#ff4020","#ffcc00",20);
          sfxExplode(); sfxExplode(); sfxExplode(); score+=4000;
        }
        return false;
      }
    }
    return true;
  });

  if (cannon.dead) {
    setTimeout(()=>{
      if (state==="playing") {
        waveNum++;
        sfxWaveClear();
        enemyBullets=[]; bullets=[]; particles=[];
        startWave5Intro();
      }
    }, 1500);
    cannon.active = false;
  }
}

function drawLaserCannon() {
  if (!cannon.active && !cannon.dead) return;
  const cx = GAME_W - 55;
  const cy = cannon.y;
  const hpR = cannon.hp / cannon.maxHp;
  const cs = cannon.cstate;

  ctx.save();

  // ── Laser beam (drawn behind cannon) ──
  if (cs === "charging") {
    // Dashed warning line — locked to laserY
    if (Math.floor(frameCount/5)%2===0) {
      ctx.strokeStyle="rgba(255,50,50,0.7)";
      ctx.lineWidth=3; ctx.setLineDash([12,8]);
      ctx.beginPath(); ctx.moveTo(cx-10, cannon.laserY); ctx.lineTo(50, cannon.laserY); ctx.stroke();
      ctx.setLineDash([]);
    }
    // Warning label
    ctx.fillStyle="rgba(255,50,50,0.9)"; ctx.font="bold 12px Boogaloo,cursive";
    ctx.textAlign="center";
    ctx.fillText("⚠ LASER CHARGING ⚠", GAME_W/2, cannon.laserY - 18);

  } else if (cs === "firing" || cs === "fading") {
    const a = cs === "firing" ? 1 : cannon.laserAlpha;
    const p2 = cannon.phase2;
    ctx.shadowColor = p2?"#aa0000":"#ff2020"; ctx.shadowBlur=18*a;
    ctx.strokeStyle = p2?`rgba(180,0,0,${a*0.5})`:`rgba(255,80,0,${a*0.35})`; ctx.lineWidth=18;
    ctx.beginPath(); ctx.moveTo(cx-10, cannon.laserY); ctx.lineTo(50, cannon.laserY); ctx.stroke();
    ctx.strokeStyle = p2?`rgba(220,0,0,${a*0.9})`:`rgba(255,150,50,${a*0.8})`; ctx.lineWidth=6;
    ctx.beginPath(); ctx.moveTo(cx-10, cannon.laserY); ctx.lineTo(50, cannon.laserY); ctx.stroke();
    ctx.strokeStyle = p2?`rgba(255,80,80,${a})`:`rgba(255,255,200,${a})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx-10, cannon.laserY); ctx.lineTo(50, cannon.laserY); ctx.stroke();
    ctx.shadowBlur=0;
  }

  // ── Cannon body ──
  ctx.translate(cx, cy);

  // Wall mount always visible
  ctx.fillStyle="#1a1a2a"; ctx.fillRect(20,-38,30,76);
  ctx.strokeStyle="#4040aa"; ctx.lineWidth=1; ctx.strokeRect(20,-38,30,76);

  if (!cannon.phase2 && !cannon.bodyExploding) {
    // Phase 1 — full body
    ctx.fillStyle = hpR<0.4?"#882020":"#303050";
    ctx.fillRect(-18,-28,48,56);
    ctx.strokeStyle="#6060aa"; ctx.lineWidth=2; ctx.strokeRect(-18,-28,48,56);
    ctx.fillStyle="rgba(100,100,180,0.25)";
    ctx.fillRect(-8,-20,32,10); ctx.fillRect(-8,10,32,10);
    // HP bar
    ctx.fillStyle="#440000"; ctx.fillRect(-12,-40,40,7);
    ctx.fillStyle=hpR>0.5?"#00ff80":hpR>0.25?"#ffaa00":"#ff3030";
    ctx.fillRect(-12,-40,40*hpR,7);

  } else if (cannon.bodyExploding) {
    // Damaged crumbling body
    ctx.fillStyle="#882020"; ctx.fillRect(-18,-28,48,56);
    ctx.strokeStyle="#ff4040"; ctx.lineWidth=2; ctx.strokeRect(-18,-28,48,56);

  } else {
    // Phase 2 — exposed machinery where body was
    // Back plate / cavity
    ctx.fillStyle="#0a0a14";
    ctx.fillRect(-18,-28,48,56);

    // Spinning gear (centre)
    ctx.save();
    ctx.translate(8, 0);
    ctx.rotate(frameCount * 0.04);
    ctx.strokeStyle="rgba(150,150,80,0.8)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.stroke();
    for (let t=0;t<8;t++) {
      const a = t*Math.PI/4;
      ctx.fillStyle="rgba(120,120,60,0.9)";
      ctx.fillRect(Math.cos(a)*10-3, Math.sin(a)*10-3, 6, 6);
    }
    ctx.fillStyle="#1a1a08";
    ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // Horizontal drive shaft
    ctx.fillStyle="rgba(80,80,100,0.9)";
    ctx.fillRect(-16,-4,50,8);
    ctx.strokeStyle="rgba(100,100,140,0.6)"; ctx.lineWidth=1;
    ctx.strokeRect(-16,-4,50,8);

    // Scrolling cables / conduits
    const cableOffset = (frameCount*1.5)%14;
    ctx.strokeStyle="rgba(0,180,80,0.5)"; ctx.lineWidth=1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(-18,-16+cableOffset); ctx.lineTo(28,-16+cableOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, 8+cableOffset); ctx.lineTo(28, 8+cableOffset); ctx.stroke();
    ctx.setLineDash([]);

    // Pulsing energy cell
    const ePulse = 0.5+Math.sin(frameCount*0.2)*0.4;
    ctx.fillStyle=`rgba(255,80,0,${ePulse*0.8})`;
    ctx.fillRect(16,-10,10,20);
    ctx.strokeStyle=`rgba(255,120,0,${ePulse})`; ctx.lineWidth=1;
    ctx.strokeRect(16,-10,10,20);

    // Heavy smoke rising from machinery
    if (frameCount%2===0) {
      [-14, -4, 6, 16, 24].forEach(ox => {
        particles.push({
          x: cx + ox + (Math.random()-0.5)*4,
          y: cy - 20 + (Math.random()-0.5)*8,
          vx: (Math.random()-0.5)*0.8,
          vy: -(0.5+Math.random()*0.8),
          life: 0.9, decay: 0.007,
          r: 8+Math.random()*10,
          color: `rgba(${80+Math.floor(Math.random()*50)},${80+Math.floor(Math.random()*40)},${80+Math.floor(Math.random()*40)},0.45)`,
          type: "circle",
        });
      });
    }

    // Sparks
    if (Math.random()<0.12) {
      particles.push({
        x: cx + (-18+Math.random()*48),
        y: cy + (-28+Math.random()*56),
        vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3,
        life:0.5, decay:0.1, r:1+Math.random()*2,
        color:Math.random()>0.5?"#ff8020":"#ffcc00", type:"circle",
      });
    }
  }

  // Barrel — always shown
  const p2hpR = cannon.phase2hp / cannon.phase2maxHp;
  ctx.fillStyle = cannon.phase2 ? (p2hpR<0.5?"#662020":"#222240") : (hpR<0.4?"#662020":"#222240");
  ctx.fillRect(-42,-10,30,20);
  ctx.strokeStyle = cannon.phase2?"#00ccff":"#8080cc"; ctx.lineWidth=1.5;
  ctx.strokeRect(-42,-10,30,20);

  // Barrel tip
  const tipColor = cs==="firing"?"#ff6600" : cs==="charging"?(Math.floor(frameCount/5)%2===0?"#ff2020":"#660000") : cs==="fading"?`rgba(255,100,0,${cannon.laserAlpha})`:"#1a1a3a";
  if (cannon.phase2) {
    // Glowing weak point in phase 2
    const p2pulse = 0.6+Math.sin(frameCount*0.15)*0.4;
    ctx.shadowColor="#00ffff"; ctx.shadowBlur=20*p2pulse;
    ctx.fillStyle=cs==="firing"?"#ff6600":`rgba(0,200,255,${p2pulse})`;
    ctx.beginPath(); ctx.arc(-42,0,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#00ffff"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(-42,0,12,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    // Phase 2 HP bar above barrel
    ctx.fillStyle="#004444"; ctx.fillRect(-52,-26,30,6);
    ctx.fillStyle=p2hpR>0.5?"#00ffcc":p2hpR>0.25?"#ffaa00":"#ff3030";
    ctx.fillRect(-52,-26,30*p2hpR,6);
    // "WEAK POINT" label
    if (Math.floor(frameCount/12)%2===0) {
      ctx.fillStyle="#00ffff"; ctx.font="bold 9px Boogaloo,cursive"; ctx.textAlign="center";
      ctx.fillText("WEAK!", -42, -30);
    }
  } else {
    ctx.fillStyle=tipColor;
    ctx.beginPath(); ctx.arc(-42,0,10,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=cs==="firing"||cs==="charging"?"#ffaa00":"#4040aa";
    ctx.lineWidth=2; ctx.beginPath(); ctx.arc(-42,0,10,0,Math.PI*2); ctx.stroke();
  }

  ctx.restore();
}

let shipBoss = {
  x: GAME_W + 100, y: 0,
  w: 160, h: GAME_H,
  hp: 40, maxHp: 40,
  entryDone: false,
  dying: false,
  dyingTimer: 0,
  guns: [ // relative Y positions of gun ports
    {ry:0.2, timer:60, hp:10, maxHp:10, dead:false},
    {ry:0.4, timer:90, hp:10, maxHp:10, dead:false},
    {ry:0.6, timer:75, hp:10, maxHp:10, dead:false},
    {ry:0.8, timer:55, hp:10, maxHp:10, dead:false},
  ],
};

// ─── Ship enter animation ──────────────────────────────────────
let shipEnter = { timer:0, shipX:0, holeY:0, holeH:0, phase:0 };

function startShipEnter() {
  shipEnter.timer = 0;
  shipEnter.phase = 0;          // 0=big explosion, 1=hole blows open, 2=fly in
  shipEnter.shipX = GAME_W - 80;
  shipEnter.holeY = GAME_H/2;   // starts as a point, expands
  shipEnter.holeH = 0;          // grows during phase 1
  player.invincible = 120;
  bullets = []; enemyBullets = [];
  state = "shipenter";
}

function updateShipEnter() {
  shipEnter.timer++;
  const t = shipEnter.timer;

  clouds.forEach(c=>{ c.x -= 2; if(c.x+c.w<-100) c.x=GAME_W+50; });
  player.propAngle += 0.4;

  // ── Phase 0: Big explosion (0–120) ─────────────────────────
  if (shipEnter.phase === 0) {
    // Dense explosions all over the ship
    if (frameCount%2===0) {
      const ex = shipEnter.shipX + Math.random()*80;
      const ey = 20 + Math.random()*(GAME_H-40);
      explode(ex, ey, "#ff4020","#ffcc00", 14);
      if (frameCount%8===0) sfxExplode();
    }
    // Screen shake
    ctx.save();
    ctx.translate(Math.sin(t*4)*4*(1-t/120), Math.cos(t*3)*3*(1-t/120));

    drawBG();
    particles.forEach(drawParticle);
    particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});
    drawEnterShip();
    drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);
    ctx.restore();

    // Flash white at end of phase
    if (t > 100) {
      ctx.fillStyle=`rgba(255,255,255,${(t-100)/20})`;
      ctx.fillRect(0,0,GAME_W,GAME_H);
    }
    if (t >= 120) {
      shipEnter.phase = 1;
      shipEnter.timer = 0;
      sfxExplode();
    }

  // ── Phase 1: Hole blows open (0–60) ────────────────────────
  } else if (shipEnter.phase === 1) {
    // Hole is instantly at full size — it exploded open
    const targetH = 130;
    shipEnter.holeH = targetH;
    shipEnter.holeY = GAME_H/2 - targetH/2;

    // On first frame: burst of rubble chunks fly outward
    if (t === 1) {
      sfxExplode();
      const cx = shipEnter.shipX + 40; // centre of ship wall
      const cy = GAME_H/2;
      // Large rubble chunks
      for(let i=0;i<18;i++){
        const ang = Math.PI + (Math.random()-0.5)*1.8; // mostly leftward
        const spd = 3+Math.random()*8;
        particles.push({
          x:cx, y:cy+(Math.random()-0.5)*targetH*0.8,
          vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd-(Math.random()*3),
          life:1, decay:0.012,
          r:6+Math.random()*14,
          color:Math.random()>0.5?"#443322":"#665544",
          type:"circle",
        });
      }
      // Fire/spark burst
      for(let i=0;i<30;i++){
        const ang = Math.PI + (Math.random()-0.5)*2.4;
        const spd = 4+Math.random()*10;
        particles.push({
          x:cx, y:cy+(Math.random()-0.5)*targetH,
          vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
          life:1, decay:0.03,
          r:3+Math.random()*7,
          color:Math.random()>0.5?"#ff6020":"#ffcc00",
          type:"circle",
        });
      }
    }

    // Ongoing smoke/ember trickle from hole
    if(frameCount%2===0){
      particles.push({
        x:shipEnter.shipX-4, y:shipEnter.holeY+Math.random()*targetH,
        vx:-(0.5+Math.random()*1.5), vy:(Math.random()-0.5)*1,
        life:0.7, decay:0.014, r:4+Math.random()*8,
        color:Math.random()>0.5?"rgba(80,60,40,0.6)":"rgba(255,80,0,0.5)",
        type:"circle",
      });
    }

    drawBG();
    particles.forEach(drawParticle);
    particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.life-=p.decay;return p.life>0;});
    drawEnterShip();
    drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);

    // "ENTERING THE SHIP!" label fades in
    if (t > 20) {
      ctx.save(); ctx.textAlign="center";
      ctx.globalAlpha = Math.min((t-20)/20, 1);
      ctx.fillStyle="#f5c842"; ctx.font="bold 26px Rancho,cursive";
      ctx.strokeStyle="#000"; ctx.lineWidth=4;
      ctx.strokeText("ENTERING THE SHIP!", GAME_W/2, 80);
      ctx.fillText("ENTERING THE SHIP!", GAME_W/2, 80);
      ctx.restore();
    }

    if (t >= 60) {
      shipEnter.phase = 2;
      shipEnter.timer = 0;
    }

  // ── Phase 2: Fly in (0 onwards) ────────────────────────────
  } else {
    // Player flies right toward hole
    player.x += 5;
    const holeCentreY = shipEnter.holeY + shipEnter.holeH/2 - player.h/2;
    player.y += (holeCentreY - player.y) * 0.1;
    player.invincible = Math.max(0, player.invincible-1);

    // Debris sparks from hole
    if (frameCount%4===0) {
      particles.push({
        x: shipEnter.shipX + Math.random()*10,
        y: shipEnter.holeY + Math.random()*shipEnter.holeH,
        vx:-(0.5+Math.random()), vy:(Math.random()-0.5)*1.5,
        life:0.7, decay:0.04, r:2+Math.random()*3,
        color:Math.random()>0.5?"#ff6020":"#ffcc00", type:"circle",
      });
    }

    drawBG();
    particles.forEach(drawParticle);
    particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});
    drawEnterShip();

    // Exhaust
    for (let i=0;i<3;i++) particles.push({
      x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
      vx:-1.5-Math.random()*3, vy:(Math.random()-0.5)*1,
      life:0.6, decay:0.05, r:2+Math.random()*4,
      color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
    });

    if (player.x > -player.w) {
      drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);
    }

    // Golden glow as plane approaches hole
    if (player.x + player.w >= shipEnter.shipX - 20) {
      const flash = Math.min((player.x+player.w-(shipEnter.shipX-20))/50, 1);
      ctx.fillStyle=`rgba(255,180,0,${flash*0.5})`;
      ctx.fillRect(0,0,GAME_W,GAME_H);
    }

    // White flash and transition
    if (player.x + player.w > shipEnter.shipX + 40) {
      ctx.fillStyle=`rgba(255,255,255,${Math.min((player.x+player.w-shipEnter.shipX-40)/40,1)})`;
      ctx.fillRect(0,0,GAME_W,GAME_H);
      if (player.x + player.w > shipEnter.shipX + 80) {
        startTunnel();
        return;
      }
    }
  }

  drawHUD();
}

function drawEnterShip() {
  const sx = shipEnter.shipX;
  const holeY = shipEnter.holeY;
  const holeH = shipEnter.holeH;
  const holeCY = holeY + holeH/2;
  const glowPulse = 0.5 + Math.sin(frameCount*0.15)*0.3;

  // Full hull wall
  ctx.fillStyle="#1a1a3a";
  ctx.fillRect(sx, 0, 80, GAME_H);

  // Hull detail lines
  ctx.strokeStyle="rgba(100,100,160,0.3)"; ctx.lineWidth=1;
  for(let y=20;y<GAME_H;y+=40){
    ctx.beginPath(); ctx.moveTo(sx,y); ctx.lineTo(sx+80,y); ctx.stroke();
  }

  if(holeH > 2) {
    const holeCX = sx + 40;

    // Dark void inside
    ctx.fillStyle="#020204";
    ctx.fillRect(sx, holeY, 80, holeH);

    // Bent metal plate peeling from top edge
    ctx.fillStyle="#252538";
    ctx.beginPath();
    ctx.moveTo(sx,   holeY);
    ctx.lineTo(sx+80, holeY);
    ctx.lineTo(sx+72, holeY - 16);
    ctx.lineTo(sx+52, holeY - 7);
    ctx.lineTo(sx+32, holeY - 20);
    ctx.lineTo(sx+12, holeY - 9);
    ctx.closePath(); ctx.fill();

    // Bent metal plate peeling from bottom edge
    ctx.beginPath();
    ctx.moveTo(sx,   holeY+holeH);
    ctx.lineTo(sx+80, holeY+holeH);
    ctx.lineTo(sx+74, holeY+holeH + 18);
    ctx.lineTo(sx+54, holeY+holeH + 11);
    ctx.lineTo(sx+34, holeY+holeH + 22);
    ctx.lineTo(sx+14, holeY+holeH + 13);
    ctx.closePath(); ctx.fill();

    // Hot torn top edge
    const glow = 0.6 + Math.sin(frameCount*0.12)*0.25;
    ctx.strokeStyle=`rgba(255,${140+Math.floor(glow*80)},0,${0.85+glow*0.15})`;
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(sx,   holeY);
    ctx.lineTo(sx+12, holeY-9);
    ctx.lineTo(sx+32, holeY-20);
    ctx.lineTo(sx+52, holeY-7);
    ctx.lineTo(sx+72, holeY-16);
    ctx.lineTo(sx+80, holeY);
    ctx.stroke();

    // Hot torn bottom edge
    ctx.beginPath();
    ctx.moveTo(sx,   holeY+holeH);
    ctx.lineTo(sx+14, holeY+holeH+13);
    ctx.lineTo(sx+34, holeY+holeH+22);
    ctx.lineTo(sx+54, holeY+holeH+11);
    ctx.lineTo(sx+74, holeY+holeH+18);
    ctx.lineTo(sx+80, holeY+holeH);
    ctx.stroke();

    // Inner fire glow
    const ig = ctx.createLinearGradient(sx, 0, sx+80, 0);
    ig.addColorStop(0, `rgba(255,${100+Math.floor(glow*60)},0,${0.55+glow*0.25})`);
    ig.addColorStop(0.5, `rgba(255,60,0,${0.2+glow*0.1})`);
    ig.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle=ig;
    ctx.fillRect(sx, holeY, 80, holeH);

    // Interior lights
    for(let i=0;i<3;i++){
      const flash=Math.floor((frameCount+i*7)/5)%2===0;
      ctx.fillStyle=flash?"rgba(255,180,0,0.85)":"rgba(80,40,0,0.3)";
      ctx.fillRect(sx+8+i*22, holeCY-4, 14, 8);
    }

    // Smoke
    if(frameCount%2===0){
      particles.push({
        x:sx-4, y:holeY+Math.random()*holeH,
        vx:-(0.4+Math.random()*1.2), vy:(Math.random()-0.5)*0.6,
        life:0.65, decay:0.011, r:7+Math.random()*14,
        color:"rgba(70,70,70,0.45)", type:"circle",
      });
    }
  }

  // Outer glow on left edge of ship
  const eg=ctx.createLinearGradient(sx-24,0,sx,0);
  eg.addColorStop(0,"rgba(0,0,0,0)");
  eg.addColorStop(1,`rgba(255,80,0,${glowPulse*0.5})`);
  ctx.fillStyle=eg; ctx.fillRect(sx-24,0,24,GAME_H);

}


function startShipBoss() {
  shipBoss.x = GAME_W + 100;
  shipBoss.hp = 40; shipBoss.maxHp = 40;
  shipBoss.entryDone = false;
  shipBoss.dying = false; shipBoss.dyingTimer = 0;
  shipBoss.guns.forEach((g,i) => { g.timer = 40 + i*20; g.hp = g.maxHp; g.dead = false; });
  player.x = 80; player.y = GAME_H/2 - player.h/2;
  player.invincible = 60;
  bullets = []; enemyBullets = [];
  state = "shipboss";
}

function updateShipBoss() {
  // Scroll clouds
  clouds.forEach(c=>{ c.x -= 1.5; if(c.x+c.w<-100) c.x=GAME_W+50; });

  // Entry slide in
  if (!shipBoss.entryDone) {
    shipBoss.x -= 3;
    if (shipBoss.x <= GAME_W - shipBoss.w + 20) {
      shipBoss.x = GAME_W - shipBoss.w + 20;
      shipBoss.entryDone = true;
    }
  }

  if (!shipBoss.dying) {
    // Player move + shoot
    const spd = player.speed;
    if ((keys["ArrowUp"]||keys["w"]||keys["W"]||joy.dy<-0.2) && player.y>10)
      player.y -= spd*(joy.active?Math.abs(joy.dy):1);
    if ((keys["ArrowDown"]||keys["s"]||keys["S"]||joy.dy>0.2) && player.y+player.h<GAME_H-10)
      player.y += spd*(joy.active?Math.abs(joy.dy):1);
    if ((keys["ArrowLeft"]||keys["a"]||keys["A"]||joy.dx<-0.2) && player.x>10)
      player.x -= spd*(joy.active?Math.abs(joy.dx):1);
    if ((keys["ArrowRight"]||keys["d"]||keys["D"]||joy.dx>0.2) && player.x+player.w<shipBoss.x-10)
      player.x += spd*(joy.active?Math.abs(joy.dx):1);
    if ((keys[" "]||touchShooting) && player.shootCooldown<=0) {
      bullets.push({x:player.x+player.w, y:player.y+player.h/2, vx:9, vy:0, enemy:false});
      player.shootCooldown=12; sfxShoot();
    }
    if (player.shootCooldown>0) player.shootCooldown--;
    if (player.invincible>0) player.invincible--;
    player.propAngle += 0.35;

    // Ship guns fire
    if (shipBoss.entryDone) {
  shipBoss.guns.forEach(g => {
    if (g.timer > 0) g.timer--;
    if (g.dead || !shipBoss.entryDone) return;
    if (g.timer <= 0) {
      const gy = g.ry * GAME_H;
      enemyBullets.push({x: shipBoss.x, y: gy, vx:-4, vy:(Math.random()-0.5)*2, enemy:true});
      enemyBullets.push({x: shipBoss.x, y: gy, vx:-3, vy:-1.5, enemy:true});
      enemyBullets.push({x: shipBoss.x, y: gy, vx:-3, vy: 1.5, enemy:true});
      g.timer = Math.max(35, 80 - (1-(shipBoss.hp/shipBoss.maxHp))*45);
      if(sfxEnabled) playTone(150,"sawtooth",0.1,0.2,80);
    }
  });
    }

    // Bullets vs gun ports (weak spots) — wall is immune
    bullets = bullets.filter(b => {
      b.x += b.vx;
      if (b.x > GAME_W) return false;
      let hit = false;
      shipBoss.guns.forEach(g => {
        if (g.dead || hit) return;
        const gy = g.ry * GAME_H;
        const gx = shipBoss.x + 8; // port centre x
        // Hit the port circle (radius ~10) or the barrel
        if (b.x > shipBoss.x-22 && b.x < shipBoss.x+20 &&
            b.y > gy-14 && b.y < gy+14) {
          hit = true;
          g.hp--;
          explode(b.x, b.y, "#ff6040","#ffcc00", 6);
          if (g.hp <= 0) {
            g.dead = true;
            explode(gx, gy, "#ff4020","#ffcc00", 16);
            sfxExplode();
            // Check if all guns dead
            if (shipBoss.guns.every(g2 => g2.dead)) {
              shipBoss.hp = 0;
              shipBoss.dying = true;
              shipBoss.dyingTimer = 180;
              enemyBullets = [];
            }
          } else {
            if (g.hp % 3 === 0) sfxExplode(); else sfxHitEnemy();
          }
        }
      });
      return !hit;
    });

    // Enemy bullets vs player
    if (player.invincible <= 0) {
      for (const b of enemyBullets) {
        if (rectsOverlap(b.x-8,b.y-4,16,8, player.x+8,player.y+4,player.w-16,player.h-8)) {
          playerHit(); updateHUD(); player.invincible=90;
          explode(player.x+player.w/2,player.y+player.h/2,"#f5c842","#ff4040",20);
          sfxPlayerHit();
          break;
        }
      }
    }
    enemyBullets = enemyBullets.filter(b=>{
      b.x+=b.vx; b.y+=b.vy;
      return b.x>-20 && b.y>-20 && b.y<GAME_H+20;
    });

  } else {
    // Dying — turbo tunnel style chain explosions with screen shake
    shipBoss.dyingTimer--;

    bullets = bullets.filter(b=>{ b.x+=b.vx; return b.x<GAME_W; });
    enemyBullets = [];

    // Dense chain explosions across the whole ship
    if (frameCount%2===0) {
      const ex = shipBoss.x + Math.random()*shipBoss.w;
      const ey = Math.random()*GAME_H;
      explode(ex, ey, "#ff4020","#ffcc00", 18);
    }
    if (frameCount%8===0) sfxExplode();

    // Screen shake — gets worse toward the end
    const shakeAmt = 3 + (1 - shipBoss.dyingTimer/180)*6;
    ctx.save();
    ctx.translate((Math.random()-0.5)*shakeAmt, (Math.random()-0.5)*shakeAmt);

    // Flash buildup
    if (shipBoss.dyingTimer < 40) {
      ctx.fillStyle=`rgba(255,200,50,${(40-shipBoss.dyingTimer)*0.025})`;
      ctx.fillRect(0,0,GAME_W,GAME_H);
    }

    if (shipBoss.dyingTimer <= 0) {
      ctx.restore();
      player.speed = PLAYER_BASE_SPEED;
      playerSpeedBoosted = false;
      drawBG();
      particles.forEach(drawParticle);
      drawShipBoss();
      drawPlane(player.x,player.y,player.w,player.h,0,player.propAngle);
      startShipEnter();
      return;
    }
  }

  // Particles
  particles = particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});

  // Draw
  drawBG();
  particles.forEach(drawParticle);
  enemyBullets.forEach(drawBullet);
  bullets.forEach(drawBullet);
  drawShipBoss();
  drawPlane(player.x,player.y,player.w,player.h,0,player.propAngle);

  // Exhaust
  for (let i=0;i<2;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
    vx:-1.5-Math.random()*2, vy:(Math.random()-0.5)*0.8,
    life:0.6, decay:0.07, r:2+Math.random()*3,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });

  // Restore shake translate if dying
  if (shipBoss.dying) ctx.restore();

  // HP bar — total gun HP across all 4 ports
  const totalHp = shipBoss.guns.reduce((s,g)=>s+Math.max(0,g.hp),0);
  const totalMaxHp = shipBoss.guns.reduce((s,g)=>s+g.maxHp,0);
  ctx.fillStyle="rgba(0,0,0,0.5)";
  ctx.fillRect(GAME_W/2-120, GAME_H-22, 240, 12);
  ctx.fillStyle="#ff4040";
  ctx.fillRect(GAME_W/2-120, GAME_H-22, 240*(totalHp/totalMaxHp), 12);
  ctx.strokeStyle="#ff8060"; ctx.lineWidth=1;
  ctx.strokeRect(GAME_W/2-120, GAME_H-22, 240, 12);
  ctx.textAlign="center"; ctx.fillStyle="#fff";
  ctx.font="10px Boogaloo,cursive";
  ctx.fillText("DESTROYER", GAME_W/2, GAME_H-26);
  ctx.textAlign="left";

  // Vignette
  const vig=ctx.createRadialGradient(400,220,180,400,220,500);
  vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.4)");
  ctx.fillStyle=vig; ctx.fillRect(0,0,GAME_W,GAME_H);
  drawHUD();
}

function drawShipBoss() {
  const {x, hp, maxHp} = shipBoss;
  const damaged = hp < maxHp * 0.5;
  ctx.save();

  // Main hull — full height wall
  const hullGrad = ctx.createLinearGradient(x,0,x+shipBoss.w,0);
  hullGrad.addColorStop(0, damaged?"#8b1a00":"#2a2a4a");
  hullGrad.addColorStop(0.4, damaged?"#cc3010":"#4a4a7a");
  hullGrad.addColorStop(1, damaged?"#661000":"#1a1a3a");
  ctx.fillStyle = hullGrad;
  ctx.fillRect(x, 0, shipBoss.w, GAME_H);

  // Armour panels
  ctx.fillStyle = damaged?"rgba(255,80,20,0.15)":"rgba(100,100,200,0.2)";
  for (let i=0;i<8;i++) {
    ctx.fillRect(x+10, i*(GAME_H/8), shipBoss.w-20, GAME_H/8-4);
  }

  // Rivets / panel lines — always neutral, no red cracks
  ctx.strokeStyle = "rgba(150,150,255,0.3)";
  ctx.lineWidth=1;
  for (let i=1;i<8;i++) {
    ctx.beginPath();
    ctx.moveTo(x, i*(GAME_H/8));
    ctx.lineTo(x+shipBoss.w, i*(GAME_H/8));
    ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x+shipBoss.w*0.4,0); ctx.lineTo(x+shipBoss.w*0.4,GAME_H); ctx.stroke();

  // Gun port cannons
  shipBoss.guns.forEach(g => {
    const gy = g.ry * GAME_H;
    const gx = x; // left edge of ship

    ctx.save();
    ctx.translate(gx, gy);

    if (g.dead) {
      // ── Destroyed cannon ──────────────────────────────────
      // Scorch mark on hull — large dark smear
      const sg = ctx.createRadialGradient(0,0,4,0,0,28);
      sg.addColorStop(0,"rgba(10,5,0,0.95)");
      sg.addColorStop(0.5,"rgba(40,20,5,0.6)");
      sg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(0,0,28,22,0,0,Math.PI*2); ctx.fill();

      // Torn housing — jagged fragments
      ctx.fillStyle="#1a1008";
      ctx.beginPath();
      ctx.moveTo(-4,-14); ctx.lineTo(8,-18); ctx.lineTo(14,-10);
      ctx.lineTo(10,-4); ctx.lineTo(16,2); ctx.lineTo(8,8);
      ctx.lineTo(-2,14); ctx.lineTo(-10,10); ctx.lineTo(-16,4);
      ctx.lineTo(-12,-2); ctx.lineTo(-8,-8);
      ctx.closePath(); ctx.fill();

      // Hot glowing torn edge
      ctx.strokeStyle=`rgba(255,60,0,${0.4+Math.sin(frameCount*0.08)*0.2})`;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(-4,-14); ctx.lineTo(8,-18); ctx.lineTo(14,-10);
      ctx.lineTo(10,-4); ctx.lineTo(16,2);
      ctx.stroke();

      // Bent barrel remnant — twisted, angled down
      ctx.fillStyle="#0a0806";
      ctx.save(); ctx.rotate(0.35);
      ctx.fillRect(-28,-4,20,6);
      ctx.fillStyle="#221408";
      ctx.fillRect(-28,-4,10,6);
      ctx.restore();

      // Glowing barrel tip
      ctx.fillStyle=`rgba(255,80,0,${0.3+Math.sin(frameCount*0.1)*0.15})`;
      ctx.beginPath(); ctx.arc(-26,5,5,0,Math.PI*2); ctx.fill();

      // Smoke wisps
      if(frameCount%4===0) particles.push({
        x:gx-24, y:gy+(Math.random()-0.5)*10,
        vx:-0.3-Math.random()*0.5, vy:-(0.3+Math.random()*0.5),
        life:0.6, decay:0.013, r:5+Math.random()*8,
        color:"rgba(60,50,40,0.5)", type:"circle",
      });

      // Internal fire flicker
      const ff=0.4+Math.sin(frameCount*0.14)*0.3;
      ctx.fillStyle=`rgba(255,${80+Math.floor(ff*60)},0,${ff*0.7})`;
      ctx.beginPath(); ctx.arc(-2,0,8,0,Math.PI*2); ctx.fill();

    } else {
      // ── Live cannon ───────────────────────────────────────
      const hpR = g.hp/g.maxHp;
      const charging = g.timer < 20;
      const chargeT = charging ? (20-g.timer)/20 : 0;

      // Barrel shadow
      ctx.fillStyle="rgba(0,0,0,0.4)";
      ctx.fillRect(-26,-4,26,10);

      // Main barrel — tapered cylinder
      ctx.fillStyle="#505060";
      ctx.beginPath();
      ctx.moveTo(-26,-5); ctx.lineTo(-2,-7);
      ctx.lineTo(-2,7);  ctx.lineTo(-26,5);
      ctx.closePath(); ctx.fill();

      // Barrel highlight
      ctx.fillStyle="rgba(180,180,200,0.3)";
      ctx.beginPath();
      ctx.moveTo(-26,-5); ctx.lineTo(-2,-7); ctx.lineTo(-2,-2); ctx.lineTo(-26,-1);
      ctx.closePath(); ctx.fill();

      // Barrel rings (heat dissipation bands)
      ctx.fillStyle="#383848";
      [-20,-14,-8].forEach(bx=>{
        ctx.fillRect(bx,-7,3,14);
      });

      // Muzzle
      ctx.fillStyle="#222230";
      ctx.beginPath(); ctx.arc(-26,0,6,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#555566"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(-26,0,6,0,Math.PI*2); ctx.stroke();

      // Muzzle glow when charging
      if(charging){
        const mg=ctx.createRadialGradient(-26,0,0,-26,0,12);
        mg.addColorStop(0,`rgba(255,${150+Math.floor(chargeT*80)},0,${chargeT*0.9})`);
        mg.addColorStop(1,"rgba(255,80,0,0)");
        ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(-26,0,12,0,Math.PI*2); ctx.fill();
      }

      // Housing body — hexagonal turret
      ctx.fillStyle="#2a2a3e";
      ctx.beginPath();
      ctx.moveTo(0,-16); ctx.lineTo(14,-10); ctx.lineTo(16,0);
      ctx.lineTo(14,10); ctx.lineTo(0,16); ctx.lineTo(-4,0);
      ctx.closePath(); ctx.fill();

      // Housing highlight
      ctx.fillStyle="rgba(100,100,160,0.3)";
      ctx.beginPath();
      ctx.moveTo(0,-16); ctx.lineTo(14,-10); ctx.lineTo(14,-2); ctx.lineTo(0,-4);
      ctx.closePath(); ctx.fill();

      // Housing outline
      ctx.strokeStyle="#4a4a6a"; ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(0,-16); ctx.lineTo(14,-10); ctx.lineTo(16,0);
      ctx.lineTo(14,10); ctx.lineTo(0,16); ctx.lineTo(-4,0);
      ctx.closePath(); ctx.stroke();

      // Central eye / aperture
      ctx.fillStyle="#080810";
      ctx.beginPath(); ctx.arc(6,0,7,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=hpR>0.5?"#00cc60":hpR>0.25?"#ffaa00":"#ff3030";
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(6,0,9,0,Math.PI*2); ctx.stroke();

      // HP arc around aperture
      ctx.strokeStyle=hpR>0.5?"#00ff80":hpR>0.25?"#ffcc00":"#ff4040";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(6,0,11,-Math.PI/2,-Math.PI/2+Math.PI*2*hpR);
      ctx.stroke();

      // Pupil glow
      ctx.fillStyle=charging
        ?`rgba(255,${100+Math.floor(chargeT*120)},0,${0.6+chargeT*0.4})`
        :"rgba(40,40,80,0.8)";
      ctx.beginPath(); ctx.arc(6,0,5,0,Math.PI*2); ctx.fill();

      // Heat vents
      ctx.fillStyle="#1a1a28";
      [6,10].forEach(vy=>{ ctx.fillRect(8,vy,6,2); ctx.fillRect(8,-vy-2,6,2); });

      // Firing flash
      if(g.timer===0){
        ctx.fillStyle="rgba(255,200,50,0.9)";
        ctx.beginPath(); ctx.arc(-26,0,10,0,Math.PI*2); ctx.fill();
      }
    }

    ctx.restore();
  });

  // Warning lights that flash
  const flashOn = Math.floor(frameCount/8)%2===0;
  ctx.fillStyle = flashOn?(damaged?"#ff2000":"#ff4400"):"rgba(0,0,0,0)";
  [0.1,0.3,0.5,0.7,0.9].forEach(ry=>{
    ctx.beginPath(); ctx.arc(x+shipBoss.w-15, ry*GAME_H, 5, 0, Math.PI*2); ctx.fill();
  });

  // Left edge glow
  const edgeGrad = ctx.createLinearGradient(x-20,0,x+10,0);
  edgeGrad.addColorStop(0,"rgba(0,0,0,0)");
  edgeGrad.addColorStop(1, damaged?"rgba(255,60,0,0.4)":"rgba(80,80,255,0.4)");
  ctx.fillStyle=edgeGrad;
  ctx.fillRect(x-20,0,30,GAME_H);

  ctx.restore();
}

function startTunnel() {
  tunnel.walls = [];
  tunnel.scrollX = 0;
  tunnel.speed = 4;
  tunnel.wallsSpawned = 1; // first wall already spawned below
  tunnel.spawnTimer = 80;
  tunnel.countdownTimer = 150;
  tunnel.playerHitTimer = 0;
  tunnel.powerup = { x:0, y:0, active:false, collected:false };
  tunnel.exitWall = { active:false, x:GAME_W+60, hp:0, maxHp:30, segments:[] };
  player.x = 80; player.y = GAME_H/2 - player.h/2;
  player.invincible = 0;
  bullets = []; enemyBullets = [];
  // Spawn first wall immediately with powerup in the gap
  spawnFirstWall();
  state = "tunnelready";
}

function updateTunnelReady() {
  tunnel.countdownTimer--;
  // Draw tunnel BG
  drawTunnelBG();
  drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);
  player.propAngle += 0.35;

  // Animated "GET READY" text
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.textAlign = "center";

  // Flash effect
  const flash = Math.floor(tunnel.countdownTimer / 10) % 2 === 0;
  ctx.fillStyle = flash ? "#f5c842" : "#fff";
  ctx.font = "bold 56px Rancho,cursive";
  ctx.strokeStyle = "#8b2500"; ctx.lineWidth = 6;
  ctx.strokeText("TURBO TUNNEL!", GAME_W/2, GAME_H/2 - 30);
  ctx.fillText("TURBO TUNNEL!", GAME_W/2, GAME_H/2 - 30);

  ctx.fillStyle = "#fff";
  ctx.font = "22px Boogaloo,cursive";
  ctx.fillText("Dodge the walls — don't crash!", GAME_W/2, GAME_H/2 + 20);
  ctx.fillStyle = "#f5c842"; ctx.font = "bold 16px Boogaloo,cursive";
  ctx.fillText("⚡ Grab the boost to go faster! ⚡", GAME_W/2, GAME_H/2 + 48);

  const count = Math.ceil(tunnel.countdownTimer / 50);
  if (count > 0) {
    ctx.fillStyle = "#f5c842";
    ctx.font = "bold 48px Rancho,cursive";
    ctx.strokeText(count, GAME_W/2, GAME_H/2 + 80);
    ctx.fillText(count, GAME_W/2, GAME_H/2 + 80);
  }
  ctx.restore();
  drawHUD();

  if (tunnel.countdownTimer <= 0) state = "tunnel";
}

function spawnTunnelWall() {
  const progress = tunnel.wallsSpawned / tunnel.wallsTotal;
  const gapH = Math.max(55, 200 - progress * 145);
  const gapY = 40 + Math.random() * (GAME_H - 80 - gapH);
  tunnel.walls.push({ x: GAME_W + 40, gapY, gapH });
  tunnel.wallsSpawned++;
  return { gapY, gapH };
}

function spawnFirstWall() {
  // Spawn first wall with a generous gap, place powerup inside it
  const gapH = 200; // wide on first wall
  const gapY = 40 + Math.random() * (GAME_H - 80 - gapH);
  tunnel.walls.push({ x: GAME_W + 40, gapY, gapH });
  // Powerup sits in the middle of that gap, inside the wall
  tunnel.powerup = {
    x: GAME_W + 40 + 25, // centre of the 50px wide wall slot
    y: gapY + gapH / 2,
    active: true,
    collected: false,
  };
}

function playTunnelWhoosh() {
  playTone(200, "sawtooth", 0.15, 0.15, 80);
}

function updateTunnel() {
  const progress = Math.min(tunnel.wallsSpawned / tunnel.wallsTotal, 1);
  tunnel.speed = 4 + progress * 10; // 4→14 over 20 walls

  // Spawn walls until we hit 20
  tunnel.spawnTimer--;
  const spawnInterval = Math.max(22, 65 - progress * 40);
  if (tunnel.spawnTimer <= 0 && tunnel.wallsSpawned < tunnel.wallsTotal) {
    spawnTunnelWall();
    tunnel.spawnTimer = spawnInterval;
    playTunnelWhoosh();
  }

  // Player movement (up/down only)
  const spd = player.speed;
  if ((keys["ArrowUp"]||keys["w"]||keys["W"]||joy.dy<-0.2) && player.y > 40)
    player.y -= spd * (joy.active ? Math.abs(joy.dy) : 1);
  if ((keys["ArrowDown"]||keys["s"]||keys["S"]||joy.dy>0.2) && player.y+player.h < GAME_H-10)
    player.y += spd * (joy.active ? Math.abs(joy.dy) : 1);
  player.propAngle += 0.35;

  // Scroll walls
  tunnel.walls.forEach(w => w.x -= tunnel.speed);
  tunnel.walls = tunnel.walls.filter(w => w.x > -60);

  // Powerup scrolls toward player at same speed as walls, no vertical movement
  const tp = tunnel.powerup;
  if (tp.active && !tp.collected) {
    tp.x -= tunnel.speed;

    // Collect check
    if (rectsOverlap(player.x+6,player.y+4,player.w-12,player.h-8, tp.x-18,tp.y-18,36,36)) {
      tp.collected = true;
      tp.active = false;
      player.speed = PLAYER_BASE_SPEED * 2;
      playerSpeedBoosted = true;
      for (let i=0;i<4;i++) explode(tp.x, tp.y, "#f5c842","#ffffff", 20);
      if (sfxEnabled) {
        playTone(440,"square",0.05,0.25);
        setTimeout(()=>playTone(660,"square",0.05,0.25),80);
        setTimeout(()=>playTone(1320,"square",0.12,0.3),180);
      }
    }
    // Gone off left — missed it
    if (tp.x < -40) tp.active = false;
  }

  // Hit detection vs walls — top and bottom slab
  if (tunnel.playerHitTimer <= 0) {
    const px = player.x+6, py = player.y+4, pw = player.w-12, ph = player.h-8;
    for (const w of tunnel.walls) {
      const wx = w.x, ww = 50;
      // Top slab: from y=0 to gapY
      if (rectsOverlap(px,py,pw,ph, wx,0,ww,w.gapY)) {
        loseLifeTunnel(); break;
      }
      // Bottom slab: from gapY+gapH to GAME_H
      if (rectsOverlap(px,py,pw,ph, wx,w.gapY+w.gapH,ww,GAME_H)) {
        loseLifeTunnel(); break;
      }
    }
    // Screen edge top/bottom
    if (player.y < 40) { player.y=40; loseLifeTunnel(); }
  }

  if (tunnel.playerHitTimer > 0) tunnel.playerHitTimer--;

  // Draw
  drawTunnelBG();
  drawTunnelWalls();

  // Draw powerup — stationary, pulses
  const tp2 = tunnel.powerup;
  if (tp2.active && !tp2.collected) {
    const pulse = 0.7 + Math.sin(frameCount * 0.1) * 0.3;
    ctx.save();
    ctx.translate(tp2.x, tp2.y);
    ctx.shadowColor="#f5c842"; ctx.shadowBlur=20*pulse;
    ctx.fillStyle=`rgba(245,200,66,${0.15*pulse})`;
    ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#f5c842"; ctx.lineWidth=2;
    ctx.globalAlpha=pulse;
    ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.fillStyle="#f5c842"; ctx.font="bold 24px Arial";
    ctx.textAlign="center"; ctx.fillText("⚡",0,9);
    ctx.restore();
  }

  // Speed boost active indicator
  if (playerSpeedBoosted) {
    ctx.save();
    ctx.fillStyle="rgba(245,200,66,0.15)";
    ctx.fillRect(0,34,GAME_W,20);
    ctx.fillStyle="#f5c842"; ctx.font="bold 13px Boogaloo,cursive";
    ctx.textAlign="center";
    ctx.fillText("⚡ SPEED BOOST ACTIVE ⚡", GAME_W/2, 49);
    ctx.restore();
  }
  particles.forEach(drawParticle);
  particles = particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=p.decay; return p.life>0; });
  bullets.forEach(drawBullet);
  enemyBullets.forEach(drawBullet);
  drawPlane(player.x, player.y, player.w, player.h, tunnel.playerHitTimer, player.propAngle);

  // Exhaust
  for (let i=0;i<2;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
    vx:-1.5-Math.random()*2, vy:(Math.random()-0.5)*0.8,
    life:0.6, decay:0.07, r:2+Math.random()*3,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });

  // Enable shooting during tunnel for exit wall phase
  if ((keys[" "]||touchShooting) && player.shootCooldown<=0) {
    bullets.push({x:player.x+player.w, y:player.y+player.h/2, vx:9, vy:0, enemy:false});
    player.shootCooldown=12; sfxShoot();
  }
  if (player.shootCooldown>0) player.shootCooldown--;

  // Always scroll player bullets — stop at tunnel walls, remove if off screen
  bullets = bullets.filter(b => {
    b.x += b.vx;
    if (b.x >= GAME_W) return false;
    // Check if bullet hits a wall slab (not the gap)
    for (const w of tunnel.walls) {
      if (b.x >= w.x && b.x <= w.x + 50) {
        const inGap = b.y >= w.gapY && b.y <= w.gapY + w.gapH;
        if (!inGap) {
          explode(b.x, b.y, "#4060ff", "#ffffff", 4);
          return false;
        }
      }
    }
    return true;
  });

  // Exit wall logic
  const ew = tunnel.exitWall;
  if (ew.active) {
    // Slide in from right
    if (ew.x > GAME_W - 55) ew.x -= 3;

    // Bullets vs exit wall segments
    bullets = bullets.filter(b => {
      if (b.x >= ew.x && !ew.segments.every(s => s.broken)) {
        const segH = GAME_H / ew.segments.length;
        const segIdx = Math.floor(b.y / segH);
        const seg = ew.segments[segIdx];
        if (seg && !seg.broken) {
          seg.hp--;
          explode(b.x, b.y, "#ff6040","#ffcc00", 5);
          if (seg.hp <= 0) {
            seg.broken = true;
            explode(ew.x+25, segIdx*segH+segH/2, "#ff4020","#ffcc00", 18);
            sfxExplode();
          } else sfxHitEnemy();
          return false;
        }
      }
      return true;
    });

    // Player collision with intact segments
    if (tunnel.playerHitTimer <= 0) {
      const segH = GAME_H / ew.segments.length;
      const segIdx = Math.floor((player.y + player.h/2) / segH);
      const seg = ew.segments[segIdx];
      if (seg && !seg.broken && player.x + player.w >= ew.x) {
        loseLifeTunnel();
      }
    }

    // Check if all segments broken — escape!
    if (ew.segments.every(s => s.broken)) {
      ew.active = false;
      // Big wall destruction burst
      for (let i=0;i<8;i++) {
        explode(ew.x+Math.random()*50, Math.random()*GAME_H, "#ff4020","#ffcc00", 20);
      }
      sfxExplode();
      // Start escape animation
      escapeAnim.phase = 0; // 0=blasting through, 1=flying off right
      escapeAnim.timer = 0;
      escapeAnim.playerVX = 0;
      escapeAnim.playerVY = 0;
      state = "escaping";
    }

    // Draw exit wall
    drawExitWall(ew);
  }

  // Progress bar — based on walls spawned
  const prog = Math.min(tunnel.wallsSpawned / tunnel.wallsTotal, 1);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, GAME_H-8, GAME_W, 8);
  ctx.fillStyle = ew.active ? "#ff4040" : "#f5c842";
  ctx.fillRect(0, GAME_H-8, GAME_W*prog, 8);

  // Exit wall label
  if (ew.active) {
    ctx.textAlign="center"; ctx.fillStyle="#ff4040";
    ctx.font="bold 14px Boogaloo,cursive";
    ctx.fillText("BLAST THROUGH THE HULL!", GAME_W/2, GAME_H-12);
    ctx.textAlign="left";
  }

  drawHUD();

  // After all 20 walls scroll off — spawn the exit wall
  if (tunnel.wallsSpawned >= tunnel.wallsTotal && tunnel.walls.length === 0 && !ew.active && state==="tunnel") {
    const segCount = 1;
    ew.segments = Array.from({length:segCount}, () => ({ hp:12, maxHp:12, broken:false }));
    ew.x = GAME_W + 60;
    ew.active = true;
  }
}

function loseLifeTunnel() {
  playerHit();
  updateHUD();
  tunnel.playerHitTimer = 60;
  player.x = 80;
  explode(player.x+player.w/2, player.y+player.h/2, "#f5c842","#ff4040", 20);
  sfxPlayerHit();
}

function drawExitWall(ew) {
  const segCount = ew.segments.length;
  const segH = GAME_H / segCount;
  ew.segments.forEach((seg, i) => {
    if (seg.broken) {
      // Broken segment — sparks
      if (Math.random() < 0.15) {
        particles.push({
          x: ew.x+Math.random()*50, y: i*segH+Math.random()*segH,
          vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3,
          life:0.8, decay:0.06, r:2+Math.random()*3,
          color:Math.random()>0.5?"#ff6020":"#ffcc00", type:"circle",
        });
      }
      return;
    }
    const dmg = 1 - (seg.hp / seg.maxHp);
    // Hull plate
    const g = ctx.createLinearGradient(ew.x,0,ew.x+50,0);
    g.addColorStop(0, dmg>0.5?"#8b1a00":"#2a2a5a");
    g.addColorStop(1, dmg>0.5?"#4a0800":"#1a1a3a");
    ctx.fillStyle=g;
    ctx.fillRect(ew.x, i*segH+1, 50, segH-2);
    // Damage cracks
    if (dmg > 0) {
      ctx.strokeStyle=`rgba(255,80,20,${dmg*0.8})`;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(ew.x+10, i*segH+segH*0.3);
      ctx.lineTo(ew.x+30, i*segH+segH*0.6);
      ctx.lineTo(ew.x+20, i*segH+segH*0.8);
      ctx.stroke();
    }
    // HP pip lights
    for (let p=0;p<seg.maxHp;p++) {
      ctx.fillStyle = p < seg.hp ? "#00ff80" : "#300";
      ctx.fillRect(ew.x+5+p*10, i*segH+segH-8, 8, 4);
    }
    // Flashing warning on low HP
    if (seg.hp===1 && Math.floor(frameCount/6)%2===0) {
      ctx.fillStyle="rgba(255,0,0,0.3)";
      ctx.fillRect(ew.x, i*segH, 50, segH);
    }
    // Edge glow
    const eg=ctx.createLinearGradient(ew.x-15,0,ew.x,0);
    eg.addColorStop(0,"rgba(0,0,0,0)");
    eg.addColorStop(1,dmg>0?"rgba(255,60,0,0.5)":"rgba(60,60,255,0.3)");
    ctx.fillStyle=eg; ctx.fillRect(ew.x-15,i*segH,15,segH);
  });
}

function drawTunnelBG() {
  // Dark tunnel gradient
  const g = ctx.createLinearGradient(0,0,0,GAME_H);
  g.addColorStop(0,"#050515"); g.addColorStop(0.5,"#0a0a2a"); g.addColorStop(1,"#050515");
  ctx.fillStyle=g; ctx.fillRect(0,0,GAME_W,GAME_H);

  // Speed lines
  ctx.save();
  ctx.strokeStyle="rgba(100,150,255,0.15)";
  ctx.lineWidth=1;
  for (let i=0;i<20;i++) {
    const lx = (frameCount * tunnel.speed * 2 + i * 60) % (GAME_W + 100) - 50;
    ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx-40,GAME_H); ctx.stroke();
  }
  ctx.restore();
}

function drawTunnelWalls() {
  tunnel.walls.forEach(w => {
    const g1 = ctx.createLinearGradient(w.x,0,w.x+50,0);
    g1.addColorStop(0,"#4040ff"); g1.addColorStop(1,"#202080");

    // Top slab
    ctx.fillStyle = g1;
    ctx.fillRect(w.x, 0, 50, w.gapY);
    // Glow edge
    ctx.fillStyle = "rgba(100,120,255,0.6)";
    ctx.fillRect(w.x, w.gapY-4, 50, 4);

    // Bottom slab
    ctx.fillStyle = g1;
    ctx.fillRect(w.x, w.gapY+w.gapH, 50, GAME_H-(w.gapY+w.gapH));
    // Glow edge
    ctx.fillStyle = "rgba(100,120,255,0.6)";
    ctx.fillRect(w.x, w.gapY+w.gapH, 50, 4);

    // Warning stripes on face
    ctx.save();
    ctx.fillStyle = "rgba(255,200,0,0.25)";
    for (let i=0;i<Math.ceil(w.gapY/20);i++) {
      if (i%2===0) ctx.fillRect(w.x, i*20, 50, 10);
    }
    const bBot = w.gapY+w.gapH;
    for (let i=0;i<Math.ceil((GAME_H-bBot)/20);i++) {
      if (i%2===0) ctx.fillRect(w.x, bBot+i*20, 50, 10);
    }
    ctx.restore();
  });
}

// ─── Pause menu ───────────────────────────────────────────────
let mecha = {
  active: false, dead: false,
  x: 0, y: 0,
  hp: 60, maxHp: 60,
  // Entrance anim
  introPhase: 0,  // 0=text, 1=wily drops, 2=crouched, 3=standing up, 4=fighting
  introTimer: 0,
  wilyY: -80,     // wily capsule dropping in
  crouchAmt: 1,   // 1=fully crouched, 0=fully standing
  // Fight
  cstate: "waiting", // waiting/moving/attacking
  stateTimer: 120,
  targetY: 0,
  vy: 0,
  // Attack: swinging fist
  fistAngle: 0, fistSwinging: false, fistTimer: 0,
};

let wave5Intro = { timer:0 };

function startWave5Intro() {
  wave5Intro.timer = 0;
  mecha.active = true; mecha.dead = false;
  mecha.hp = 60; mecha.maxHp = 60;
  mecha.x = GAME_W - 200;
  mecha.y = GAME_H - 200; // standing position
  mecha.introPhase = 0; mecha.introTimer = 0;
  mecha.wilyY = -80;
  mecha.crouchAmt = 1;
  mecha.cstate = "waiting"; mecha.stateTimer = 120;
  mecha.targetY = mecha.y;
  mecha.vy = 0;
  mecha.fistAngle = 0; mecha.fistSwinging = false; mecha.fistTimer = 0;
  mecha.grateAmt = 0; // 0=closed, 1=fully open
  mecha.grateOpen = false; mecha.grateAmt = 0; // 0=closed 1=fully open
  enemies = [];
  state = "wave5intro";
}

function updateWave5Intro() {
  wave5Intro.timer++;
  const t = wave5Intro.timer;
  mecha.introTimer++;
  const it = mecha.introTimer;

  player.propAngle += 0.35;

  // Allow movement from phase 3 onwards (pod is incoming)
  if (mecha.introPhase >= 3) {
    const spd = player.speed;
    if ((keys["ArrowUp"]||keys["w"]||keys["W"]||joy.dy<-0.2) && player.y>10)
      player.y -= spd*(joy.active?Math.abs(joy.dy):1);
    if ((keys["ArrowDown"]||keys["s"]||keys["S"]||joy.dy>0.2) && player.y+player.h<GAME_H-10)
      player.y += spd*(joy.active?Math.abs(joy.dy):1);
    if (player.invincible>0) player.invincible--;
  }
  drawBG();
  particles.forEach(drawParticle);
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});
  drawPlane(player.x, player.y, player.w, player.h, player.invincible, player.propAngle);
  for (let i=0;i<2;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
    vx:-1.5-Math.random()*2, vy:(Math.random()-0.5)*0.8,
    life:0.6, decay:0.07, r:2+Math.random()*3,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });

  // Phase 0 (0–80): text overlay
  if (mecha.introPhase === 0) {
    ctx.fillStyle="rgba(0,0,0,0.85)"; ctx.fillRect(0,0,GAME_W,GAME_H);
    ctx.save(); ctx.textAlign="center";
    const a1 = t<20?t/20:t>60?Math.max(0,(80-t)/20):1;
    ctx.globalAlpha=a1;
    ctx.font="bold 42px Rancho,cursive"; ctx.strokeStyle="#000"; ctx.lineWidth=6;
    ctx.strokeText("DEEPER IN THE SHIP...", GAME_W/2, GAME_H/2-10);
    ctx.fillStyle="#ff4040"; ctx.fillText("DEEPER IN THE SHIP...", GAME_W/2, GAME_H/2-10);
    if (t>40) {
      const a2 = t<50?(t-40)/10:t>65?Math.max(0,(80-t)/15):1;
      ctx.globalAlpha=a2;
      ctx.font="bold 28px Rancho,cursive";
      ctx.strokeText("DR. WILY AWAITS!", GAME_W/2, GAME_H/2+40);
      ctx.fillStyle="#f5c842"; ctx.fillText("DR. WILY AWAITS!", GAME_W/2, GAME_H/2+40);
    }
    ctx.restore();
    if (t >= 80) { mecha.introPhase = 1; mecha.introTimer = 0; }

  // Phase 1 (0–80): Wily capsule drops in from top
  } else if (mecha.introPhase === 1) {
    const targetDropY = mecha.y - 40;
    mecha.wilyY += (targetDropY - mecha.wilyY) * 0.025;
    drawWilyCapsule(mecha.x + 60, mecha.wilyY);
    // Mecha body crouched underneath
    drawMecha(mecha.x, mecha.y, 1.0, mecha.hp/mecha.maxHp);
    if (it >= 140) { mecha.introPhase = 2; mecha.introTimer = 0; }

  // Phase 2 (0–30): capsule docks — flash + clunk, pod ejects and starts rotating
  } else if (mecha.introPhase === 2) {
    if (it === 5) {
      explode(mecha.x+60, mecha.y-20, "#ffffff","#aaaaff", 20);
      if(sfxEnabled) playTone(80,"sawtooth",0.4,0.5,40);
      mecha.podY = mecha.y - 40;
      mecha.podX = mecha.x + 60;
      mecha.podAngle = 0;        // starts vertical (0 = upright)
      mecha.podLaunched = false;
    }
    drawMecha(mecha.x, mecha.y, 1.0, mecha.hp/mecha.maxHp);
    // Draw pod rotating
    if (mecha.podX !== undefined) {
      mecha.podAngle = Math.min(-Math.PI/2, mecha.podAngle - 0.05); // spin CCW to -90deg
      ctx.save();
      ctx.translate(mecha.podX, mecha.podY);
      ctx.rotate(mecha.podAngle);
      drawWilyCapsuleRaw();
      ctx.restore();
    }
    if (it >= 30) { mecha.introPhase = 3; mecha.introTimer = 0; }

  // Phase 3 (0–120): mecha stands up, pod launches horizontally at player
  } else if (mecha.introPhase === 3) {
    mecha.crouchAmt = Math.max(0, 1 - it/100);
    drawMecha(mecha.x, mecha.y, mecha.crouchAmt, mecha.hp/mecha.maxHp);

    // Rumble particles
    if (it%4===0) {
      for(let i=0;i<3;i++) particles.push({
        x:mecha.x+Math.random()*180, y:mecha.y+160+(Math.random()-0.5)*20,
        vx:(Math.random()-0.5)*3, vy:-Math.random()*2,
        life:0.8,decay:0.04,r:3+Math.random()*4,color:"rgba(80,80,80,0.5)",type:"circle"
      });
    }

    // Launch pod at player on frame 10
    if (it === 10 && !mecha.podLaunched) {
      mecha.podLaunched = true;
      mecha.podVX = -8; // fast launch
      if(sfxEnabled) { playTone(80,"sawtooth",0.4,0.5,40); setTimeout(()=>playTone(60,"sawtooth",0.3,0.4,30),100); }
    }

    // Move pod
    if (mecha.podLaunched && mecha.podX > -120) {
      mecha.podX += mecha.podVX;
      // Thruster trail
      if (frameCount%2===0) particles.push({
        x:mecha.podX+32, y:mecha.podY+(Math.random()-0.5)*20,
        vx:2+Math.random()*3, vy:(Math.random()-0.5)*1.5,
        life:0.7, decay:0.04, r:4+Math.random()*6,
        color:Math.random()>0.5?"#ff8020":"#ffcc00", type:"circle"
      });
    }

    // Draw pod horizontal (rotated -90°)
    if (mecha.podX > -120) {
      ctx.save();
      ctx.translate(mecha.podX, mecha.podY);
      ctx.rotate(-Math.PI/2);
      drawWilyCapsuleRaw();
      ctx.restore();

      // Player hit
      if (player.invincible <= 0) {
        const px=player.x+player.w/2, py=player.y+player.h/2;
        if (Math.abs(px-mecha.podX)<38 && Math.abs(py-mecha.podY)<32) {
          playerHit(); updateHUD(); player.invincible=90;
          explode(px,py,"#f5c842","#ff4040",20); sfxPlayerHit();
          mecha.podX = -200; // remove pod
        }
      }
    }

    if (it >= 120) {
      mecha.introPhase = 4; mecha.crouchAmt = 0;
      if(sfxEnabled){ playTone(120,"sawtooth",0.3,0.6,60); }
    }

  // Phase 4 (0–60): name flash then fight
  } else if (mecha.introPhase === 4) {
    drawMecha(mecha.x, mecha.y, 0, mecha.hp/mecha.maxHp);
    ctx.save(); ctx.textAlign="center";
    const fa = it<15?it/15:it>45?Math.max(0,(60-it)/15):1;
    ctx.globalAlpha=fa;
    ctx.font="bold 52px Rancho,cursive"; ctx.strokeStyle="#000"; ctx.lineWidth=7;
    ctx.strokeText("DR. WILY", GAME_W/2, GAME_H/2-20);
    ctx.fillStyle="#f5c842"; ctx.fillText("DR. WILY", GAME_W/2, GAME_H/2-20);
    ctx.font="22px Boogaloo,cursive"; ctx.fillStyle="#ff4040";
    ctx.fillText("DESTROY THE MECHA!", GAME_W/2, GAME_H/2+20);
    ctx.restore();
    if (it >= 60) { state = "playing"; }
  }

  drawHUD();
}

function drawWilyCapsuleRaw() {
  ctx.fillStyle="#cccccc";
  ctx.beginPath(); ctx.ellipse(0,0,28,32,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#888"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,0,28,32,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle="#aaddff";
  ctx.beginPath(); ctx.ellipse(0,-6,16,18,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#666";
  ctx.fillRect(-30,10,8,16); ctx.fillRect(22,10,8,16);
  ctx.fillStyle="rgba(255,150,0,0.7)";
  ctx.beginPath(); ctx.ellipse(-26,28,4,8,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(26,28,4,8,0,0,Math.PI*2); ctx.fill();
}

function drawWilyCapsule(x, y) {
  ctx.save(); ctx.translate(x, y);
  // Pod
  ctx.fillStyle="#cccccc";
  ctx.beginPath(); ctx.ellipse(0,0,28,32,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#888"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,0,28,32,0,0,Math.PI*2); ctx.stroke();
  // Window
  ctx.fillStyle="#aaddff";
  ctx.beginPath(); ctx.ellipse(0,-6,16,18,0,0,Math.PI*2); ctx.fill();
  // Wily silhouette in window — only show while dropping, hide after docking
  if (mecha.introPhase < 2) {
    ctx.fillStyle="#222";
    ctx.beginPath(); ctx.arc(0,-12,8,0,Math.PI*2); ctx.fill();
    ctx.fillRect(-8,-6,16,14);
  }
  // Thrusters
  ctx.fillStyle="#666";
  ctx.fillRect(-30,10,8,16); ctx.fillRect(22,10,8,16);
  // Thruster glow
  ctx.fillStyle="rgba(255,150,0,0.7)";
  ctx.beginPath(); ctx.ellipse(-26,28,4,8,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(26,28,4,8,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawMecha(x, y, crouch, hpR) {
  const standH = 220;
  const crouchOffset = crouch * 80;
  const bodyH = standH - crouchOffset;

  ctx.save();
  ctx.translate(x + 110, y + standH);

  // ── Feet / base ──
  ctx.fillStyle="#333344";
  ctx.fillRect(-65, -24, 58, 24);
  ctx.fillRect(8,   -24, 58, 24);
  ctx.strokeStyle="#5555aa"; ctx.lineWidth=1.5;
  ctx.strokeRect(-65,-24,58,24); ctx.strokeRect(8,-24,58,24);

  // ── Legs ──
  const kneeY = -24 - (bodyH * 0.35);
  const hipY  = -24 - (bodyH * 0.6);
  ctx.fillStyle="#2a2a44";
  ctx.beginPath();
  ctx.moveTo(-52,-24); ctx.lineTo(-38,kneeY); ctx.lineTo(-25,hipY); ctx.lineTo(-45,hipY); ctx.lineTo(-58,kneeY); ctx.lineTo(-72,-24);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#4444aa"; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(52,-24); ctx.lineTo(38,kneeY); ctx.lineTo(25,hipY); ctx.lineTo(45,hipY); ctx.lineTo(58,kneeY); ctx.lineTo(72,-24);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#555566";
  ctx.beginPath(); ctx.arc(-48,kneeY,11,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 48,kneeY,11,0,Math.PI*2); ctx.fill();

  // ── Body ──
  const bodyTop = hipY - (bodyH * 0.35);
  ctx.fillStyle = hpR<0.4?"#662020":"#1e1e3a";
  ctx.fillRect(-54, bodyTop, 108, hipY-bodyTop);
  ctx.strokeStyle= hpR<0.4?"#ff4040":"#4444cc"; ctx.lineWidth=2;
  ctx.strokeRect(-54, bodyTop, 108, hipY-bodyTop);

  // ── Missile launcher grate ──
  const gx = -34, gy = bodyTop+8, gw = 68, gh = 42;
  const grateAmt = mecha.grateAmt || 0;
  const grateOpenH = gh * grateAmt * 0.5;

  // Grate housing
  ctx.fillStyle="#111122";
  ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle="#3333aa"; ctx.lineWidth=1;
  ctx.strokeRect(gx, gy, gw, gh);

  // Weak point — only visible when open
  if (grateAmt > 0.1) {
    const weakPulse = 0.6+Math.sin(frameCount*0.2)*0.4;
    ctx.fillStyle=`rgba(255,80,0,${weakPulse*grateAmt})`;
    ctx.beginPath(); ctx.arc(0, gy+gh/2, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle=`rgba(255,200,0,${grateAmt})`;
    ctx.beginPath(); ctx.arc(0, gy+gh/2, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle=`rgba(255,150,0,${grateAmt})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0, gy+gh/2, 16, 0, Math.PI*2); ctx.stroke();
    // Missile tips
    ctx.fillStyle=`rgba(180,180,180,${grateAmt*0.9})`;
    ctx.fillRect(-28, gy+gh/2-5, 10, 10);
    ctx.fillRect( 18, gy+gh/2-5, 10, 10);
    ctx.fillStyle=`rgba(255,80,0,${grateAmt*0.8})`;
    ctx.beginPath(); ctx.moveTo(-28,gy+gh/2-5); ctx.lineTo(-23,gy+gh/2-10); ctx.lineTo(-18,gy+gh/2-5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18,gy+gh/2-5); ctx.lineTo(23,gy+gh/2-10); ctx.lineTo(28,gy+gh/2-5); ctx.fill();
  }

  // Grate panels sliding apart
  ctx.save();
  ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
  // Top panel slides up
  ctx.fillStyle=hpR<0.4?"#662020":"#252545";
  ctx.fillRect(gx, gy-grateOpenH, gw, gh/2);
  for (let i=0;i<4;i++) {
    const sy = gy-grateOpenH + i*(gh/2/4);
    ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(gx, sy, gw, 3);
    ctx.strokeStyle=hpR<0.4?"#883333":"#4444aa"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(gx,sy); ctx.lineTo(gx+gw,sy); ctx.stroke();
  }
  // Bottom panel slides down
  ctx.fillStyle=hpR<0.4?"#662020":"#252545";
  ctx.fillRect(gx, gy+gh/2+grateOpenH, gw, gh/2);
  for (let i=0;i<4;i++) {
    const sy = gy+gh/2+grateOpenH + i*(gh/2/4);
    ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(gx, sy, gw, 3);
    ctx.strokeStyle=hpR<0.4?"#883333":"#4444aa"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(gx,sy); ctx.lineTo(gx+gw,sy); ctx.stroke();
  }
  ctx.strokeStyle=hpR<0.4?"#ff4040":"#5555cc"; ctx.lineWidth=2;
  ctx.strokeRect(gx, gy, gw, gh);
  ctx.restore();

  if (grateAmt > 0.3 && grateAmt < 0.95) {
    ctx.fillStyle=`rgba(255,50,0,${grateAmt*0.9})`; ctx.font="bold 8px Arial"; ctx.textAlign="center";
    ctx.fillText("WEAK POINT", 0, gy-4);
  }

  // ── Arms ──
  const shoulderY = bodyTop + 10;
  const elbowY = shoulderY + (bodyH*0.2);
  const handY  = elbowY   + (bodyH*0.18);
  ctx.fillStyle="#2a2a44";
  ctx.beginPath();
  ctx.moveTo(-54,shoulderY); ctx.lineTo(-70,elbowY); ctx.lineTo(-76,handY);
  ctx.lineTo(-64,handY+14); ctx.lineTo(-56,elbowY+5); ctx.lineTo(-48,shoulderY+14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#4444aa"; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(54,shoulderY); ctx.lineTo(70,elbowY); ctx.lineTo(76,handY);
  ctx.lineTo(64,handY+14); ctx.lineTo(56,elbowY+5); ctx.lineTo(48,shoulderY+14);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#333355";
  ctx.beginPath(); ctx.arc(-72,handY+8,16,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 72,handY+8,16,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#5555aa"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(-72,handY+8,16,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc( 72,handY+8,16,0,Math.PI*2); ctx.stroke();

  // ── Head (large saucer ship docked into body) ──
  if (state !== "headdetach") {
  const headCY = bodyTop - 50;
  const sRX = 60, sRY = 34; // much bigger saucer

  // Neck socket
  ctx.fillStyle="#111122";
  ctx.fillRect(-28, bodyTop-12, 56, 16);
  ctx.strokeStyle="#3333aa"; ctx.lineWidth=1;
  ctx.strokeRect(-28, bodyTop-12, 56, 16);

  // Lower disc hull
  ctx.fillStyle = hpR<0.4?"#882020":"#252545";
  ctx.beginPath(); ctx.ellipse(0, headCY+10, sRX, sRY*0.4, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle=hpR<0.4?"#ff4040":"#5555cc"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0, headCY+10, sRX, sRY*0.4, 0, 0, Math.PI*2); ctx.stroke();

  // Upper dome
  ctx.fillStyle = hpR<0.4?"#aa2020":"#1e1e3a";
  ctx.beginPath(); ctx.ellipse(0, headCY-6, sRX*0.75, sRY*0.95, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle=hpR<0.4?"#ff4040":"#5555cc"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0, headCY-6, sRX*0.75, sRY*0.95, 0, Math.PI, 0); ctx.stroke();

  // Cockpit window
  ctx.fillStyle="#aaddff";
  ctx.beginPath(); ctx.ellipse(0, headCY-14, sRX*0.38, sRY*0.55, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle="#88bbff"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.ellipse(0, headCY-14, sRX*0.38, sRY*0.55, 0, Math.PI, 0); ctx.stroke();

  // Wily silhouette — only show after capsule has docked
  if (mecha.introPhase >= 2 || state === "playing") {
    ctx.fillStyle="rgba(0,0,0,0.65)";
    ctx.beginPath(); ctx.arc(0, headCY-20, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-8, headCY-11, 16, 10);
  }

  // Red sensor eyes on disc
  const eyePulse = 0.6+Math.sin(frameCount*0.15)*0.4;
  ctx.fillStyle=`rgba(255,0,0,${eyePulse})`;
  ctx.beginPath(); ctx.arc(-22, headCY+8, 7, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 22, headCY+8, 7, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle="#ff4444";
  ctx.beginPath(); ctx.arc(-22, headCY+8, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 22, headCY+8, 3, 0, Math.PI*2); ctx.fill();

  // Rim lights
  const rimPulse = Math.floor(frameCount/6)%2===0;
  ctx.fillStyle = rimPulse?"rgba(0,160,255,0.9)":"rgba(0,60,120,0.4)";
  for (let i=0; i<8; i++) {
    const a = (Math.PI * i/8) - Math.PI*0.05;
    const rx = Math.cos(a)*sRX*0.88;
    const ry = Math.sin(a)*sRY*0.32 + headCY + 10;
    ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI*2); ctx.fill();
  }

  // Docking clamps
  ctx.fillStyle="#333355";
  ctx.fillRect(-40, headCY+22, 14, 10);
  ctx.fillRect( 26, headCY+22, 14, 10);
  ctx.strokeStyle="#5555aa"; ctx.lineWidth=1;
  ctx.strokeRect(-40, headCY+22, 14, 10);
  ctx.strokeRect( 26, headCY+22, 14, 10);

  // ── HP bar ──
  const bw = 120;
  ctx.fillStyle="#440000"; ctx.fillRect(-bw/2, headCY-62, bw, 9);
  ctx.fillStyle=hpR>0.5?"#00ff80":hpR>0.25?"#ffaa00":"#ff3030";
  ctx.fillRect(-bw/2, headCY-62, bw*hpR, 9);
  ctx.fillStyle="#fff"; ctx.font="9px Arial"; ctx.textAlign="center";
  ctx.fillText("DR. WILY", 0, headCY-66);
  } // end if (state !== "headdetach")

  ctx.restore();
}


function updateMecha() {
  if (!mecha.active || mecha.dead) return;
  const mb = mecha;

  mb.stateTimer--;

  // Smooth vertical movement
  const dy = mb.targetY - mb.y;
  mb.vy += dy * 0.015;
  mb.vy *= 0.88;
  mb.y += mb.vy;
  mb.y = Math.max(GAME_H-260, Math.min(GAME_H-180, mb.y));

  if (mb.cstate === "waiting") {
    mecha.grateAmt = Math.max(0, mecha.grateAmt - 0.05);
    // Burst fire from eyes — chest closed
    mb.burstTimer = (mb.burstTimer||0) - 1;
    if (mb.burstTimer <= 0) {
      mb.burstTimer = 28 + Math.random()*20;
      // Eye world positions: anchor=(mb.x+110, mb.y+220), eyes at (±22, headCY+8)
      // headCY = bodyTop-50 = -233-50 = -283, so eye world y = mb.y+220-283+8 = mb.y-55
      const eyeWorldY = mb.y - 55;
      [-22, 22].forEach(ox => {
        const ex = mb.x + 110 + ox;
        const ey = eyeWorldY;
        const dx = player.x+player.w/2 - ex + (Math.random()-0.5)*30;
        const dy = player.y+player.h/2 - ey + (Math.random()-0.5)*30;
        const dist = Math.sqrt(dx*dx+dy*dy)||1;
        enemyBullets.push({x:ex, y:ey, vx:(dx/dist)*3.5, vy:(dy/dist)*3.5, enemy:true});
      });
      if(sfxEnabled) playTone(350,"square",0.06,0.1,200);
    }
    if (mb.stateTimer <= 0) {
      mb.cstate = "moving";
      mb.targetY = (GAME_H-280) + Math.random()*100;
      mb.stateTimer = 80 + Math.random()*60;
    }

  } else if (mb.cstate === "moving") {
    mecha.grateAmt = Math.max(0, mecha.grateAmt - 0.05);
    // Burst fire from eyes while moving
    mb.burstTimer = (mb.burstTimer||0) - 1;
    if (mb.burstTimer <= 0) {
      mb.burstTimer = 22 + Math.random()*16;
      const eyeWorldY = mb.y - 55;
      [-22, 22].forEach(ox => {
        const ex = mb.x + 110 + ox;
        const ey = eyeWorldY;
        const dx = player.x+player.w/2 - ex + (Math.random()-0.5)*25;
        const dy = player.y+player.h/2 - ey + (Math.random()-0.5)*25;
        const dist = Math.sqrt(dx*dx+dy*dy)||1;
        enemyBullets.push({x:ex, y:ey, vx:(dx/dist)*3.5, vy:(dy/dist)*3.5, enemy:true});
      });
      if(sfxEnabled) playTone(350,"square",0.06,0.1,200);
    }
    if (mb.stateTimer <= 0) {
      mb.cstate = "opening";
      mb.stateTimer = 40;
    }

  } else if (mb.cstate === "opening") {
    mecha.grateAmt = Math.min(1, mecha.grateAmt + 0.04);
    if (mb.stateTimer <= 0) {
      mb.cstate = "attacking";
      mb.stateTimer = 90;
      mb.fistTimer = 0;
      mb.rocketFired = false;
    }

  } else if (mb.cstate === "attacking") {
    mecha.grateAmt = 1;
    mb.fistTimer++;

    // Fire ONE big rocket from the open bay
    if (!mb.rocketFired && mb.fistTimer === 15) {
      mb.rocketFired = true;
      const gx = mb.x + 110;
      const gy = mb.y + 16;
      const dx = player.x+player.w/2 - gx;
      const dy = player.y+player.h/2 - gy;
      const dist = Math.sqrt(dx*dx+dy*dy)||1;
      enemyBullets.push({
        x:gx, y:gy,
        vx:(dx/dist)*3.5, vy:(dy/dist)*3.5,
        enemy:true, rocket:true,
        smokeTimer:0,
      });
      if(sfxEnabled) { playTone(60,"sawtooth",0.4,0.6,30); }
    }

    if (mb.stateTimer <= 0) {
      mb.cstate = "closing";
      mb.stateTimer = 35;
    }

  } else if (mb.cstate === "closing") {
    mecha.grateAmt = Math.max(0, mecha.grateAmt - 0.05);
    if (mb.stateTimer <= 0) {
      mb.cstate = "waiting";
      mb.stateTimer = 60 + Math.random()*40;
    }
  }

  // Player bullets vs mecha — only hits when grate is open
  // drawMecha anchors at (mb.x+110, mb.y+220), grate centre at (0, bodyTop+8+21) in local space
  // bodyTop = hipY - bodyH*0.35 = (-24-220*0.6) - 220*0.35 = -156 - 77 = -233
  // grate centre local y = -233 + 8 + 21 = -204
  const chestX = mb.x + 110;
  const chestY = mb.y + 220 - 204; // = mb.y + 16
  const chestR = 34; // generous hit radius covering the whole bay

  bullets = bullets.filter(b => {
    if (b.x > GAME_W) return false;
    if (mecha.grateAmt > 0.7 && Math.sqrt((b.x-chestX)**2+(b.y-chestY)**2) < chestR) {
      mb.hp--;
      explode(b.x,b.y,"#ff8800","#ffff00",8);
      sfxHitEnemy();
      if (mb.hp <= 0) {
        mb.dead = true; mb.active = false;
        // Store head world position before body explodes
        mecha.headX = mb.x + 110; // saucer centre x
        mecha.headY = mb.y - 55;  // saucer centre y (eye level)
        mecha.headVY = 0;
        mecha.headPhase = "pop"; // pop → fly → fight
        mecha.headTimer = 0;
        score += 3000;
        // Body chain explosions
        for(let i=0;i<6;i++) explode(mb.x+40+Math.random()*120, mb.y+Math.random()*200,"#ff4020","#ffcc00",20);
        sfxExplode(); sfxExplode();
        state = "headdetach";
      }
      return false;
    }
    // Bullets bounce off closed grate only
    if (mecha.grateAmt < 0.5 && Math.sqrt((b.x-chestX)**2+(b.y-chestY)**2) < chestR+8) {
      explode(b.x,b.y,"#4040ff","#aaaaff",4);
      if(sfxEnabled) playTone(600,"square",0.03,0.06,400);
      return false;
    }
    return true;
  });

  // Player hit by mecha body
  if (player.invincible <= 0) {
    const px=player.x+player.w/2, py=player.y+player.h/2;
    if (px>mb.x+30 && px<mb.x+150 && py>mb.y+40 && py<mb.y+180) {
      playerHit(); updateHUD(); player.invincible=90;
      explode(px,py,"#f5c842","#ff4040",20); sfxPlayerHit();
    }
    // Enemy bullets
    for (const b of enemyBullets) {
      if (rectsOverlap(b.x-8,b.y-4,16,8,player.x+8,player.y+4,player.w-16,player.h-8)) {
        playerHit(); updateHUD(); player.invincible=90;
        explode(player.x+player.w/2,player.y+player.h/2,"#f5c842","#ff4040",20); sfxPlayerHit();
        break;
      }
    }
  }
  enemyBullets=enemyBullets.filter(b=>{b.x+=b.vx;b.y+=b.vy;return b.x>-20&&b.y>-20&&b.y<GAME_H+20;});
}

// ─── Head detach animation ────────────────────────────────────
function drawSaucerHead(cx, cy, hpR, sRX, sRY, cockpitOpen) {
  ctx.save(); ctx.translate(cx, cy);

  // Lower disc
  ctx.fillStyle = hpR<0.4?"#882020":"#252545";
  ctx.beginPath(); ctx.ellipse(0,10,sRX,sRY*0.4,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=hpR<0.4?"#ff4040":"#5555cc"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,10,sRX,sRY*0.4,0,0,Math.PI*2); ctx.stroke();

  // Upper dome
  ctx.fillStyle = hpR<0.4?"#aa2020":"#1e1e3a";
  ctx.beginPath(); ctx.ellipse(0,-6,sRX*0.75,sRY*0.95,0,Math.PI,0); ctx.fill();
  ctx.strokeStyle=hpR<0.4?"#ff4040":"#5555cc"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,-6,sRX*0.75,sRY*0.95,0,Math.PI,0); ctx.stroke();

  // Cockpit window
  ctx.fillStyle="#aaddff";
  ctx.beginPath(); ctx.ellipse(0,-14,sRX*0.38,sRY*0.55,0,Math.PI,0); ctx.fill();
  ctx.strokeStyle="#88bbff"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.ellipse(0,-14,sRX*0.38,sRY*0.55,0,Math.PI,0); ctx.stroke();

  // Cockpit weak point glow if open
  if (cockpitOpen) {
    const cpGlow = 0.6+Math.sin(frameCount*0.2)*0.3;
    ctx.fillStyle=`rgba(0,220,255,${cpGlow*0.6})`;
    ctx.beginPath(); ctx.ellipse(0,-14,sRX*0.38,sRY*0.55,0,Math.PI,0); ctx.fill();
    ctx.strokeStyle="#00ffff"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.ellipse(0,-14,sRX*0.38,sRY*0.55,0,Math.PI,0); ctx.stroke();
    if(Math.floor(frameCount/12)%2===0) {
      ctx.fillStyle="#00ffff"; ctx.font="bold 10px Boogaloo,cursive"; ctx.textAlign="center";
      ctx.fillText("WEAK!", 0, -sRY*0.95-8);
    }
  }

  // Wily silhouette
  ctx.fillStyle="rgba(0,0,0,0.65)";
  ctx.beginPath(); ctx.arc(0,-20,10,0,Math.PI*2); ctx.fill();
  ctx.fillRect(-8,-11,16,10);

  // Red sensor eyes
  const eyePulse = 0.6+Math.sin(frameCount*0.15)*0.4;
  ctx.fillStyle=`rgba(255,0,0,${eyePulse})`;
  ctx.beginPath(); ctx.arc(-sRX*0.37,8,7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( sRX*0.37,8,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ff4444";
  ctx.beginPath(); ctx.arc(-sRX*0.37,8,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( sRX*0.37,8,3,0,Math.PI*2); ctx.fill();

  // Rim lights
  const rimPulse = Math.floor(frameCount/6)%2===0;
  ctx.fillStyle=rimPulse?"rgba(0,160,255,0.9)":"rgba(0,60,120,0.4)";
  for(let i=0;i<8;i++){
    const a=(Math.PI*i/8)-Math.PI*0.05;
    ctx.beginPath(); ctx.arc(Math.cos(a)*sRX*0.88, Math.sin(a)*sRY*0.32+10, 4, 0, Math.PI*2); ctx.fill();
  }

  // Thruster glow at bottom when flying
  const tGlow = 0.5+Math.sin(frameCount*0.2)*0.4;
  ctx.fillStyle=`rgba(0,150,255,${tGlow*0.8})`;
  ctx.beginPath(); ctx.ellipse(0,sRY*0.4+10,sRX*0.3,8,0,0,Math.PI*2); ctx.fill();

  // HP bar
  if (hpR < 1) {
    const bw = sRX * 1.6;
    ctx.fillStyle="#440000"; ctx.fillRect(-bw/2, -sRY*0.95-28, bw, 8);
    ctx.fillStyle=hpR>0.5?"#00ff80":hpR>0.25?"#ffaa00":"#ff3030";
    ctx.fillRect(-bw/2, -sRY*0.95-28, bw*hpR, 8);
    ctx.fillStyle="#fff"; ctx.font="9px Arial"; ctx.textAlign="center";
    ctx.fillText("DR. WILY", 0, -sRY*0.95-32);
  }

  ctx.restore();
}

function updateHeadDetach() {
  mecha.headTimer++;
  const t = mecha.headTimer;

  drawBG();
  particles.forEach(drawParticle);
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});

  // Body still visible briefly, smoking and exploding
  if (t < 60) {
    drawMecha(mecha.x, mecha.y, 0, 0);
    if (t%3===0) explode(mecha.x+30+Math.random()*140, mecha.y+40+Math.random()*180,"#ff4020","#ffcc00",12);
    if (t%10===0) sfxExplode();
    // Head pops up with a jolt
    if (t < 20) {
      mecha.headVY -= 0.8; // accelerate upward
    } else {
      mecha.headVY *= 0.92; // decelerate
    }
    mecha.headY += mecha.headVY;
  } else if (t === 60) {
    // Body fully explodes
    for(let i=0;i<12;i++) explode(mecha.x+Math.random()*200, mecha.y+Math.random()*220,"#ff4020","#ffcc00",25);
    sfxExplode(); sfxExplode(); sfxExplode();
  }

  // Head hovering
  const hoverY = GAME_H/2 - 60 + Math.sin(frameCount*0.05)*8;
  if (t > 60) {
    mecha.headY += (hoverY - mecha.headY)*0.04;
    // Thruster particles
    if (t%3===0) particles.push({
      x:mecha.headX+(Math.random()-0.5)*40, y:mecha.headY+40,
      vx:(Math.random()-0.5)*1, vy:1+Math.random()*2,
      life:0.6, decay:0.04, r:4+Math.random()*6,
      color:"rgba(0,120,255,0.5)", type:"circle",
    });
  }

  // Draw saucer head
  drawSaucerHead(mecha.headX, mecha.headY, 1, 60, 34, false);

  // "PHASE 2" text
  if (t > 70 && t < 150) {
    const a = t<90?(t-70)/20:t>130?Math.max(0,(150-t)/20):1;
    ctx.save(); ctx.globalAlpha=a; ctx.textAlign="center";
    ctx.font="bold 48px Rancho,cursive"; ctx.strokeStyle="#000"; ctx.lineWidth=6;
    ctx.strokeText("PHASE 2!", GAME_W/2, GAME_H/2+80);
    ctx.fillStyle="#ff4040"; ctx.fillText("PHASE 2!", GAME_W/2, GAME_H/2+80);
    ctx.font="20px Boogaloo,cursive"; ctx.fillStyle="#f5c842";
    ctx.fillText("Destroy the ship!", GAME_W/2, GAME_H/2+110);
    ctx.restore();
  }

  drawPlane(player.x, player.y, player.w, player.h, player.invincible, player.propAngle);
  player.propAngle += 0.35;
  drawHUD();

  // Transition to phase 2 fight after head has hovered
  if (t >= 160) {
    // Set up the megaboss (skull ship) using saucer head position
    waveNum = 5; // stay on 5
    enemies = [];
    const boss = makeEnemy(mecha.headX - 70, mecha.headY - 60, "megaboss", 0);
    boss.x = mecha.headX - 70;
    boss.y = mecha.headY - 60;
    enemies.push(boss);
    // Debug: if low HP mode, set phase 2 to 10 hits too
    if (boss.maxHp === 25) boss.hp = 25; // normal
    boss.phaseTimer = 30; // open cockpit quickly
    enemyBullets = []; bullets = [];
    state = "playing";
  }
}

// ─── Intro Cinematic ──────────────────────────────────────────
let cin = {
  timer: 0, shipX: 0, shipY: 0, shake: 0,
  buildings: [], explosions: [],
  laserTargetX: 0, laserAlpha: 0,
  hitIdx: 0, hitQueue: [], clouds: [],
};

const CIN_BUILDINGS = [
  {x:60,w:50,h:120},{x:125,w:35,h:160},{x:175,w:60,h:100},
  {x:248,w:40,h:140},{x:300,w:55,h:90},{x:368,w:45,h:130},
  {x:425,w:70,h:110},{x:508,w:38,h:150},{x:558,w:50,h:95},
  {x:620,w:42,h:135},{x:675,w:60,h:105},{x:748,w:35,h:125},
];

// Total: ~900 frames (~15s)
// 0–180:  peaceful sunny day
// 180–320: sky greys, ship appears
// 320–700: firing, buildings destroyed
// 700–850: ruins, deep red sky
// 850–900: fade to white

function startIntroCinematic() {
  cin.timer=0; cin.shipX=GAME_W*1.8; cin.shipY=60; cin.shake=0;
  cin.laserAlpha=0; cin.explosions=[]; cin.hitIdx=0;
  cin.hitQueue=[2,5,9,1,7,3,11,4,8,0,6,10];
  cin.buildings=CIN_BUILDINGS.map(b=>({...b,destroyed:false}));
  cin.clouds=[{x:80,y:55,w:120},{x:300,y:40,w:90},{x:500,y:65,w:110},{x:680,y:45,w:80}];
  state="cinematic";
}

function updateCinematic() {
  cin.timer++;
  const t=cin.timer;
  cin.shake*=0.85;

  if (t<320) cin.clouds.forEach(c=>{c.x-=0.3; if(c.x+c.w<-20) c.x=GAME_W+20;});

  if (t>200) cin.shipX+=(GAME_W*0.60-cin.shipX)*0.006;

  if (t>=320&&t<700&&(t-320)%35===0&&cin.hitIdx<cin.hitQueue.length) {
    const b=cin.buildings[cin.hitQueue[cin.hitIdx++]];
    cin.laserAlpha=1; cin.laserTargetX=b.x+b.w/2;
    cin.shake=6+cin.hitIdx*0.4; b.destroyed=true;
    for(let i=0;i<18;i++) particles.push({
      x:b.x+Math.random()*b.w, y:GAME_H-b.h-10+Math.random()*b.h*0.5,
      vx:(Math.random()-0.5)*6, vy:-(1.5+Math.random()*5),
      life:1,decay:0.02,r:3+Math.random()*6,
      color:Math.random()>0.5?"#aa8855":"#666655",type:"circle"
    });
    cin.explosions.push({x:b.x+b.w/2,y:GAME_H-b.h-15,r:0,life:1});
    sfxExplode();
  }
  cin.laserAlpha=Math.max(0,cin.laserAlpha-0.04);
  cin.explosions=cin.explosions.filter(e=>{e.r+=2;e.life-=0.025;return e.life>0;});

  ctx.save();
  if(cin.shake>0.5) ctx.translate((Math.random()-0.5)*cin.shake,(Math.random()-0.5)*cin.shake*0.5);
  drawCinematicScene(t);
  ctx.restore();

  particles.forEach(drawParticle);
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life-=p.decay;return p.life>0;});

  if (t>=850) {
    const fa=Math.min((t-850)/50,1);
    ctx.fillStyle=`rgba(255,255,255,${fa})`; ctx.fillRect(0,0,GAME_W,GAME_H);
  }
  if (t>=900) { startGameActual(); return; }

  ctx.save(); ctx.textAlign="center"; ctx.globalAlpha=0.28;
  ctx.fillStyle="#fff"; ctx.font="11px Boogaloo,cursive";
  ctx.fillText(isMobile?"Tap to skip":"SPACE to skip",GAME_W/2,GAME_H-10);
  ctx.restore();
}

function drawCinematicScene(t) {
  const skyP=Math.max(0,Math.min(1,(t-180)/520));
  const r1=Math.round(lerpc(30,60,skyP)), g1=Math.round(lerpc(100,8,skyP)), b1=Math.round(lerpc(180,0,skyP));
  const r2=Math.round(lerpc(80,80,skyP)), g2=Math.round(lerpc(160,15,skyP)), b2=Math.round(lerpc(220,0,skyP));
  const sg=ctx.createLinearGradient(0,0,0,GAME_H*0.65);
  sg.addColorStop(0,`rgb(${r1},${g1},${b1})`); sg.addColorStop(1,`rgb(${r2},${g2},${b2})`);
  ctx.fillStyle=sg; ctx.fillRect(0,0,GAME_W,GAME_H);
  const gr=Math.round(lerpc(70,20,skyP));
  ctx.fillStyle=`rgb(${gr},${Math.round(gr*0.7)},0)`; ctx.fillRect(0,GAME_H*0.65,GAME_W,GAME_H*0.35);

  if (skyP<0.7) {
    ctx.save(); ctx.globalAlpha=(1-skyP/0.7)*0.85;
    cin.clouds.forEach(c=>{
      ctx.fillStyle="#ffffff";
      ctx.beginPath(); ctx.arc(c.x,c.y,c.w*0.28,0,Math.PI*2);
      ctx.arc(c.x+c.w*0.28,c.y-c.w*0.08,c.w*0.2,0,Math.PI*2);
      ctx.arc(c.x+c.w*0.55,c.y,c.w*0.25,0,Math.PI*2); ctx.fill();
    }); ctx.restore();
  }

  cin.buildings.forEach(b=>{
    if(!b.destroyed) return;
    ctx.fillStyle=`rgba(35,25,15,${0.15+Math.sin(frameCount*0.02+b.x)*0.07})`;
    ctx.fillRect(b.x+b.w*0.25,30,b.w*0.5,GAME_H-50);
  });

  if (t>185) {
    const shipA=Math.min((t-185)/80,1);
    ctx.save(); ctx.globalAlpha=shipA;
    const sx=cin.shipX,sy=cin.shipY;
    const hg=ctx.createLinearGradient(sx-140,sy,sx+140,sy);
    hg.addColorStop(0,"#1a1a2a"); hg.addColorStop(0.5,"#3a3a5a"); hg.addColorStop(1,"#1a1a2a");
    ctx.fillStyle=hg; ctx.beginPath(); ctx.ellipse(sx,sy+20,140,30,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#5555aa"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(sx,sy+20,140,30,0,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle="#252540"; ctx.beginPath(); ctx.ellipse(sx,sy-5,80,40,0,Math.PI,0); ctx.fill();
    ctx.strokeStyle="#4444aa"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(sx,sy-5,80,40,0,Math.PI,0); ctx.stroke();
    const cpR=Math.round(lerpc(100,220,skyP));
    ctx.fillStyle=`rgba(${cpR},30,0,0.6)`;
    ctx.beginPath(); ctx.ellipse(sx,sy-10,30,18,0,Math.PI,0); ctx.fill();
    ctx.fillStyle="#111120"; ctx.fillRect(sx-8,sy+48,16,25);
    const rl=Math.floor(frameCount/10)%2===0;
    ctx.fillStyle=rl?"rgba(255,50,0,0.9)":"rgba(80,0,0,0.3)";
    [-90,-50,-10,30,70,110].forEach(ox=>{ctx.beginPath();ctx.arc(sx+ox,sy+20,4,0,Math.PI*2);ctx.fill();});
    ctx.restore();
  }

  if (cin.laserAlpha>0.05) {
    const a=cin.laserAlpha,sx=cin.shipX,sy=cin.shipY;
    ctx.save(); ctx.shadowColor="#ff3000"; ctx.shadowBlur=18;
    ctx.strokeStyle=`rgba(255,60,0,${a*0.35})`; ctx.lineWidth=22;
    ctx.beginPath(); ctx.moveTo(sx,sy+73); ctx.lineTo(cin.laserTargetX,GAME_H-20); ctx.stroke();
    ctx.strokeStyle=`rgba(255,160,50,${a*0.8})`; ctx.lineWidth=7;
    ctx.beginPath(); ctx.moveTo(sx,sy+73); ctx.lineTo(cin.laserTargetX,GAME_H-20); ctx.stroke();
    ctx.strokeStyle=`rgba(255,255,200,${a})`; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sx,sy+73); ctx.lineTo(cin.laserTargetX,GAME_H-20); ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  }

  cin.explosions.forEach(e=>{
    ctx.save(); ctx.globalAlpha=e.life*0.6;
    ctx.strokeStyle="#ff7020"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.stroke(); ctx.restore();
  });

  const groundY=GAME_H-18;
  ctx.fillStyle="#0d0d0d"; ctx.fillRect(0,groundY,GAME_W,20);
  cin.buildings.forEach(b=>{
    const by=groundY-b.h;
    if (b.destroyed) {
      ctx.fillStyle="#2a2a18";
      ctx.beginPath(); ctx.moveTo(b.x,groundY); ctx.lineTo(b.x,by+b.h*0.58);
      ctx.lineTo(b.x+b.w*0.2,by+b.h*0.48); ctx.lineTo(b.x+b.w*0.5,by+b.h*0.62);
      ctx.lineTo(b.x+b.w*0.8,by+b.h*0.44); ctx.lineTo(b.x+b.w,by+b.h*0.55);
      ctx.lineTo(b.x+b.w,groundY); ctx.closePath(); ctx.fill();
      const fg=0.2+Math.sin(frameCount*0.12+b.x)*0.12;
      ctx.fillStyle=`rgba(255,80,0,${fg*0.5})`; ctx.fillRect(b.x,by+b.h*0.42,b.w,b.h*0.6);
    } else {
      const bL=Math.round(lerpc(32,14,Math.min(skyP*1.5,1)));
      ctx.fillStyle=`rgb(${bL},${bL},${Math.round(bL*1.1)})`; ctx.fillRect(b.x,by,b.w,b.h);
      const wA=Math.max(0,0.45-skyP*0.55);
      if(wA>0.05){
        ctx.fillStyle=`rgba(255,220,100,${wA})`;
        for(let wy=by+8;wy<groundY-8;wy+=12)
          for(let wx=b.x+5;wx<b.x+b.w-8;wx+=10) ctx.fillRect(wx,wy,6,6);
      }
    }
  });

  if(skyP>0.25){ctx.fillStyle=`rgba(255,60,0,${(skyP-0.25)/0.75*0.18})`;ctx.fillRect(0,groundY-8,GAME_W,28);}

  showCaption("A peaceful day...", "rgba(255,230,100,0.9)", t, 30, 170, 40, 50);
  showCaption("UNKNOWN VESSEL DETECTED", "#ff8040", t, 230, 380, 60, 60);
  showCaption("CITY UNDER ATTACK!", "#ff3020", t, 350, 560, 50, 70);
}

function showCaption(text, color, t, start, end, fadeIn, fadeOut) {
  const a=Math.min((t-start)/fadeIn,1)*Math.min((end-t)/fadeOut,1);
  if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a; ctx.textAlign="center";
  ctx.fillStyle=color; ctx.font="bold 20px Rancho,cursive";
  ctx.strokeStyle="rgba(0,0,0,0.8)"; ctx.lineWidth=4;
  ctx.strokeText(text,GAME_W/2,52); ctx.fillText(text,GAME_W/2,52); ctx.restore();
}

function lerpc(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}


// ─── Ground Escape Level ──────────────────────────────────────

// ─── Ground Escape (Level 1) ─────────────────────────────────
let absorbers = [];

let energyBalls = [];

function initAbsorbers() {
  absorbers = ABSORBER_Y.map(y => ({ y, hit:false, hitTimer:0, fired:false }));
  energyBalls = [];
}

function updateAbsorbers() {
  // When laser starts fading — the absorber that caught it fires an energy ball
  absorbers.forEach(a => {
    const wasHit = a.hit;
    if (cannon.cstate === "firing" || cannon.cstate === "fading") {
      if (Math.abs(a.y - cannon.laserY) < 14) {
        a.hit = true; a.hitTimer = 30;
        // Fire energy ball at moment laser starts fading
        if (cannon.cstate === "fading" && !a.fired) {
          a.fired = true;
          const p2 = cannon.phase2;
          const ballCount = p2 ? 2 : 1;
          for (let b=0; b<ballCount; b++) {
            // Aim toward player with slight spread for 2nd ball
            const tx = player.x + player.w/2;
            const ty = player.y + player.h/2;
            const sx = 50; const sy = a.y;
            const dx = tx - sx; const dy = ty - sy;
            const dist = Math.sqrt(dx*dx+dy*dy) || 1;
            const speed = 3.3;
            // Second ball has slight angular offset
            const angle = Math.atan2(dy, dx) + (b === 1 ? 0.3 : 0);
            energyBalls.push({
              x: sx, y: sy,
              vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
              alpha: 1, r: 10,
              phase2: p2,
            });
          }
        }
      }
    } else {
      a.fired = false; // reset so it can fire next time
    }
    if (a.hitTimer > 0) a.hitTimer--;
    else a.hit = false;
  });

  // Update energy balls — fade as they approach centre x
  energyBalls = energyBalls.filter(b => {
    b.x += b.vx; b.y += b.vy;
    // Fade from full at x=50 to zero at centre (GAME_W/2)
    b.alpha = Math.max(0, 1 - (b.x - 50) / (GAME_W/2 - 50));
    // Hit player
    if (player.invincible <= 0) {
      const dx = b.x - (player.x+player.w/2);
      const dy = b.y - (player.y+player.h/2);
      if (Math.sqrt(dx*dx+dy*dy) < b.r + 14) {
        playerHit(); updateHUD(); player.invincible=90;
        explode(b.x, b.y, "#00ffff","#ffffff", 14);
        if(sfxEnabled) playTone(300,"sine",0.3,0.3,150);
        return false;
      }
    }
    return b.alpha > 0.02 && b.x < GAME_W;
  });
}

function drawEnergyBalls() {
  energyBalls.forEach(b => {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    const pulse = 0.7 + Math.sin(frameCount*0.2)*0.3;
    const p2 = b.phase2;
    const col = p2 ? "180,0,255" : "0,180,255";
    const coreCol = p2 ? "220,100,255" : "0,220,255";
    ctx.shadowColor = p2?"#aa00ff":"#00ffff"; ctx.shadowBlur=18*pulse*b.alpha;
    ctx.fillStyle=`rgba(${col},${0.3*b.alpha})`;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r*1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=`rgba(${coreCol},${b.alpha})`;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=`rgba(255,255,255,${b.alpha*pulse})`;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.restore();
  });
}

function drawAbsorbers(offsetX=0) {
  // Solid left wall panel — slides in from left
  const ox = offsetX;
  ctx.fillStyle="#1a1a2a";
  ctx.fillRect(ox, 0, 28, GAME_H);
  ctx.strokeStyle="#3030aa"; ctx.lineWidth=1;
  ctx.strokeRect(ox, 0, 28, GAME_H);
  ctx.strokeStyle="rgba(60,60,120,0.4)"; ctx.lineWidth=1;
  for (let y=0; y<GAME_H; y+=40) {
    ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+28,y); ctx.stroke();
  }

  absorbers.forEach(a => {
    const pulse = 0.6 + Math.sin(frameCount*0.1 + a.y*0.01)*0.3;
    const active = a.hit;
    const p2 = cannon.phase2;
    const nodeColor = p2 ? (active?"#dd00ff":"rgba(120,0,200,") : (active?"#00ffff":"rgba(0,120,255,");
    const shadowCol = p2 ? "#aa00ff" : "#0060ff";

    // Mount arm
    ctx.fillStyle="#222238";
    ctx.fillRect(ox+22, a.y-8, 18, 16);
    ctx.strokeStyle="#4040aa"; ctx.lineWidth=1;
    ctx.strokeRect(ox+22, a.y-8, 18, 16);

    // Node circle
    ctx.save();
    ctx.translate(ox+50, a.y);
    ctx.shadowColor = shadowCol;
    ctx.shadowBlur = active?22:10;
    ctx.strokeStyle = active?(p2?"#dd00ff":"#00ffff"):(p2?`rgba(150,0,220,${pulse})`:`rgba(0,120,255,${pulse})`);
    ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = active?(p2?"rgba(180,0,255,0.55)":"rgba(0,220,255,0.55)"):(p2?`rgba(80,0,140,${pulse*0.5})`:`rgba(0,40,140,${pulse*0.5})`);
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = active?(p2?"#ee88ff":"#ffffff"):(p2?`rgba(180,80,255,${pulse})`:`rgba(60,160,255,${pulse})`);
    ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();

    if (active) {
      for (let i=0;i<2;i++) {
        const r = ((frameCount*4 + i*15)%40);
        ctx.globalAlpha = (1 - r/40)*0.7;
        ctx.strokeStyle = cannon.phase2?"#dd00ff":"#00ffff"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(0,0,16+r,0,Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha=1;
    }

    ctx.shadowBlur=0;
    ctx.restore();
  });
}

function updateWave4Intro() {
  wave4Intro.timer++;
  const t = wave4Intro.timer;
  const centreX = GAME_W/2 - 60;
  const centreY = GAME_H/2 - player.h/2;

  // Fly to centre
  if (player.x < centreX) player.x += 5;
  player.y += (centreY - player.y) * 0.08;
  player.propAngle += 0.35;

  const atCentre = player.x >= centreX - 5;

  // Once at centre, start cannon AND absorbers sliding in simultaneously
  if (atCentre) {
    if (!wave4Intro.cannonX) { wave4Intro.cannonX = GAME_W + 80; wave4Intro.absorberX = -80; }
    wave4Intro.cannonX   += (GAME_W - 55    - wave4Intro.cannonX)   * 0.05;
    wave4Intro.absorberX += (0              - wave4Intro.absorberX) * 0.05;
  }

  // Draw
  drawBG();

  // Absorbers slide in from left
  if (atCentre && wave4Intro.absorberX !== undefined) {
    drawAbsorbers(wave4Intro.absorberX);
  }

  particles.forEach(drawParticle);
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});

  // Draw cannon sliding in
  if (atCentre && wave4Intro.cannonX) {
    const cx = wave4Intro.cannonX;
    const cy = CANNON_POSITIONS[2];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle="#303050"; ctx.fillRect(-18,-28,48,56);
    ctx.strokeStyle="#6060aa"; ctx.lineWidth=2; ctx.strokeRect(-18,-28,48,56);
    ctx.fillStyle="#222240"; ctx.fillRect(-42,-10,30,20);
    ctx.strokeStyle="#8080cc"; ctx.lineWidth=1.5; ctx.strokeRect(-42,-10,30,20);
    ctx.fillStyle="#1a1a3a"; ctx.beginPath(); ctx.arc(-42,0,10,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#4040aa"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(-42,0,10,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle="#1a1a2a"; ctx.fillRect(20,-38,30,76);
    ctx.restore();
  }

  // Exhaust
  for (let i=0;i<2;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
    vx:-1.5-Math.random()*2, vy:(Math.random()-0.5)*0.8,
    life:0.6, decay:0.07, r:2+Math.random()*3,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });

  drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);

  // "WAVE 4" fades in once at centre, then fades out
  if (atCentre) {
    const elapsed = player.x >= centreX-5 ? (wave4Intro.cannonX ? Math.min((wave4Intro.cannonX-(GAME_W+80))/(GAME_W-55-(GAME_W+80)+0.001)*-1,1) : 0) : 0;
    const fadeIn = Math.min((t - wave4Intro.centreFrame||0) / 20, 1);
    if (!wave4Intro.centreFrame) wave4Intro.centreFrame = t;
    const cf = t - wave4Intro.centreFrame;
    const alpha = cf < 20 ? cf/20 : cf > 60 ? Math.max(1-(cf-60)/20, 0) : 1;
    if (alpha > 0) {
      ctx.save(); ctx.globalAlpha=alpha; ctx.textAlign="center";
      ctx.font="bold 64px Rancho,cursive";
      ctx.strokeStyle="#1a1a2a"; ctx.lineWidth=7;
      ctx.strokeText("WAVE 4", GAME_W/2, GAME_H/2-40);
      ctx.fillStyle="#f5c842"; ctx.fillText("WAVE 4", GAME_W/2, GAME_H/2-40);
      ctx.font="20px Boogaloo,cursive"; ctx.fillStyle="#fff";
      ctx.fillText("Destroy the laser cannon!", GAME_W/2, GAME_H/2);
      ctx.restore();
    }
  }

  drawHUD();

  // Done — cannon is in position
  if (atCentre && wave4Intro.cannonX && Math.abs(wave4Intro.cannonX - (GAME_W-55)) < 3) {
    wave4Intro.cannonX = null;
    wave4Intro.absorberX = null;
    wave4Intro.centreFrame = null;
    cannon.y = CANNON_POSITIONS[2];
    cannon.cstate = "waiting";
    cannon.stateTimer = 60;
    state = "playing";
  }
}

