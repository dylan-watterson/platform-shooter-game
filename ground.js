// ground.js — Ground Escape level (levels 1 & 2)
// ─── Ground Escape (Level 1) ─────────────────────────────────
const LANE_Y   = ROAD_Y + 40; // centre of first lane (jeep, boulders, craters all share this)

let gnd = {
  timer:0, scrollX:0, speed:3,
  jeepX:160, jeepY:340,
  obstacles:[],
  buildings:[], rubble:[],
  debrisTimer:50, craterTimer:80,
  tunnelTimer:0, shake:0, tunnelX:99999, blockages:null,
  distance:0, totalDist:2600,
  hitTimer:0, lives:3,
};

function startGroundEscape2() {
  score=0; lives=5; waveNum=1;
  gnd.timer=0; gnd.scrollX=0; gnd.speed=3;
  gnd.jeepX=160; gnd.jeepY=340;
  gnd.obstacles=[]; gnd.buildings=[]; gnd.rubble=[];
  gnd.debrisTimer=999; gnd.craterTimer=999;
  gnd.phase="escape"; gnd.tunnelTimer=0; gnd.shake=0; gnd.tunnelX=99999; gnd.blockages=null;
  gnd.distance=0; gnd.hitTimer=0;
  gnd.level=2;
  gnd.fireColumns=[]; gnd.burnDebris=[]; gnd.burnDebrisTimer=18;
  gnd.trees=[];
  // Mix of burnt and normal buildings at start
  for(let x=0;x<GAME_W+300;x+=110+Math.random()*130){
    const h=50+Math.random()*80;
    const destroyed=Math.random()<0.6; // 60% burnt at start
    gnd.buildings.push({x,h,w:35+Math.random()*45,destroyed,fireOffset:Math.random()*100});
  }
  for(let x=0;x<GAME_W;x+=40+Math.random()*30) gnd.rubble.push({x,y:ROAD_Y-4,w:6+Math.random()*10,h:3+Math.random()*7});
  state="ground2";
}

function startGroundEscape() {
  score=0; lives=5; waveNum=1;
  gnd.timer=0; gnd.scrollX=0; gnd.speed=3;
  gnd.jeepX=160; gnd.jeepY=340;
  gnd.obstacles=[]; gnd.buildings=[]; gnd.rubble=[];
  gnd.debrisTimer=60; gnd.craterTimer=100;
  gnd.phase="escape"; gnd.tunnelTimer=0; gnd.shake=0; gnd.tunnelX=99999; gnd.blockages=null;
  gnd.distance=0; gnd.hitTimer=0;
  gnd.level=1;
  gnd.fireColumns=[]; gnd.burnDebris=[]; gnd.burnDebrisTimer=18;
  // Pre-fill fire columns rising from building tops
  for(let x=0;x<GAME_W+300;x+=70+Math.random()*90)
    gnd.fireColumns.push({x, phase:Math.random()*Math.PI*2, h:40+Math.random()*80, w:18+Math.random()*28});
  // Pre-fill background buildings
  for(let x=0;x<GAME_W+200;x+=80+Math.random()*60) gnd.buildings.push(makeGndBuilding(x));
  for(let x=0;x<GAME_W;x+=40+Math.random()*30) gnd.rubble.push({x,y:ROAD_Y-4,w:6+Math.random()*14,h:4+Math.random()*10});
  state="ground";
}

function makeGndBuilding(x) {
  const destroyed=Math.random()<0.7;
  const h=60+Math.random()*100;
  return {x,h,w:40+Math.random()*50,destroyed,fireOffset:Math.random()*100};
}

function updateGroundEscape() {
  gnd.timer++; gnd.shake*=0.8;
  const t=gnd.timer;

  // Speed ramp — only during normal escape
  if(gnd.phase==="escape") {
    gnd.speed = 4 + (gnd.distance/gnd.totalDist)*5;
  }
  gnd.distance = Math.min(gnd.distance + (gnd.phase==="escape" && gnd.timer>270 ? (gnd.level===2 ? 2.5 : 1) : 0), gnd.totalDist);
  if(gnd.phase!=="ed_drop" && gnd.phase!=="ed_stand") gnd.scrollX += gnd.speed;

  const progress = gnd.distance/gnd.totalDist;

  // Input locked during opening title and ED death/victory sequence
  const edDeathActive = gnd.edSubPhase==="dying" || gnd.edSubPhase==="ed_exploding" || gnd.edSubPhase==="ed_victory";
  if((gnd.phase!=="escape" || gnd.timer > 270) && !edDeathActive) {
  const moveLeft  = keys["ArrowLeft"] ||keys["a"]||keys["A"]||(joy.dx<-0.2);
  const moveRight = keys["ArrowRight"]||keys["d"]||keys["D"]||(joy.dx>0.2);
  const moveUp    = keys["ArrowUp"]   ||keys["w"]||keys["W"]||(joy.dy<-0.2);
  const moveDown  = keys["ArrowDown"] ||keys["s"]||keys["S"]||(joy.dy>0.2);
  const jeepSpeed = 3.5 + Math.max(Math.abs(joy.dx),Math.abs(joy.dy)) * 2.5;
  const jeepSpeedY = 1.8 + Math.abs(joy.dy) * 1.2;
  if (moveLeft)  gnd.jeepX = Math.max(30,              gnd.jeepX - jeepSpeed);
  if (moveRight) gnd.jeepX = Math.min(GAME_W-JEEP_W-20, gnd.jeepX + jeepSpeed);
  if (moveUp)    gnd.jeepY = Math.max(ROAD_Y+4,         gnd.jeepY - jeepSpeedY);
  if (moveDown)  gnd.jeepY = Math.min(GAME_H-JEEP_H-4,  gnd.jeepY + jeepSpeedY);
  if(gnd.edSubPhase === "done" || gnd.edSuperBlastActive) {
    gnd.jeepX = Math.max(123, Math.min(621, gnd.jeepX));
  }
  }

  // Scroll fire columns (parallax with buildings)
  gnd.fireColumns.forEach(c=>{ c.x-=gnd.speed*0.4; });
  gnd.fireColumns=gnd.fireColumns.filter(c=>c.x+c.w>-20);
  if(gnd.fireColumns.length<10) gnd.fireColumns.push({x:GAME_W+60+Math.random()*80,phase:Math.random()*Math.PI*2,h:40+Math.random()*80,w:18+Math.random()*28});

  // Spawn burning debris falling from sky
  gnd.burnDebrisTimer--;
  if(gnd.burnDebrisTimer<=0) {
    gnd.burnDebris.push({
      x: Math.random()*GAME_W, y: -20,
      vx: (Math.random()-0.5)*2 - gnd.speed*0.15,
      vy: 1.2+Math.random()*2.5,
      rot: Math.random()*Math.PI*2, rotV: (Math.random()-0.5)*0.12,
      w: 10+Math.random()*20, h: 7+Math.random()*14,
      firePhase: Math.random()*Math.PI*2,
    });
    gnd.burnDebrisTimer = 12 + Math.random()*20;
  }
  // Update + cull burn debris
  gnd.burnDebris.forEach(d=>{ d.x+=d.vx; d.y+=d.vy; d.rot+=d.rotV; d.firePhase+=0.18; });
  const l2fireGone = gnd.level===2 && (1 - progress*(1/0.2)) < 0.02;
  gnd.burnDebris=gnd.burnDebris.filter(d=>!l2fireGone && d.y<ROAD_Y+10 && d.x>-60 && d.x<GAME_W+60);

  // Scroll buildings
  gnd.buildings.forEach(b=>{ b.x-=gnd.speed*0.4; });
  gnd.buildings=gnd.buildings.filter(b=>b.x+b.w>-20);
  // Level 2: burnt buildings get fewer — stop spawning new ones, tree density increases
  if(gnd.level===2) {
    // Spawn trees — gap shrinks as progress grows (denser trees ahead)
    if(!gnd.treeTimer) gnd.treeTimer=0;
    gnd.treeTimer--;
    const treeGap = Math.max(8, 180 - Math.max(0,(progress-0.2)/0.4)*172);
    if(gnd.treeTimer<=0 && progress > 0.2) {
      const r = Math.random();
      const type = r < (0.5 - progress*0.3) ? "bush" : r < 0.75 ? "mid" : "tall";
      const h = type==="bush" ? 12+Math.random()*10 : type==="tall" ? 50+Math.random()*40 : 28+Math.random()*22;
      const w = type==="bush" ? 20+Math.random()*18 : type==="tall" ? 22+Math.random()*16 : 18+Math.random()*14;
      const clusterCount = type==="bush" ? Math.floor(Math.random()*4)+2 : Math.floor(Math.random()*2)+1;
      for(let c=0;c<clusterCount;c++){
        gnd.trees.push({x:GAME_W+20+c*(w*0.65+Math.random()*10), h, w, type, variant:Math.floor(Math.random()*3)});
      }
      gnd.treeTimer = treeGap + Math.random()*treeGap*0.4;
    }
    gnd.trees.forEach(t=>{ t.x-=gnd.speed*0.4; });
    gnd.trees=gnd.trees.filter(t=>t.x+t.w>-20);
  } else {
    if(gnd.buildings.length<12) gnd.buildings.push(makeGndBuilding(GAME_W+60));
  }

  // Scroll rubble
  gnd.rubble.forEach(r=>{ r.x-=gnd.speed; });
  gnd.rubble=gnd.rubble.filter(r=>r.x+r.w>-10);
  if(gnd.rubble.length<18) gnd.rubble.push({x:GAME_W+20,y:ROAD_Y-4+Math.random()*8,w:6+Math.random()*14,h:4+Math.random()*10});

  // Spawn debris — paused during gauntlet
  if((gnd.phase==="escape" || gnd.phase==="tunnel_approach" || gnd.phase==="tunnel_gauntlet") && gnd.level!==2) {
  gnd.debrisTimer--;
  if(gnd.debrisTimer<=0) {
    const big = Math.random()<0.4 && gnd.phase==="escape" && gnd.timer>270;
    const w = big ? 90+Math.random()*60 : 18+Math.random()*18;
    const h = big ? 70+Math.random()*50 : 12+Math.random()*14;
    const spawnX = (gnd.phase==="tunnel_gauntlet")
      ? 20 + Math.random()*(GAME_W - 80)
      : GAME_W*0.5 + Math.random()*(GAME_W*0.5 - 80);
    const numPts = big ? 6+Math.floor(Math.random()*3) : 5+Math.floor(Math.random()*2);
    const shape = [];
    for(let i=0;i<numPts;i++){
      const ang = (i/numPts)*Math.PI*2;
      const r = 0.32 + Math.random()*0.2;
      shape.push([Math.cos(ang)*r, Math.sin(ang)*r]);
    }
    gnd.obstacles.push({
      type:"debris", big,
      x: spawnX, y: -80,
      vy: big ? 2+Math.random()*1.5 : 4+Math.random()*3,
      vx: (Math.random()-0.5)*1.5,
      w, h, shape,
      rot: Math.random()*Math.PI, rotV: (Math.random()-0.5)*0.06,
      landed: false,
      landY: ROAD_Y + 10 + Math.random()*(GAME_H - ROAD_Y - h - 10) - h*0.5 - 15,
      hp: big ? 3 : 0,
      firePhase: Math.random()*Math.PI*2,
      exploding: false, explodeTimer: 0,
    });
    gnd.debrisTimer = big ? 55+Math.random()*40-progress*15 : 14+Math.random()*18-progress*6;
  }
  } // end debris spawn phase guard

  // Gauntlet-only: medium debris falls across full screen
  if(gnd.phase==="tunnel_gauntlet") {
    gnd.gauntletDebrisTimer = (gnd.gauntletDebrisTimer||0) - 1;
    if(gnd.gauntletDebrisTimer <= 0) {
      const gw = 35+Math.random()*30, gh = 28+Math.random()*25;
      const numPts = 5+Math.floor(Math.random()*3), gshape = [];
      for(let i=0;i<numPts;i++){
        const ang=(i/numPts)*Math.PI*2, r=0.32+Math.random()*0.2;
        gshape.push([Math.cos(ang)*r, Math.sin(ang)*r]);
      }
      gnd.obstacles.push({
        type:"debris", big:false,
        x: 20+Math.random()*(GAME_W-80), y:-60,
        vy: 3+Math.random()*2.5, vx:(Math.random()-0.5)*1.5,
        w:gw, h:gh, shape:gshape,
        rot:Math.random()*Math.PI, rotV:(Math.random()-0.5)*0.06,
        landed:false,
        landY: ROAD_Y+10+Math.random()*(GAME_H-ROAD_Y-gh-10)-gh*0.5,
        hp:0, firePhase:Math.random()*Math.PI*2,
        exploding:false, explodeTimer:0,
        gauntlet:true, // damages jeep on contact
      });
      gnd.gauntletDebrisTimer = 18+Math.random()*20;
    }
  }

  // Spawn craters (road hazards scrolling in from right)
  if(gnd.timer > 270 && gnd.level!==2) {
  gnd.craterTimer--;
  if(gnd.craterTimer<=0) {
    gnd.obstacles.push({
      type:"crater",
      x: GAME_W + 60 + Math.random()*100,
      y: ROAD_Y + 10 + Math.random()*(GAME_H - ROAD_Y - 30),
      w: 28+Math.random()*24, h: 14,
    });
    gnd.craterTimer = 80 + Math.random()*60 - progress*20;
  }
  } // end crater spawn timer guard

  // Scroll obstacles; handle explosions; small debris bump
  gnd.obstacles.forEach(o=>{
    if(o.type==="debris"){
      o.firePhase += 0.15;
      if(o.exploding){ o.explodeTimer++; return; }
      if(!o.landed){
        o.y+=o.vy; o.x+=o.vx; o.rot+=o.rotV;
        if(o.y>=o.landY){
          o.y=o.landY; o.landed=true; o.vx=0; o.rotV=0;
          gnd.shake = o.big ? 7 : 3;
          spawnDebrisExplosion(o.x+o.w/2, o.y+o.h/2, o.big);
          if(!o.big){ o.exploding=true; o.explodeTimer=0; } // small auto-explodes
        }
      } else {
        o.x -= gnd.speed;
      }
    } else {
      o.x -= gnd.speed;
    }
  });

  // Cull: exploded small debris after ~20 frames, offscreen
  gnd.obstacles=gnd.obstacles.filter(o=>{
    if(o.type==="debris" && o.exploding && o.explodeTimer>20) return false;
    return o.x+o.w > -40;
  });

  // Shooting — locked during title and during ED intro
  const edIntro = (gnd.phase==="ed_drop") && gnd.edSubPhase !== "done";
  if (!edIntro && (gnd.phase!=="escape" || gnd.timer > 270) && (keys[" "]||touchShooting) && player.shootCooldown<=0) {
    const bulletY = gnd.jeepY - JEEP_H/2;
    bullets.push({x: gnd.jeepX+JEEP_W, y: bulletY, vx:9, vy:0, enemy:false});
    player.shootCooldown=12; sfxShoot();
  }
  if (player.shootCooldown>0) player.shootCooldown--;

  // Move bullets + cull offscreen
  bullets = bullets.filter(b=>{ b.x+=b.vx; b.y+=b.vy; return b.x<GAME_W+20 && !b.dead; });

  // Bullet hits on big landed debris
  bullets.forEach(b=>{
    gnd.obstacles.forEach(o=>{
      if(o.type==="debris" && o.big && o.landed && !o.exploding){
        if(b.x>o.x-4 && b.x<o.x+o.w+4 && b.y>o.y-4 && b.y<o.y+o.h+4){
          b.dead=true; o.hp--;
          spawnDebrisExplosion(b.x, b.y, false);
          if(o.hp<=0){ o.exploding=true; o.explodeTimer=0; spawnDebrisExplosion(o.x+o.w/2,o.y+o.h/2,true); gnd.shake=8; }
        }
      }
    });
  });
  bullets=bullets.filter(b=>!b.dead);

  // Rear wheel dust — only when moving
  gnd.bumpY = gnd.bumpY || 0;
  gnd.bumpY *= 0.6;
  const inEDFight = gnd.phase==="ed_drop" && (gnd.edSubPhase==="done" || gnd.edSuperBlastActive);
  if(frameCount%2===0 && (gnd.speed > 0.5 || gnd.phase==="tunnel_enter" || inEDFight)) {
    const wheelBaseX = gnd.jeepX + 20;
    const wheelBaseY = gnd.jeepY - JEEP_H + (gnd.bumpY||0) + JEEP_H + 4;
    const smokeSpeed = inEDFight ? 0.5 : gnd.speed*0.25;
    particles.push({
      x: wheelBaseX+(Math.random()-0.5)*6,
      y: wheelBaseY+(Math.random()-0.5)*3,
      vx: -(1.5+Math.random()*2.0)*smokeSpeed,
      vy: -(0.12+Math.random()*0.18),
      life:0.85, decay:0.007,
      r: 12+Math.random()*16,
      color:`rgba(${145+Math.floor(Math.random()*30)},${115+Math.floor(Math.random()*20)},${70+Math.floor(Math.random()*15)},1)`,
      type:"smoke",
    });
  }
  const jeepWorldX = gnd.jeepX;
  const jeepWorldY = gnd.jeepY - JEEP_H;
  if(gnd.hitTimer>0) gnd.hitTimer--;

  if(gnd.hitTimer<=0 && gnd.phase!=="tunnel_enter" && gnd.phase!=="fade" && (gnd.phase!=="escape" || gnd.timer>270)) {
    for(const o of gnd.obstacles) {
      if(o.exploding) continue;
      const hitsX = jeepWorldX+JEEP_W-10 > o.x && jeepWorldX+16 < o.x+o.w;
      if(o.type==="debris" && !o.exploding && (o.landed || o.gauntlet)) {
        const jBot = jeepWorldY + JEEP_H;
        const jMid = jeepWorldY + JEEP_H * 0.4;
        const hitsYd = jBot > o.y && jMid < o.y + o.h;
        // Gauntlet debris: only damage if it landed near jeep position (direct hit)
        const jeepCX = jeepWorldX + JEEP_W/2;
        const jeepCY = jeepWorldY + JEEP_H/2;
        const debrisCX = o.x + o.w/2;
        const debrisCY = o.landY + o.h/2;
        const directHit = !o.gauntlet || (Math.abs(debrisCX - jeepCX) < JEEP_W*0.8 && Math.abs(debrisCY - jeepCY) < JEEP_H*1.2);
        if(hitsX && hitsYd && directHit){
          if(o.big){
            lives--; updateHUD(); gnd.shake=10; gnd.hitTimer=60;
            if(sfxEnabled) playTone(150,"sawtooth",0.3,0.4,60);
            if(lives<=0){ state="gameover"; return; }
            break;
          } else if(o.gauntlet) {
            lives--; updateHUD(); gnd.shake=8; gnd.hitTimer=60;
            o.exploding=true; o.explodeTimer=0;
            if(sfxEnabled) playTone(150,"sawtooth",0.3,0.4,60);
            if(lives<=0){ state="gameover"; return; }
            break;
          } else {
            gnd.bumpY = -4; // normal small: just bump
          }
        }
      } else if(o.type==="crater") {
        const frontX = jeepWorldX + JEEP_W - 10;
        const hitsXfront = frontX > o.x && frontX < o.x + o.w;
        const jBotC = jeepWorldY + JEEP_H;
        const jMidC = jeepWorldY + JEEP_H * 0.4;
        const hitsYc = jBotC > o.y && jMidC < o.y + o.h;
        if(hitsXfront && hitsYc) {
          lives--; updateHUD(); gnd.shake=10; gnd.hitTimer=60;
          gnd.bumpY = -12;
          if(sfxEnabled) playTone(150,"sawtooth",0.3,0.4,60);
          if(lives<=0){ state="gameover"; return; }
        }
      }
    }
  }

  // ── Tunnel gauntlet ──────────────────────────────────────────
  // Phase: escape → tunnel_approach → tunnel_gauntlet → tunnel_enter → fade

  if(progress>=1.0 && gnd.phase==="escape" && gnd.level===2) {
    gnd.phase="ed_drop";
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
    gnd.edDeathFlash = false;
    gnd.edVictory = false;
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

  // ── ED-209 drop sequence (ground2 boss intro) ──────────────────
  if(gnd.phase==="ed_drop" || gnd.phase==="ed_stand") {
    gnd.edTimer++;

    // Decelerate jeep to stop while ED falls
    if(gnd.speed > 0) gnd.speed = Math.max(0, gnd.speed - 0.15);
    gnd.scrollX += gnd.speed;

    if(gnd.edSubPhase==="falling") {
      const dist = gnd.edTargetY - gnd.edY;
      gnd.edY += dist > 2 ? Math.min(dist*0.08+2, 24) : 999;
      if(gnd.edY >= gnd.edTargetY) {
        gnd.edY = gnd.edTargetY;
        gnd.edSubPhase = "impact";
        gnd.edTimer = 0;
        gnd.edSquash = 1;
        gnd.shake = 14;
        // spawn dust/debris particles
        for(let i=0;i<28;i++){
          const a=Math.random()*Math.PI, s=4+Math.random()*10;
          particles.push({x:gnd.edX+(Math.random()-0.5)*110, y:LANE_Y+8,
            vx:Math.cos(a)*s*(Math.random()>0.5?1:-1), vy:-Math.abs(Math.sin(a)*s)-2,
            life:1, decay:0.022+Math.random()*0.025, r:4+Math.random()*9,
            color:Math.random()>0.5?"#888":"#bbb", type:"circle"});
        }
        for(let i=0;i<22;i++){
          const a=(i/22)*Math.PI*2;
          particles.push({x:gnd.edX+Math.cos(a)*65, y:LANE_Y+6,
            vx:Math.cos(a)*3, vy:-0.5-Math.random()*2,
            life:0.9, decay:0.015, r:10+Math.random()*14,
            color:"rgba(150,120,70,0.5)", type:"circle"});
        }
        if(sfxEnabled) { playTone(60,"sawtooth",0.6,0.8,30); setTimeout(()=>playTone(80,"sawtooth",0.3,0.5,40),80); }
      }
    } else if(gnd.edSubPhase==="impact") {
      gnd.edSquash = Math.max(0, gnd.edSquash - 0.05);
      if(gnd.edSquash <= 0) { gnd.edSubPhase = "crouched"; gnd.edTimer = 0; }
    } else if(gnd.edSubPhase==="crouched") {
      // pause crouched for 60 frames then stand up
      if(gnd.edTimer > 60) { gnd.edSubPhase = "standing_up"; gnd.edTimer = 0; }
    } else if(gnd.edSubPhase==="standing_up") {
      gnd.edStandAmt = Math.min(1, gnd.edStandAmt + 0.02);
      if(gnd.edStandAmt >= 1) {
        gnd.edSubPhase = "done";
        gnd.edTimer = 0;
        if(sfxEnabled) { playTone(120,"square",0.15,0.3,80); setTimeout(()=>playTone(160,"square",0.1,0.2,60),200); }
      }
    } else if(gnd.edSubPhase==="done") {
      // Init lane tracking on first frame
      if(!gnd.edLane) {
        gnd.edLane = 1;
        gnd.edMoveCount = 0;
        gnd.edSliding = false;
        gnd.edSlideY = gnd.edTargetY;
        gnd.edFacing = 1;    // 1=face left, -1=face right
        gnd.edDashing = false;
      }

      // ── Skip all normal moves during Super Blast ──
      if(gnd.edSuperBlastActive) { /* reposition/charge handled below */ }
      // ── Dash update (Move 3) ──
      else if(gnd.edDashing) {
        gnd.edDashTimer = (gnd.edDashTimer||0) + 1;
        const t = gnd.edDashTimer;

        if(t < 30) {
          // Crouch down
          gnd.edStandAmt = Math.max(0, gnd.edStandAmt - 0.06);
        } else if(t === 30) {
          // Spawn fire burst at current position
          for(let i=0;i<20;i++){
            const a=Math.random()*Math.PI*2, s=3+Math.random()*7;
            particles.push({x:gnd.edX, y:gnd.edTargetY-20,
              vx:Math.cos(a)*s, vy:Math.sin(a)*s-2,
              life:1, decay:0.03+Math.random()*0.03,
              r:5+Math.random()*8,
              color:Math.random()>0.5?"#ff6600":"#ffaa00", type:"circle"});
          }
          if(sfxEnabled) playTone(200,"sawtooth",0.3,0.5,80);
        } else if(t > 30 && t < 55) {
          // Fast dash to opposite X — lerp quickly
          const destX = gnd.edFacing === 1 ? 155 : 645;
          gnd.edX += (destX - gnd.edX) * 0.22;
          // Trail sparks during dash
          if(t % 3 === 0){
            particles.push({x:gnd.edX+(gnd.edFacing===1?40:-40), y:gnd.edTargetY-30,
              vx:gnd.edFacing*2, vy:-1,
              life:0.8, decay:0.05, r:6+Math.random()*6,
              color:"#ff8800", type:"circle"});
          }
          // Damage jeep if ED passes through its position
          if(gnd.hitTimer<=0){
            if(Math.abs(gnd.edX-(gnd.jeepX+JEEP_W/2))<80 &&
               Math.abs(gnd.edTargetY-gnd.jeepY)<20){
              lives--; updateHUD(); gnd.hitTimer=90; gnd.shake=10;
              explode(gnd.jeepX+JEEP_W/2,gnd.jeepY,"#ff6600","#ffffff",16);
              if(sfxEnabled) playTone(180,"square",0.4,0.5,60);
              if(lives<=0){ state="gameover"; }
            }
          }
        } else if(t === 55) {
          // Snap to dest, flip facing
          gnd.edX = gnd.edFacing === 1 ? 155 : 645;
          gnd.edFacing *= -1;
          // Impact burst at new position
          for(let i=0;i<16;i++){
            const a=Math.random()*Math.PI*2, s=2+Math.random()*5;
            particles.push({x:gnd.edX, y:gnd.edTargetY-10,
              vx:Math.cos(a)*s, vy:Math.sin(a)*s-1,
              life:1, decay:0.04, r:4+Math.random()*7,
              color:Math.random()>0.5?"#ff6600":"#ffdd00", type:"circle"});
          }
          gnd.shake=8;
          if(sfxEnabled) playTone(80,"sawtooth",0.4,0.5,40);
        } else if(t > 55) {
          // Stand back up
          gnd.edStandAmt = Math.min(1, gnd.edStandAmt + 0.05);
          if(gnd.edStandAmt >= 1){
            gnd.edDashing = false;
            gnd.edDashTimer = 0;
            gnd.edLobCooldown = 0;
          }
        }
        // Skip lob logic while dashing

      } else if(gnd.edSliding) {
        const ss = gnd.edSlideShoot;

        if(gnd.edSlideShootActive && ss) {
          // ── Move 4: 3-stop slide-shoot sequence ──
          // ss.stops = [L-current, L3, L-opposite]
          // ss.stop = current stop index (0,1,2)
          // ss.stopPhase = "sliding" | "waiting" | "shooting"

          if(!ss.stopPhase) ss.stopPhase = "sliding";

          const destY = ss.stops[ss.stop];

          if(ss.stopPhase === "sliding") {
            // Slide slowly toward this stop's Y
            gnd.edTargetY += (destY - gnd.edTargetY) * 0.06;
            gnd.edY = gnd.edTargetY;
            if(Math.abs(destY - gnd.edTargetY) < 1.5) {
              gnd.edTargetY = destY;
              gnd.edY = destY;
              ss.stopPhase = "shooting";
              ss.waitTimer = 0;
              // Fire rocket at this lane
              const rocketOriginY = gnd.edTargetY - 65;
              bullets.push({
                x: gnd.edX + 50, y: rocketOriginY,
                vx: 4,
                vy: destY > rocketOriginY ? 3 : destY < rocketOriginY ? -3 : 0,
                targetY: destY,
                enemy: true, rocket: true, w: 14, h: 8,
              });
              if(sfxEnabled) playTone(280,"sawtooth",0.2,0.35,80);
            }
          } else if(ss.stopPhase === "shooting") {
            // Wait T4 (60 frames) then advance to next stop
            ss.waitTimer++;
            if(ss.waitTimer >= 45) {
              ss.stop++;
              if(ss.stop >= ss.stops.length) {
                // All stops done — finish move
                gnd.edSliding = false;
                gnd.edSlideShootActive = false;
                gnd.edLobCooldown = 0;
              } else {
                ss.stopPhase = "sliding";
              }
            }
          }

        } else {
          // ── Regular slide (Move 2) ──
          const dest = gnd.edLane === 1 ? 325 : 400;
          gnd.edTargetY += (dest - gnd.edTargetY) * 0.18;
          gnd.edY = gnd.edTargetY;
          // Damage jeep if in destination lane during slide
          if(gnd.hitTimer <= 0) {
            if(Math.abs(gnd.edTargetY - gnd.jeepY) < 20 &&
               Math.abs(gnd.edX - (gnd.jeepX + JEEP_W/2)) < 120) {
              lives--; updateHUD(); gnd.hitTimer=90; gnd.shake=8;
              explode(gnd.jeepX+JEEP_W/2, gnd.jeepY, "#ffaa00","#ffffff",16);
              if(sfxEnabled) playTone(180,"square",0.4,0.5,60);
              if(lives<=0){ state="gameover"; }
            }
          }
          if(Math.abs(dest - gnd.edTargetY) < 1.5) {
            gnd.edTargetY = dest;
            gnd.edY = dest;
            gnd.edSliding = false;
            gnd.edLobCooldown = 0;
          }
        }
      } else {
        // ── Energy lob logic ──
        if(gnd.edTimer === 90 && gnd.edFacing !== -1) {
          edFireEnergyLob();
          gnd.edLobCooldown = 0;
          gnd.edMoveCount = 1;
        }
        if(gnd.edBalls && gnd.edBalls.length === 0) {
          gnd.edLobCooldown = (gnd.edLobCooldown || 0) + 1;
          if(gnd.edLobCooldown >= 100) {
            gnd.edMoveCount = (gnd.edMoveCount || 0) + 1;
            const atX1 = gnd.edFacing === -1;
            if(gnd.edMoveCount % 4 === 0) {
              // Every 4th move — dash to opposite X
              gnd.edDashing = true;
              gnd.edDashTimer = 0;
            } else if(gnd.edMoveCount % 3 === 0 || atX1) {
              // Every 3rd move — lane slide (or always if at X1)
              const prevLane = gnd.edLane;
              gnd.edLane = gnd.edLane === 1 ? 2 : 1;
              gnd.edSliding = true;
              if(sfxEnabled) playTone(400,"square",0.15,0.3,60);
              // Move 4: Slide Shoot — only when at X1 (facing right)
              if(gnd.edFacing === -1) {
                const L1_Y = 325, L2_Y = 400, L3_Y = 364;
                const currentLaneY = prevLane === 1 ? L1_Y : L2_Y;
                const oppLaneY     = prevLane === 1 ? L2_Y : L1_Y;
                gnd.edSlideShoot = {
                  stops: [currentLaneY, L3_Y, oppLaneY],
                  stop: 0,
                  stopPhase: "sliding",
                  waitTimer: 0,
                };
                gnd.edSlideShootActive = true;
              } else {
                gnd.edSlideShootActive = false;
              }
            } else {
              if(!atX1) {
                edFireEnergyLob();
                gnd.edLobCooldown = 0;
              } else {
                // At X1 — force a slide-shoot instead
                gnd.edLobCooldown = 0;
              }
            }
          }
        }
      }
    } else if(gnd.edSubPhase==="dying") {
      gnd.edDyingTimer++;
      const dt = gnd.edDyingTimer;
      // Slow-to-fast red flash: interval shrinks from 28 → 14 → 5
      const flashInterval = dt < 70 ? Math.max(14, 28 - Math.floor(dt*0.2))
                                     : Math.max(5,  14 - Math.floor((dt-70)*0.14));
      gnd.edDeathFlash = Math.floor(dt / flashInterval) % 2 === 1;
      // ED slumps while flashing
      if(dt < 80) gnd.edStandAmt = Math.max(0, gnd.edStandAmt - 0.012);
      // Small damage sparks during flash sequence
      if(dt % 22 === 0 && dt < 150) {
        explode(gnd.edX + (Math.random()-0.5)*70, gnd.edTargetY - 30 - Math.random()*110, "#ff4400","#ffaa00", 12);
        gnd.shake = 5;
        if(sfxEnabled) playTone(60+Math.random()*40,"sawtooth",0.25,0.35,90);
      }
      // Big finale at dt=150
      if(dt === 150) {
        gnd.edDeathFlash = false;
        // Central blasts
        explode(gnd.edX, gnd.edTargetY - 80, "#ffffff","#ffaa00", 60);
        explode(gnd.edX, gnd.edTargetY - 60, "#ff4400","#ffdd00", 40);
        // Scattered wing blasts
        for(let i = 0; i < 4; i++) {
          explode(gnd.edX+(Math.random()-0.5)*140, gnd.edTargetY-30-Math.random()*150, "#ff4400","#ffdd00", 28);
        }
        // Metallic debris chunks
        for(let i = 0; i < 28; i++) {
          const a = (Math.random()-0.5)*Math.PI*2;
          const sp = 4 + Math.random()*10;
          particles.push({
            x: gnd.edX+(Math.random()-0.5)*80, y: gnd.edTargetY-50-Math.random()*120,
            vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 4,
            life:1, decay:0.003+Math.random()*0.005,
            r: 8+Math.random()*20,
            color:["#444","#555","#333","#666","#888","#ff6600"][Math.floor(Math.random()*6)],
            type: Math.random()>0.4?"star":"circle"
          });
        }
        gnd.shake = 26;
        gnd.edDyingTimer = 0;
        gnd.edSubPhase = "ed_exploding";
        if(sfxEnabled) {
          playTone(40,"sawtooth",0.9,1.2,500);
          setTimeout(()=>playTone(70,"sawtooth",0.6,0.9,350),100);
          setTimeout(()=>playTone(100,"square",0.4,0.6,200),250);
        }
      }

    } else if(gnd.edSubPhase==="ed_exploding") {
      gnd.edDyingTimer++;
      const dt = gnd.edDyingTimer;
      // Lingering secondary explosions
      if(dt % 16 === 0 && dt <= 64) {
        explode(gnd.edX+(Math.random()-0.5)*100, gnd.edTargetY-40-Math.random()*120, "#ff6600","#ffdd00", 22);
        gnd.shake = 8;
        if(sfxEnabled) playTone(50+Math.random()*50,"sawtooth",0.4,0.6,150);
      }
      if(dt >= 100) {
        gnd.edDyingTimer = 0;
        gnd.edSubPhase = "ed_victory";
      }

    } else if(gnd.edSubPhase==="ed_victory") {
      gnd.edDyingTimer++;
      const dt = gnd.edDyingTimer;
      // 40-frame engine rumble, then accelerate right
      if(dt <= 40) {
        if(dt % 10 === 0) gnd.shake = 3;
      } else {
        gnd.speed = Math.min(14, (dt-40) * 0.28);
        gnd.scrollX += gnd.speed;
        gnd.jeepX   += gnd.speed;
      }
      if(gnd.jeepX > GAME_W + 20) {
        gnd.phase = "fade";
        gnd.tunnelTimer = 0;
        gnd.edVictory = true;
        gnd.speed = 0;
      }

    } else if(gnd.edSubPhase==="dead") {
      // fallback dead state
    } // end edSubPhase blocks

    // ── Update energy balls ──
    if(!gnd.edBalls) gnd.edBalls = [];
    gnd.edBalls = gnd.edBalls.filter(b => {
      b.x  += b.vx;
      b.vy += b.gravity;
      b.y  += b.vy;
      b.age++;

      // Smoke trail during flight
      if(b.isRocket && !b.landed && frameCount % 2 === 0) {
        const angle = Math.atan2(b.vy, b.vx);
        const exhaustX = b.x - Math.cos(angle) * 14;
        const exhaustY = b.y - Math.sin(angle) * 14;
        particles.push({
          x: exhaustX, y: exhaustY,
          vx: (Math.random()-0.5)*1.5, vy: -0.5+Math.random()*0.5,
          life: 0.8, decay: 0.03+Math.random()*0.02,
          r: 5+Math.random()*6,
          color:`rgba(200,200,200,0.7)`,
          type:"circle", rocketTargetY: b.landY,
        });
      }

      // Landed — snap to exact position when travel time is up
      if(!b.landed && b.age >= b.travelFrames) {
        b.x = b.landX;
        b.y = b.landY;
        b.landed = true;
        b.landTimer = 0;
        gnd.shake = 8;
        // Explosion on landing
        explode(b.x, b.y, "#ff6600", "#ffdd00", 20);
        for(let i=0;i<8;i++){
          const a=Math.random()*Math.PI*2, s=3+Math.random()*6;
          particles.push({x:b.x, y:b.y,
            vx:Math.cos(a)*s, vy:Math.sin(a)*s*0.4-2,
            life:1, decay:0.025+Math.random()*0.02,
            r:8+Math.random()*10,
            color:`rgba(255,${80+Math.floor(Math.random()*80)},0,0.8)`,
            type:"circle"});
        }
        if(sfxEnabled) { playTone(120,"sawtooth",0.4,0.6,120); setTimeout(()=>playTone(80,"sawtooth",0.3,0.5,80),60); }
      }

      if(b.landed) {
        b.landTimer++;
        b.alpha = Math.max(0, 1 - b.landTimer/18);
        // Damage jeep only on the exact landing frame, same lane
        if(gnd.hitTimer<=0 && b.landTimer === 1) {
          const jeepCX = gnd.jeepX + JEEP_W/2;
          const jeepCY = gnd.jeepY;
          if(Math.abs(b.x - jeepCX) < JEEP_W*0.7 &&
             Math.abs(b.landY - jeepCY) < 18) {
            lives--; updateHUD(); gnd.hitTimer=90; gnd.shake=8;
            explode(jeepCX, jeepCY, "#ff6600","#ffffff",16);
            if(sfxEnabled) playTone(180,"square",0.4,0.5,60);
            if(lives<=0){ state="gameover"; }
          }
        }
        return b.alpha > 0;
      }
      return true;
    });

    // ── Enemy bullets (slide-shoot rockets) ──
    bullets = bullets.filter(b => {
      if(!b.enemy) return true;
      b.x += b.vx;
      // Vertical travel until targetY reached
      if(b.targetY !== undefined && b.vy !== 0) {
        b.y += b.vy;
        if((b.vy > 0 && b.y >= b.targetY) || (b.vy < 0 && b.y <= b.targetY)) {
          b.y = b.targetY;
          b.vy = 0;
        }
      }
      // Smoke trail
      if(frameCount % 2 === 0) {
        particles.push({
          x: b.x - 8, y: b.y + (Math.random()-0.5)*4,
          vx: -0.5 - Math.random(), vy: (Math.random()-0.5)*0.5,
          life: 0.7, decay: 0.04 + Math.random()*0.03,
          r: 4 + Math.random()*5,
          color: `rgba(${160+Math.floor(Math.random()*40)},${160+Math.floor(Math.random()*40)},160,0.5)`,
          type: "circle",
          rocketTargetY: b.targetY, // for draw order
        });
      }
      if(b.x > GAME_W + 20) return false;
      // Hit jeep
      if(gnd.hitTimer <= 0) {
        const rocketLaneY = b.targetY !== undefined ? b.targetY : b.y;
        if(b.x < gnd.jeepX + JEEP_W && b.x > gnd.jeepX - 10 &&
           Math.abs(rocketLaneY - gnd.jeepY) < 18) {
          lives--; updateHUD(); gnd.hitTimer=90; gnd.shake=6;
          explode(b.x, b.y, "#ff4400","#ffffff",10);
          if(sfxEnabled) playTone(180,"square",0.3,0.4,50);
          if(lives<=0){ state="gameover"; }
          return false;
        }
      }
      return true;
    });

    // ── ED body contact damage (any active state except intro anims) ──
    const edFightActive = gnd.edSubPhase === "done" || gnd.edSuperBlastActive;
    if(edFightActive && gnd.hitTimer <= 0) {
      const jeepCX = gnd.jeepX + JEEP_W/2;
      const yOverlap = Math.abs(gnd.edTargetY - gnd.jeepY) < 20;
      if(yOverlap && Math.abs(gnd.edX - jeepCX) < 90) {
        lives--; updateHUD(); gnd.hitTimer = 90; gnd.shake = 10;
        explode(jeepCX, gnd.jeepY, "#ff6600", "#ffffff", 16);
        if(sfxEnabled) playTone(180,"square",0.4,0.5,60);
        if(lives <= 0) { state = "gameover"; }
      }
    }

    // ── Bullet hits on ED — only during active fight ──
    if(gnd.edSubPhase === "done" && !gnd.edSuperBlastActive) {
      const edLeft  = gnd.edX - 80;
      const edRight = gnd.edX + 60;
      const edTop   = gnd.edTargetY - 180;
      const edBot   = gnd.edTargetY;
      bullets = bullets.filter(b => {
        if(!b.enemy && b.x > edLeft && b.x < edRight && b.y > edTop && b.y < edBot) {
          gnd.edHp--;
          gnd.edHitFlash = 12;
          gnd.shake = 4;
          explode(b.x, b.y, "#ffdd00", "#ffffff", 8);
          if(sfxEnabled) playTone(440,"square",0.15,0.2,40);
          if(gnd.edHp <= 0) {
            gnd.edHp = 0;
            if(gnd.edPhase === 1) {
              // Phase 1 depleted — trigger Super Blast transition
              gnd.edSuperBlastActive = true;
              gnd.edSuperBlastPhase = "reposition";
              gnd.edSuperBlastTimer = 0;
              gnd.edDashing = false;
              gnd.edSliding = false;
              gnd.edSlideShootActive = false;
              gnd.edBalls = [];
              bullets = bullets.filter(b => !b.enemy);
            } else {
              // Phase 2 depleted — death
              gnd.edSubPhase = "dying";
              gnd.edDyingTimer = 0;
              gnd.shake = 16;
              if(sfxEnabled) playTone(80,"sawtooth",0.5,0.8,120);
            }
          }
          return false;
        }
        return true;
      });
    }
    if(gnd.edHitFlash > 0) gnd.edHitFlash--;

    // ── Move 5: Super Blast update ──
    if(gnd.edSuperBlastActive) {
      gnd.edSuperBlastTimer++;
      const sbt = gnd.edSuperBlastTimer;
      const L3_Y = 364;
      const X2   = 645;

      if(gnd.edSuperBlastPhase === "reposition") {
        // Slide Y to L3, lerp X to X2 simultaneously
        gnd.edTargetY += (L3_Y - gnd.edTargetY) * 0.08;
        gnd.edY = gnd.edTargetY;
        gnd.edX += (X2 - gnd.edX) * 0.06;
        // Flip facing once we're past centre
        if(gnd.edX > 400) gnd.edFacing = 1;
        const atDest = Math.abs(gnd.edTargetY - L3_Y) < 2 && Math.abs(gnd.edX - X2) < 3;
        if(atDest) {
          gnd.edTargetY = L3_Y;
          gnd.edY = L3_Y;
          gnd.edX = X2;
          gnd.edFacing = 1;
          gnd.edSuperBlastPhase = "crouch";
          gnd.edSuperBlastTimer = 0;
          if(sfxEnabled) playTone(60,"sawtooth",0.15,0.4,40);
        }

      } else if(gnd.edSuperBlastPhase === "crouch") {
        gnd.edStandAmt = Math.max(0, gnd.edStandAmt - 0.06);
        if(gnd.edStandAmt <= 0) {
          gnd.edSuperBlastPhase = "charge";
          gnd.edSuperBlastTimer = 0;
        }

      } else if(gnd.edSuperBlastPhase === "charge") {
        const chargeT = sbt / 180;
        // Cannon muzzle position (world space) — facing left so cannon points left
        const torsoLift = gnd.edStandAmt * 48;
        const muzzleX = gnd.edX + gnd.edFacing * (-(8 + Math.min(1, (sbt-80)/40) * 44));
        const muzzleY = gnd.edTargetY - torsoLift - 75;

        // Muzzle sparks during charge phase (80f+)
        if(sbt > 80 && sbt % 4 === 0) {
          const ct = Math.min(1, (sbt - 80) / 100);
          for(let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 3;
            particles.push({
              x: muzzleX, y: muzzleY,
              vx: Math.cos(a) * s, vy: Math.sin(a) * s,
              life: 0.7, decay: 0.05 + Math.random() * 0.04,
              r: 2 + ct * 4,
              color: Math.random() > 0.5 ? `rgba(180,220,255,0.9)` : `rgba(255,255,255,0.9)`,
              type: "circle",
            });
          }
        }
        // Screen flash on final frames — blue-white
        if(sbt >= 165) {
          const flashA = ((sbt - 165) / 15) * 0.3;
          ctx.save();
          ctx.fillStyle = `rgba(180,220,255,${flashA})`;
          ctx.fillRect(0, 0, GAME_W, GAME_H);
          ctx.restore();
        }
        if(sfxEnabled && sbt % 15 === 0) {
          playTone(120 + chargeT * 200, "square", 0.05 + chargeT * 0.1, 0.15, 80);
        }

        if(sbt >= 180) {
          // Fire the super ball — use same muzzle X as drawEDCannonCharge glow
          const fireMuzzleX = gnd.edX + gnd.edFacing * -(33 + 44 + 4);
          gnd.edSuperBall = {
            x: fireMuzzleX,
            y: L3_Y - 72,
            r: 40,
            vx: -0.75, // Speed Of The Super Ball
            alpha: 1,
            hp: 30,
            hitFlash: 0,
          };
          gnd.edSuperBlastPhase = "fired";
          gnd.edSuperBlastTimer = 0;
          gnd.edSuperBlastActive = false;
          // Start phase 2
          gnd.edPhase = 2;
          gnd.edHp = 25;
          gnd.edMaxHp = 25;
          // Reset move state so normal rotation resumes
          gnd.edLobCooldown = 0;
          gnd.edMoveCount = (gnd.edMoveCount || 0) + 1;
          if(sfxEnabled) {
            playTone(40,"sawtooth",0.6,0.8,200);
            setTimeout(()=>playTone(60,"sawtooth",0.4,0.6,300),100);
          }
        }
      }
    }

    // ── Super ball flight update ──
    if(gnd.edSuperBall) {
      gnd.edStandAmt = Math.min(1, gnd.edStandAmt + 0.05);
      const sb = gnd.edSuperBall;
      sb.x += sb.vx;
      // Damage jeep — only if jeep is on same lane as ball (within 20px of ball's ground row)
      if(gnd.hitTimer <= 0) {
        const jeepCX = gnd.jeepX + JEEP_W/2;
        const glowBase = sb.y + sb.r * 1.8; // base of ball = L3_Y
        const xHit = Math.abs(sb.x - jeepCX) < sb.r * 1.8 * 0.6 + JEEP_W/2;
        const yHit = Math.abs(gnd.jeepY - glowBase) < 20; // same lane only
        if(xHit && yHit) {
          lives--; updateHUD(); gnd.hitTimer = 90; gnd.shake = 14;
          explode(jeepCX, gnd.jeepY, "#ff6600", "#ffffff", 20);
          if(sfxEnabled) playTone(180,"square",0.4,0.5,60);
          if(lives <= 0) { state = "gameover"; }
        }
      }
      // Tick hit flash
      if(sb.hitFlash > 0) sb.hitFlash--;
      // Player bullets hit the ball core (sb.r, not glow)
      for(let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if(b.enemy) continue;
        const dx = b.x - sb.x, dy = b.y - sb.y;
        if(dx*dx + dy*dy < sb.r*sb.r) {
          bullets.splice(i, 1);
          sb.hp--;
          sb.hitFlash = 8;
          if(sb.hp <= 0) {
            // Big blue-white explosion
            explode(sb.x, sb.y, "#88ccff", "#ffffff", 40);
            explode(sb.x, sb.y, "#4488ff", "#cceeff", 30);
            gnd.shake = 12;
            if(sfxEnabled) {
              playTone(120,"sawtooth",0.5,0.6,200);
              setTimeout(()=>playTone(80,"sawtooth",0.4,0.5,300),80);
              setTimeout(()=>playTone(200,"square",0.3,0.4,150),160);
            }
            gnd.edSuperBall = null;
            break;
          }
        }
      }
      // Off screen — remove
      if(gnd.edSuperBall && sb.x + sb.r < 0) gnd.edSuperBall = null;
    }

    // Set hook so rockets + smoke behind jeep draw inside drawGroundScene before jeep
    const edBehindJeep = gnd.edTargetY < gnd.jeepY;
    const edVisible = gnd.edSubPhase !== "ed_exploding" && gnd.edSubPhase !== "ed_victory";
    gnd.rocketDrawHook = () => {
      // Lob rockets behind jeep
      gnd.edBalls.filter(b => !b.landed && b.landY < gnd.jeepY).forEach(b => drawEdEnergyBall(b));
      // Slide-shoot rockets behind jeep
      bullets.filter(b => b.enemy && (b.targetY||b.y) < gnd.jeepY).forEach(b => drawBullet(b));
      // Smoke behind jeep
      particles.filter(p => p.rocketTargetY !== undefined && p.rocketTargetY < gnd.jeepY).forEach(drawParticle);
      // ED behind jeep when he's above jeep Y
      if(edBehindJeep && edVisible) {
        drawED209Ground(gnd.edX, gnd.edY, gnd.edSquash, gnd.edStandAmt, gnd.edHitFlash||0);
        if(gnd.edSuperBlastActive && gnd.edSuperBlastPhase === "charge") {
          drawEDCannonCharge(gnd.edX, gnd.edTargetY, gnd.edFacing, gnd.edStandAmt, gnd.edSuperBlastTimer);
        }
      }
    };

    drawGroundScene();
    gnd.rocketDrawHook = null;

    // Lob rockets + smoke at or below jeep row (in front)
    gnd.edBalls.filter(b => !b.landed && b.landY >= gnd.jeepY).forEach(b => drawEdEnergyBall(b));
    // Slide-shoot rockets + smoke at or below jeep row
    bullets.filter(b => b.enemy && (b.targetY||b.y) >= gnd.jeepY).forEach(b => drawBullet(b));
    particles.filter(p => p.rocketTargetY !== undefined && p.rocketTargetY >= gnd.jeepY).forEach(drawParticle);
    // Player bullets
    bullets.filter(b => !b.enemy).forEach(b => drawBullet(b));
    // Super ball draw — extracted for depth sorting with ED
    const drawSuperBall = () => {
      if(!gnd.edSuperBall) return;
      const sb = gnd.edSuperBall;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // Outer glow
      const og = ctx.createRadialGradient(sb.x, sb.y, sb.r*0.2, sb.x, sb.y, sb.r*1.8);
      og.addColorStop(0, "rgba(200,230,255,0.5)");
      og.addColorStop(1, "rgba(60,100,255,0)");
      ctx.fillStyle = og;
      ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r*1.8, 0, Math.PI*2); ctx.fill();
      // Core
      const cg = ctx.createRadialGradient(sb.x-sb.r*0.3, sb.y-sb.r*0.3, 2, sb.x, sb.y, sb.r);
      cg.addColorStop(0, "rgba(255,255,255,1)");
      cg.addColorStop(0.4, "rgba(180,220,255,0.9)");
      cg.addColorStop(1, "rgba(80,140,255,0.6)");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI*2); ctx.fill();
      // Electric swirls
      const t = frameCount * 0.07;
      const numArcs = 5;
      for(let i = 0; i < numArcs; i++) {
        const baseAngle = t + (i / numArcs) * Math.PI * 2;
        const orbitR = sb.r * (1.1 + 0.25 * Math.sin(t * 1.7 + i * 1.3));
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(180,220,255,${0.6 + 0.4*Math.sin(t*2+i)})`
          : `rgba(255,255,255,${0.5 + 0.4*Math.cos(t*2.5+i)})`;
        ctx.lineWidth = 1.5 + Math.sin(t * 3 + i) * 0.8;
        ctx.shadowColor = "#88ccff";
        ctx.shadowBlur = 8;
        // Draw jagged arc segment rotating around the ball
        const segLen = Math.PI * 0.55;
        const steps = 10;
        for(let s = 0; s <= steps; s++) {
          const a = baseAngle + (s / steps) * segLen;
          const jitter = (s > 0 && s < steps) ? (Math.sin(s * 4.1 + t * 5 + i * 2.7) * sb.r * 0.18) : 0;
          const r = orbitR + jitter;
          const px = sb.x + Math.cos(a) * r;
          const py = sb.y + Math.sin(a) * r;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Hit flash — red tint over the core
      if(sb.hitFlash > 0) {
        ctx.save();
        ctx.globalAlpha = sb.hitFlash / 8 * 0.6;
        ctx.fillStyle = "#ff4444";
        ctx.beginPath(); ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };
    // ED above ball (higher on screen) → ball drawn in front of ED; otherwise ball behind ED
    const edAboveBall = gnd.edSuperBall && !edBehindJeep && edVisible && gnd.edTargetY < L3_Y;
    if(!edAboveBall) drawSuperBall();
    // Draw ED-209 (only if in front of jeep — behind case handled in rocketDrawHook)
    if(!edBehindJeep && edVisible) {
      drawED209Ground(gnd.edX, gnd.edY, gnd.edSquash, gnd.edStandAmt, gnd.edHitFlash||0);
    }
    // Cannon charge overlay during super blast charge phase
    if(!edBehindJeep && edVisible && gnd.edSuperBlastActive && gnd.edSuperBlastPhase === "charge") {
      drawEDCannonCharge(gnd.edX, gnd.edTargetY, gnd.edFacing, gnd.edStandAmt, gnd.edSuperBlastTimer);
    }
    if(edAboveBall) drawSuperBall();
    // HP bar above ED
    if(gnd.edSubPhase !== "falling" && gnd.edHp > 0) {
      const barW = 120, barH = 10;
      const barX = gnd.edX - barW/2, barY = gnd.edTargetY - 210;
      ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(barX-2,barY-2,barW+4,barH+4);
      ctx.fillStyle="#333"; ctx.fillRect(barX,barY,barW,barH);
      const hpFrac = Math.max(0, gnd.edHp/gnd.edMaxHp);
      const hpCol = hpFrac>0.5?"#44ff44":hpFrac>0.25?"#ffaa00":"#ff2222";
      ctx.fillStyle=hpCol; ctx.fillRect(barX,barY,barW*hpFrac,barH);
      // Phase 2 pip markers — show 2 empty slots when on bar 2
      if(gnd.edPhase === 2) {
        ctx.fillStyle="rgba(255,255,255,0.15)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle=hpCol; ctx.fillRect(barX,barY,barW*hpFrac,barH);
      }
      ctx.strokeStyle="rgba(255,255,255,0.3)"; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,barH);
    }
    particles=particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life-=p.decay; return p.life>0; });
    // Draw non-rocket-smoke particles normally; rocket smoke is drawn in order above
    particles.filter(p => p.rocketTargetY === undefined).forEach(drawParticle);
    drawHUD();

    return;
  }

  if(progress>=1.0 && gnd.phase==="escape" && gnd.level!==2) {
    gnd.phase="tunnel_approach";
    gnd.tunnelTimer=0;
    gnd.tunnelReveal=0;
    const jeepBaseY = GAME_H - JEEP_H - 4;
    gnd.blockages = [];
    for(let i=0;i<16;i++){
      let bw = 45+Math.random()*80;
      let bh = 30+Math.random()*60;
      let by2 = (ROAD_Y - 20) + Math.random()*(jeepBaseY - bh - (ROAD_Y - 20));
      let n = 6+Math.floor(Math.random()*3), pts = [];
      for(let j=0;j<n;j++){ let ang=(j/n)*Math.PI*2, r=0.32+Math.random()*0.2; pts.push([Math.cos(ang)*r,Math.sin(ang)*r]); }
      gnd.blockages.push({ y:by2, bh, bw, xOffset:Math.random()*50, hp:2+Math.floor(Math.random()*2), shape:pts, firePhase:Math.random()*Math.PI*2 });
    }
  }

  if(gnd.phase==="tunnel_approach") {
    gnd.tunnelTimer++;
    gnd.speed = Math.max(0, gnd.speed - 0.08); // decelerate to stop
    gnd.tunnelReveal = Math.min(1, gnd.tunnelTimer / 50);
    if(gnd.speed <= 0) {
      gnd.speed = 0;
      gnd.phase = "tunnel_gauntlet";
      gnd.tunnelTimer = 0;
    }
  }

  // Hard stop all scrolling during gauntlet
  if(gnd.phase==="tunnel_gauntlet") gnd.speed = 0;

  const TUNNEL_W = 70;
  const tunnelFaceX = GAME_W - TUNNEL_W;

  if(gnd.phase==="tunnel_gauntlet") {
    if(gnd.blockages) gnd.blockages.forEach(b=>{ b.firePhase+=0.12; });

    bullets.forEach(b=>{
      if(!gnd.blockages) return;
      gnd.blockages.forEach((blk, i)=>{
        if(blk.hp<=0) return;
        const bw = blk.bw;
        const bh = blk.bh;
        const bx = GAME_W - bw - (blk.xOffset||0) - 30;
        const by = blk.y + (blk.bh - bh) * 0.5;
        if(b.x>bx-4 && b.x<bx+bw+4 && b.y>by && b.y<by+bh){
          b.dead=true; blk.hp--;
          spawnDebrisExplosion(b.x, b.y, false);
          if(blk.hp<=0){ spawnDebrisExplosion(bx+bw/2, by+bh/2, true); gnd.shake=6; }
        }
      });
    });
    bullets=bullets.filter(b=>!b.dead);

    const allClear = gnd.blockages && gnd.blockages.every(b=>b.hp<=0);
    if(allClear) { gnd.phase="tunnel_enter"; gnd.tunnelTimer=0; }
  }

  if(gnd.phase==="tunnel_enter") {
    gnd.tunnelTimer++;
    if(gnd.tunnelTimer < 60) {
      // 1 second delay — jeep sits still
      if(gnd.tunnelTimer % 8 === 0) gnd.shake = 5;
    } else {
      gnd.speed = Math.min(14, (gnd.tunnelTimer - 60) * 0.25);
      gnd.jeepX += gnd.speed;
    }
    if(gnd.jeepX > GAME_W + 20) { gnd.phase="fade"; gnd.tunnelTimer=0; gnd.speed=0; }
  }

  if(gnd.phase==="fade") {
    gnd.tunnelTimer++;
    if(gnd.tunnelTimer>=40) {
      if(state==="ground" && gnd.edVictory) {
        // TODO: ED defeated — hook up to next level/victory screen
        state = "mainmenu";
      } else if(state==="ground") {
        startGroundEscape2();
      } else {
        player.x=80; player.y=200;
        spawnWave(waveNum); updateHUD();
        state="playing";
      }
      return;
    }
  }

  drawGroundScene();
  bullets.forEach(drawBullet);
  particles=particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life-=p.decay; return p.life>0; });
  particles.forEach(drawParticle);
  drawHUD();
  particles = particles.filter(p => p.life > 0);

  // Fade to black for tunnel
  if(gnd.phase==="fade") {
    ctx.fillStyle=`rgba(0,0,0,${Math.min(gnd.tunnelTimer/40,1)})`;
    ctx.fillRect(0,0,GAME_W,GAME_H);
  }

  // Progress bar — escape phases only, hidden during opening title
  if(gnd.timer > 270 && (gnd.phase==="escape" || gnd.phase==="tunnel_approach")) {
    ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(10,GAME_H-22,GAME_W-20,10);
    ctx.fillStyle="#f5c842"; ctx.fillRect(10,GAME_H-22,(GAME_W-20)*progress,10);
    ctx.fillStyle="#fff"; ctx.font="10px Boogaloo,cursive"; ctx.textAlign="right";
    ctx.fillText("AIRFIELD ▶",GAME_W-12,GAME_H-24);
    ctx.textAlign="left";
  }

  // Lives drawn by drawHUD

  // Opening title — only on ground escape 1
  if(state==="ground" && gnd.phase==="escape") {
  const TITLE_DUR = 270; // 4.5 seconds
  if(t < TITLE_DUR) {
    const a = Math.min(t/20, 1) * Math.min((TITLE_DUR-t)/20, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = "center";
    // Red glow shadow
    ctx.shadowColor = "#ff2200";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ff3300";
    ctx.font = "bold 38px Rancho,cursive";
    ctx.fillText("ESCAPE THE CITY", GAME_W/2, GAME_H/2 - 20);
    ctx.shadowBlur = 0;
    // Subtitle lines
    ctx.fillStyle = "rgba(255,200,150,0.85)";
    ctx.font = "15px Boogaloo,cursive";
    ctx.fillText("Destroy The Boulders", GAME_W/2, GAME_H/2 + 18);
    ctx.fillText("Avoid The Craters", GAME_W/2, GAME_H/2 + 38);
    ctx.fillText("Survive Destruction", GAME_W/2, GAME_H/2 + 58);
    ctx.restore();
  }
  } // end ground state title guard
}

// ── ED-209 cannon charge overlay ─────────────────────────────────
