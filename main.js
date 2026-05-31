// ─── main.js — game loop, update, menu ────────────────────────

function resizeCanvas() {
  const W = window.innerWidth, H = window.innerHeight;
  const scale = Math.min(W / GAME_W, H / GAME_H);
  const cw = GAME_W * scale, ch = GAME_H * scale;
  canvas.style.width  = cw + "px";
  canvas.style.height = ch + "px";
  const wrap = document.getElementById("canvasWrap");
  wrap.style.width = cw + "px"; wrap.style.height = ch + "px";
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => {
  setTimeout(resizeCanvas, 100); setTimeout(resizeCanvas, 400);
});

// ─── Enemy spawning ───────────────────────────────────────────
function spawnWave(num) {
  enemies=[]; enemyVDir=1; enemyDir=-1;
  let idx=0;
  const spacingX=100, startX=280;
  if (num===1) {
    for (let r=0;r<2;r++) for (let c=0;c<5;c++)
      enemies.push(makeEnemy(startX+c*spacingX, 80+r*70, "basic", idx++));
  } else if (num===2) {
    for (let r=0;r<2;r++) for (let c=0;c<5;c++)
      enemies.push(makeEnemy(startX+c*spacingX, 80+r*70, "mid", idx++));
  } else if (num===3) {
    for (let r=0;r<2;r++) for (let c=0;c<4;c++)
      enemies.push(makeEnemy(startX+c*spacingX+50, 80+r*80, "boss", idx++));
  } else if (num===4) {
    spawnLaserCannon();
  } else if (num===5) {
    enemies.push(makeEnemy(GAME_W - 210, GAME_H/2-60, "megaboss", idx++));
  }
}

function makeEnemy(x, y, type, idx) {
  const hpMap = { basic:1, mid:2, boss:3, megaboss:25 };
  const hp = hpMap[type]||1;
  const e = {
    x, y,
    w: type==="megaboss"?140:46,
    h: type==="megaboss"?120:30,
    type, hp, maxHp:hp,
    shootTimer:60+Math.random()*80,
    bobOffset:Math.random()*Math.PI*2,
    dead:false, idx, wingAngle:0,
  };
  if (type==="megaboss") {
    e.phase = 2; e.phaseTimer = 60;
    e.cockpitOpen = false; e.cockpitTimer = 0;
    e.targetY = GAME_H/2; e.vx = 0; e.vy = 0;
  }
  return e;
}

// ─── Game start ───────────────────────────────────────────────
function startGame() {
  score=0; lives=5; waveNum=1; enemyDir=-1; enemySpeed=1; enemyVDir=1; bossDyingTimer=0;
  player.speed = PLAYER_BASE_SPEED; playerSpeedBoosted = false;
  cannon.active=false; cannon.dead=false; cannon.laser=null; mecha.active=false; mecha.dead=false;
  tunnel.walls=[]; tunnel.wallsSpawned=0; tunnel.playerHitTimer=0;
  bullets=[]; enemyBullets=[]; particles=[];
  player.x=-120; player.y=200; player.invincible=0; player.shootCooldown=0;
  initClouds();
  startIntroCinematic();
}

function startGameActual() {
  player.x=80; player.y=200;
  startGroundEscape();
}

// ─── Main loop ────────────────────────────────────────────────
const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;
let lastFrameTime = 0;
let accumulator = 0;

function loop(timestamp) {
  animFrame = requestAnimationFrame(loop);

  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Clamp delta to avoid spiral of death after tab switch
  accumulator += Math.min(delta, 50);

  // Only update+draw when a full frame's worth of time has accumulated
  if (accumulator < FRAME_MS) return;
  accumulator -= FRAME_MS;

  if (!paused) frameCount++;
  ctx.clearRect(0,0,GAME_W,GAME_H);
  if (isMobile) updateTouchVisibility();

  if (state==="start")    { drawBG(); drawStartScreen(); return; }
  if (state==="gameover") { drawBG(); drawOverlay("GAME OVER","Tap or press any key to retry"); return; }
  if (state==="win")      { drawBG(); drawOverlay("🏆 YOU WIN!","Tap or press any key to play again"); spawnConfetti(); return; }

  if (paused) {
    drawBG();
    particles.forEach(drawParticle);
    enemies.filter(e=>!e.dead).forEach(drawEnemy);
    if (waveNum===4) { drawAbsorbers(); drawLaserCannon(); drawEnergyBalls(); }
    bullets.forEach(drawBullet);
    enemyBullets.forEach(drawBullet);
    drawPlane(player.x,player.y,player.w,player.h,player.invincible,player.propAngle);
    drawHUD();
    drawPauseMenu();
    return;
  }

  if (state==="tunnelready")  { updateTunnelReady(); return; }
  if (state==="tunnel")       { updateTunnel(); return; }
  if (state==="shipenter")    { updateShipEnter(); return; }
  if (state==="shipboss")     { updateShipBoss(); return; }
  if (state==="escaping")     { updateEscaping(); return; }
  if (state==="wave4intro")   { updateWave4Intro(); return; }
  if (state==="wave5intro")   { updateWave5Intro(); return; }
  if (state==="headdetach")   { updateHeadDetach(); return; }
  if (state==="cinematic")    { updateCinematic(); return; }
  if (state==="ground")       { updateGroundEscape(); return; }
  if (state==="ground2")      { updateGroundEscape(); return; }

  drawBG();
  if (state==="playing")   update();
  if (state==="bossdying") updateBossDying();

  particles.forEach(drawParticle);
  enemies.filter(e=>!e.dead).forEach(drawEnemy);
  if (waveNum===4) { updateAbsorbers(); drawAbsorbers(); drawLaserCannon(); drawEnergyBalls(); }
  if (waveNum===5 && mecha.active) { updateMecha(); drawMecha(mecha.x, mecha.y, 0, mecha.hp/mecha.maxHp); }
  bullets.forEach(drawBullet);
  enemyBullets.forEach(drawBullet);
  drawPlane(player.x,player.y,player.w,player.h,player.invincible,player.propAngle);

  for (let i=0;i<2;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*8,
    vx:-1.5-Math.random()*2, vy:(Math.random()-0.5)*0.8,
    life:0.7, decay:0.06, r:3+Math.random()*3,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });

  const vig=ctx.createRadialGradient(400,220,180,400,220,500);
  vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.4)");
  ctx.fillStyle=vig; ctx.fillRect(0,0,GAME_W,GAME_H);

  if (frameCount%3===0) for (let i=0;i<200;i++) {
    ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.04})`;
    ctx.fillRect(Math.random()*GAME_W,Math.random()*GAME_H,1,1);
  }
  drawHUD();
}

// ─── Update (playing state) ───────────────────────────────────
function update() {
  clouds.forEach(c=>{ c.x-=c.speed; if(c.x+c.w<-100) c.x=GAME_W+50; });

  const spd = player.speed;
  if ((keys["ArrowUp"]||keys["w"]||keys["W"]||joy.dy<-0.2) && player.y>10)
    player.y += Math.min(joy.dy*spd, -spd*(joy.active?Math.abs(joy.dy):1));
  if ((keys["ArrowDown"]||keys["s"]||keys["S"]||joy.dy>0.2) && player.y+player.h<GAME_H-10)
    player.y += Math.max(joy.dy*spd, spd*(joy.active?Math.abs(joy.dy):1));
  const leftBound = waveNum === 4 ? 70 : 10;
  if ((keys["ArrowLeft"]||keys["a"]||keys["A"]||joy.dx<-0.2) && player.x>leftBound)
    player.x -= spd*0.7*(joy.active?Math.abs(joy.dx):1);
  if ((keys["ArrowRight"]||keys["d"]||keys["D"]||joy.dx>0.2) && player.x+player.w<GAME_W*0.45)
    player.x += spd*0.7*(joy.active?Math.abs(joy.dx):1);

  const wantShoot = keys[" "]||touchShooting;
  if (wantShoot && player.shootCooldown<=0) {
    bullets.push({x:player.x+player.w,y:player.y+player.h/2,vx:9,vy:0,enemy:false});
    player.shootCooldown=12; sfxShoot();
  }
  if (player.shootCooldown>0) player.shootCooldown--;
  if (player.invincible>0) player.invincible--;
  player.propAngle+=0.35;

  const alive=enemies.filter(e=>!e.dead);
  if (alive.length===0 && !cannon.active && waveNum!==5) {
    waveNum++;
    if (waveNum>5) { state="win"; sfxWin(); return; }
    enemySpeed=1+(waveNum-1)*0.3; sfxWaveClear();
    if (waveNum===4) { startShipBoss(); return; }
    spawnWave(waveNum); enemyBullets=[]; return;
  }

  if (waveNum===4) updateLaserCannon();

  const isMegabossWave = alive.length===1 && alive[0].type==="megaboss";
  if (isMegabossWave) {
    const mb=alive[0];
    const dy = mb.targetY - (mb.y + mb.h/2);
    mb.vy += dy * 0.02; mb.vy *= 0.85; mb.y += mb.vy;
    mb.y = Math.max(30, Math.min(GAME_H - mb.h - 30, mb.y));
    const hpRatio = mb.hp / mb.maxHp;
    const baseX = GAME_W - mb.w - 80;
    mb.x += (baseX - mb.x) * 0.02;
    if (mb.shieldState === undefined) {
      mb.shieldState = "up"; mb.shieldAmt = 1;
      mb.shieldTimer = 180 + Math.random()*60; mb.electricBall = null;
    }
    if (mb.shieldState === "up") {
      mb.shieldAmt = Math.min(1, mb.shieldAmt + 0.04);
      mb.shieldTimer--;
      mb.targetY = GAME_H/2 - mb.h/2 + Math.sin(frameCount*0.02)*80;
      if (mb.shieldTimer <= 0) { mb.shieldState = "dropping"; mb.shieldTimer = 50; }
    } else if (mb.shieldState === "dropping") {
      mb.shieldAmt = Math.max(0, mb.shieldAmt - 0.03);
      mb.shieldTimer--;
      if (mb.shieldTimer <= 0) {
        mb.shieldState = "firing"; mb.shieldTimer = 100;
        mb.cockpitOpen = true; mb.cockpitTimer = 100;
        const ex = mb.x + mb.w*0.1, ey = mb.y + mb.h/2;
        const dx = player.x + player.w/2 - ex, dy = player.y + player.h/2 - ey;
        const dist = Math.sqrt(dx*dx+dy*dy)||1;
        mb.electricBall = { x:ex, y:ey, vx:(dx/dist)*3.5, vy:(dy/dist)*3.5, alpha:1, arcTimer:0, r:28 };
        if(sfxEnabled) { playTone(80,"sawtooth",0.3,0.5,200); setTimeout(()=>playTone(120,"square",0.2,0.4,150),200); }
      }
    } else if (mb.shieldState === "firing") {
      mb.shieldAmt = 0; mb.shieldTimer--;
      if (mb.shieldTimer <= 0) { mb.shieldState = "recharging"; mb.shieldTimer = 80; mb.cockpitOpen = false; }
    } else if (mb.shieldState === "recharging") {
      mb.shieldAmt = Math.min(0.3, mb.shieldAmt + 0.01);
      mb.shieldTimer--;
      if (mb.shieldTimer <= 0) { mb.shieldState = "up"; mb.shieldTimer = 160 + Math.random()*80; }
    }
    if (mb.electricBall) {
      const ball = mb.electricBall;
      ball.x += ball.vx; ball.y += ball.vy; ball.arcTimer++;
      ball.alpha = ball.x > 80 ? 1 : Math.max(0, ball.x / 80);
      if (player.invincible <= 0) {
        const pdx = ball.x - (player.x+player.w/2), pdy = ball.y - (player.y+player.h/2);
        if (Math.sqrt(pdx*pdx+pdy*pdy) < (ball.r||28)) {
          lives--; updateHUD(); player.invincible=90;
          explode(player.x+player.w/2,player.y+player.h/2,"#00ffff","#ffffff",20);
          if(sfxEnabled) playTone(200,"square",0.4,0.5,100);
          if(lives<=0){state="gameover";} mb.electricBall = null;
        }
      }
      if (ball.x + (ball.r||28) < 0) mb.electricBall = null;
    }
    if (mb.cockpitOpen) { mb.cockpitTimer--; if (mb.cockpitTimer <= 0) mb.cockpitOpen = false; }
    const dy2 = mb.targetY - mb.y;
    mb.vy = (mb.vy||0) * 0.9 + dy2*0.015;
    mb.y += mb.vy; mb.y = Math.max(30, Math.min(GAME_H-mb.h-30, mb.y));
  } else {
    const minX=Math.min(...alive.map(e=>e.x)), maxX=Math.max(...alive.map(e=>e.x+e.w));
    if (maxX > GAME_W - 4 && enemyDir === 1) { enemyDir=-1; alive.forEach(e=>e.y+=18); }
    else if (minX < 180 && enemyDir === -1)  { enemyDir= 1; alive.forEach(e=>e.y+=18); }
    const minY=Math.min(...alive.map(e=>e.y)), maxY=Math.max(...alive.map(e=>e.y+e.h));
    if (maxY >= GAME_H - 38) enemyVDir=-1; else if (minY <= 38) enemyVDir= 1;
    alive.forEach(e=>{ e.y += enemyVDir * 0.4; });
    alive.forEach(e=>{
      e.x+=enemyDir*enemySpeed; e.shootTimer--;
      if (e.shootTimer<=0) {
        const rate=Math.max(80, 200-waveNum*15);
        e.shootTimer=rate+Math.random()*rate;
        if (Math.random()<0.25) enemyBullets.push({
          x:e.x,y:e.y+e.h/2, vx:-(2.5+waveNum*0.3),vy:(Math.random()-0.5)*2,enemy:true
        });
      }
    });
  }

  bullets=bullets.filter(b=>{
    b.x+=b.vx; if(b.x>GAME_W) return false;
    let hit=false;
    enemies.forEach(e=>{
      if(!e.dead) {
        const inRange = e.type==="megaboss"
          ? Math.sqrt((b.x-(e.x+e.w/2))**2+(b.y-(e.y+e.h/2))**2) < 70
          : rectsOverlap(b.x-10,b.y-4,20,8,e.x,e.y,e.w,e.h);
        if(inRange) {
          if (e.type==="megaboss") {
            if ((e.shieldAmt||0) > 0.3) {
              hit=true; explode(b.x,b.y,"#00ffff","#aaffff",4);
              if(sfxEnabled) playTone(800,"sine",0.03,0.06,600);
            } else {
              const cx = e.x + e.w/2, cy = e.y + e.h/2 - 14;
              if (e.cockpitOpen && rectsOverlap(b.x-10,b.y-4,20,8, cx-27,cy-22,54,44)) {
                e.hp--; hit=true; explode(b.x,b.y,"#00ffff","#ffffff",8); sfxBossHit();
                if(e.hp<=0){ e.dead=true; score+=5000;
                  explode(e.x+e.w/2,e.y+e.h/2,"#ff2020","#ffcc00",60); sfxExplode();
                  bossDyingTimer=180; bossDyingX=e.x+e.w/2; bossDyingY=e.y+e.h/2; state="bossdying"; }
              } else if (!e.cockpitOpen) { hit=true; explode(b.x,b.y,"#4040ff","#ffffff",4);
                if(sfxEnabled) playTone(600,"square",0.04,0.08,400); }
            }
          } else {
            e.hp--; hit=true;
            if(e.hp<=0) {
              e.dead=true;
              score+=e.type==="boss"?300:e.type==="mid"?150:80;
              const ec=e.type==="boss"?["#ff6060","#ffcc00"]:e.type==="mid"?["#ff9040","#fff"]:["#60d060","#ffff60"];
              explode(e.x+e.w/2,e.y+e.h/2,ec[0],ec[1],e.type==="boss"?30:18); sfxExplode();
            } else { explode(e.x+e.w/2,e.y+e.h/2,"#fff","#ffcc00",6); sfxHitEnemy(); }
          }
        }
      }
    });
    return !hit;
  });

  if (player.invincible<=0) {
    for (const b of enemyBullets) {
      if (rectsOverlap(b.x-8,b.y-4,16,8,player.x+8,player.y+4,player.w-16,player.h-8)) {
        lives--; updateHUD(); player.invincible=90;
        explode(player.x+player.w/2,player.y+player.h/2,"#f5c842","#ff4040",20); sfxPlayerHit();
        if (lives<=0) { state="gameover"; return; } break;
      }
    }
  }
  enemyBullets=enemyBullets.filter(b=>{
    b.x+=b.vx; b.y+=b.vy;
    if (b.rocket) {
      particles.push({ x:b.x-b.vx*0.5+(Math.random()-0.5)*4, y:b.y-b.vy*0.5+(Math.random()-0.5)*4,
        vx:(Math.random()-0.5)*0.8, vy:(Math.random()-0.5)*0.8,
        life:0.8, decay:0.02, r:5+Math.random()*5,
        color:`rgba(${120+Math.floor(Math.random()*80)},${60+Math.floor(Math.random()*40)},20,0.6)`, type:"circle" });
    }
    return b.x>-20&&b.y>-20&&b.y<GAME_H+20;
  });
  if (alive.some(e=>e.x<60)) { state="gameover"; }
  particles=particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=p.decay; return p.life>0; });
}

// ─── Boss dying ───────────────────────────────────────────────
function updateBossDying() {
  bossDyingTimer--;
  if (frameCount % 4 === 0) {
    const ox = bossDyingX + (Math.random()-0.5)*140, oy = bossDyingY + (Math.random()-0.5)*100;
    explode(ox, oy, "#ff2020", "#ffcc00", 20);
    if (frameCount % 12 === 0) sfxExplode();
  }
  const flashAlpha = Math.max(0, (60 - bossDyingTimer) * 0.015);
  if (bossDyingTimer < 60) { ctx.fillStyle=`rgba(255,220,50,${flashAlpha})`; ctx.fillRect(0,0,GAME_W,GAME_H); }
  if (bossDyingTimer === 20) {
    for (let i=0;i<8;i++) { const ox=bossDyingX+(Math.random()-0.5)*180, oy=bossDyingY+(Math.random()-0.5)*130; explode(ox,oy,"#ffffff","#ffcc00",35); }
    sfxExplode(); sfxWin();
  }
  if (bossDyingTimer <= 10) { ctx.fillStyle=`rgba(255,255,255,${(10-bossDyingTimer)*0.1})`; ctx.fillRect(0,0,GAME_W,GAME_H); }
  if (bossDyingTimer <= 0) { state = "win"; }
}

// ─── Escape animation ─────────────────────────────────────────
function updateEscaping() {
  escapeAnim.timer++;
  const t = escapeAnim.timer;
  clouds.forEach(c=>{ c.x -= 4; if(c.x+c.w<-100) c.x=GAME_W+50; });
  if (t < 40) {
    player.x += 4; player.y += Math.sin(t * 0.8) * 1.5;
    if (t % 5 === 0) {
      const ew = tunnel.exitWall;
      explode(ew.x + Math.random()*60, Math.random()*GAME_H, "#ff4020","#ffcc00", 12);
      if (sfxEnabled) playTone(80+Math.random()*60,"sawtooth",0.2,0.3,40);
    }
    ctx.save(); ctx.translate(Math.sin(t*3)*3, Math.cos(t*2.5)*2);
  } else if (t < 100) {
    const accel = (t - 40) / 60;
    player.x += 6 + accel * 18; player.y += Math.sin(t * 0.3) * 0.5;
    ctx.strokeStyle=`rgba(245,200,66,${accel*0.4})`; ctx.lineWidth=2;
    for (let i=0;i<15;i++) {
      const lx=(frameCount*12+i*55)%(GAME_W+100)-50;
      ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx-80,GAME_H); ctx.stroke();
    }
    if (t===42) sfxWaveClear();
  }
  player.propAngle += 0.6;
  drawTunnelBG();
  particles.forEach(drawParticle);
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=p.decay;return p.life>0;});
  const exCount = t > 40 ? 5 : 2;
  for (let i=0;i<exCount;i++) particles.push({
    x:player.x+4, y:player.y+player.h/2+(Math.random()-0.5)*10,
    vx:-2-Math.random()*4, vy:(Math.random()-0.5)*1.5,
    life:0.8, decay:0.04, r:3+Math.random()*5,
    color:Math.random()>0.5?"#f5c842":"#ff6020", type:"circle",
  });
  if (player.x < GAME_W + 100) drawPlane(player.x, player.y, player.w, player.h, 0, player.propAngle);
  if (t < 40) ctx.restore();
  drawHUD();
  if (t >= 100) {
    const flash = Math.min((t-100)/20, 1);
    ctx.fillStyle=`rgba(255,255,255,${flash})`; ctx.fillRect(0,0,GAME_W,GAME_H);
    if (t >= 120) {
      player.x = -100; player.y = GAME_H/2 - player.h/2;
      player.speed = PLAYER_BASE_SPEED; playerSpeedBoosted = false;
      spawnWave(4); initAbsorbers(); enemyBullets = []; bullets = [];
      wave4Intro.timer = 0; wave4Intro.cannonX = null; wave4Intro.absorberX = null;
      state = "wave4intro";
    }
  }
}

// ─── Pause menu ───────────────────────────────────────────────
function handlePauseSelect() {
  sfxMenuSelect();
  if (pauseIndex === 0) { paused = false; }
  else { paused = false; state="start"; menuIndex=0; debugOpen=false; }
}
function handlePauseClick(e) {
  const cy = toCanvasY(e.clientY);
  const y0 = 44 + 85, y1 = 44 + 85 + 50;
  if (Math.abs(cy - y0) < 22) { pauseIndex=0; handlePauseSelect(); }
  else if (Math.abs(cy - y1) < 22) { pauseIndex=1; handlePauseSelect(); }
}
function handlePauseTap(e) {
  const t = e.changedTouches[0];
  handlePauseClick({ clientY: t.clientY });
}

// ─── Start screen ─────────────────────────────────────────────
function drawStartScreen() {
  ctx.save(); ctx.globalAlpha=0.35;
  for (let i=0;i<6;i++) {
    const x=420+Math.cos(frameCount*0.013+i*1.1)*160, y=60+i*65;
    drawEnemy({x,y,w:46,h:30,type:["basic","mid","boss"][i%3],hp:2,maxHp:3,bobOffset:i});
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha=0.8+Math.sin(frameCount*0.05)*0.2;
  drawPlane(60, 195, 70, 36, 0, frameCount*0.35); ctx.restore();
  ctx.save(); ctx.textAlign="center";
  ctx.font="bold 58px Rancho,cursive";
  ctx.strokeStyle="#8b2500"; ctx.lineWidth=7;
  ctx.strokeText("✈ SKY RASCAL ✈", GAME_W/2, 100);
  ctx.fillStyle="#f5c842"; ctx.fillText("✈ SKY RASCAL ✈", GAME_W/2, 100);
  ctx.font="16px Boogaloo,cursive"; ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillText("A CUPHEAD-STYLE SHOOTER", GAME_W/2, 125); ctx.restore();

  if (!debugOpen) {
    ctx.fillStyle="rgba(0,0,0,0.65)";
    roundRect(GAME_W/2-150, 195, 300, 178, 10);
    ctx.strokeStyle="rgba(245,200,66,0.4)"; ctx.lineWidth=2;
    ctx.beginPath(); roundRectPath(GAME_W/2-150, 195, 300, 178, 10); ctx.stroke();
    MAIN_ITEMS.forEach((label, i) => {
      const x=GAME_W/2, y=getMenuItemY(i), sel=menuIndex===i;
      if (sel) {
        ctx.fillStyle="rgba(245,200,66,0.18)"; roundRect(GAME_W/2-138,y-22,276,38,6);
        ctx.fillStyle="#f5c842"; ctx.font="14px Boogaloo,cursive"; ctx.textAlign="left";
        ctx.fillText(Math.sin(frameCount*0.15)>0?"►":"▶", GAME_W/2-138, y+5);
      }
      ctx.textAlign="center";
      let text=label;
      if (i===1) text="SFX:  "+(sfxEnabled?"✅ ON":"❌ OFF");
      ctx.font=sel?"bold 22px Rancho,cursive":"20px Rancho,cursive";
      ctx.fillStyle=sel?"#f5c842":"rgba(255,255,255,0.7)";
      ctx.strokeStyle="#000"; ctx.lineWidth=3;
      ctx.strokeText(text,x,y+5); ctx.fillText(text,x,y+5);
    });
  } else {
    const panelTop=155, panelBot=GAME_H-20, panelH=panelBot-panelTop;
    ctx.fillStyle="rgba(0,0,0,0.85)";
    roundRect(GAME_W/2-150, panelTop, 300, panelH, 10);
    ctx.strokeStyle="rgba(255,80,80,0.5)"; ctx.lineWidth=2;
    ctx.beginPath(); roundRectPath(GAME_W/2-150, panelTop, 300, panelH, 10); ctx.stroke();
    ctx.textAlign="center"; ctx.fillStyle="#ff6060";
    ctx.font="bold 16px Rancho,cursive"; ctx.fillText("🔧 DEBUG — SELECT LEVEL", GAME_W/2, panelTop+22);
    ctx.fillStyle="rgba(255,255,255,0.3)"; ctx.font="11px Boogaloo,cursive";
    ctx.fillText(isMobile?"Tap outside to go back":"ESC / click outside to go back", GAME_W/2, panelTop+40);
    const colW=138, col1X=GAME_W/2-colW-2, col2X=GAME_W/2+2, rowH=32, startY=panelTop+58;
    const half=Math.ceil(DEBUG_ITEMS.length/2);
    DEBUG_ITEMS.forEach((label, i) => {
      const col=i<half?0:1, row=col===0?i:i-half;
      const x=col===0?col1X+colW/2:col2X+colW/2, y=startY+row*rowH, sel=debugIndex===i;
      if (sel) { ctx.fillStyle="rgba(255,80,80,0.2)"; roundRect(col===0?col1X:col2X, y-14, colW, 28, 5); }
      ctx.textAlign="center";
      ctx.font=sel?"bold 15px Rancho,cursive":"13px Rancho,cursive";
      ctx.fillStyle=sel?"#ff8080":"rgba(255,255,255,0.65)";
      ctx.strokeStyle="#000"; ctx.lineWidth=2;
      ctx.strokeText(label,x,y+5); ctx.fillText(label,x,y+5);
    });
  }
  ctx.textAlign="center"; ctx.font="12px Boogaloo,cursive"; ctx.fillStyle="rgba(255,255,255,0.3)";
  if (!debugOpen) ctx.fillText(isMobile?"Tap to navigate":"↑↓ Navigate   ENTER Select", GAME_W/2, 430);
  ctx.textAlign="left";
}

// ─── Menu helpers ─────────────────────────────────────────────
const MAIN_ITEMS = ["▶  START GAME", "SFX", "DEBUG ▶"];
const DEBUG_ITEMS = [
  "Ground Escape", "Tunnel Gauntlet", "Ground Escape 2", "GE Boss", "Wave 1", "Wave 2", "Wave 3",
  "Ship Boss", "Tunnel", "Wave 4", "Boss"
];
function handleMenuSelect() {
  sfxMenuSelect();
  if (!debugOpen) {
    if (menuIndex === 0) startGame();
    else if (menuIndex === 1) sfxEnabled = !sfxEnabled;
    else if (menuIndex === 2) { debugOpen = true; debugIndex = 0; }
  } else { runDebugAction(debugIndex); }
}
function menuUp()   { sfxMenuMove(); if (!debugOpen) menuIndex=(menuIndex+2)%3; else debugIndex=(debugIndex+DEBUG_ITEMS.length-1)%DEBUG_ITEMS.length; }
function menuDown() { sfxMenuMove(); if (!debugOpen) menuIndex=(menuIndex+1)%3; else debugIndex=(debugIndex+1)%DEBUG_ITEMS.length; }
function menuBack() { if (debugOpen) { debugOpen=false; sfxMenuMove(); } }
function getMenuItemY(idx) { return 230 + idx*48; }
function getDebugItemY(idx) {
  const topY=165, botY=GAME_H-30, headerH=55, availH=botY-topY-headerH;
  const spacing=Math.min(38, availH/DEBUG_ITEMS.length);
  return topY + headerH + idx * spacing + spacing*0.5;
}
function hitTestMenu(canvasX, canvasY) {
  if (!debugOpen) {
    for (let i=0;i<MAIN_ITEMS.length;i++) if (Math.abs(canvasY-getMenuItemY(i))<22) return i;
  } else {
    const colW=138, col1X=GAME_W/2-colW-2, col2X=GAME_W/2+2, rowH=32, startY=165+58;
    const half=Math.ceil(DEBUG_ITEMS.length/2);
    for(let i=0;i<DEBUG_ITEMS.length;i++){
      const col=i<half?0:1, row=col===0?i:i-half;
      const x=col===0?col1X:col2X, y=startY+row*rowH;
      if(canvasX>=x && canvasX<=x+colW && canvasY>=y-14 && canvasY<=y+18) return i;
    }
  }
  return -1;
}
function toCanvasY(clientY) {
  const rect = canvas.getBoundingClientRect();
  return (clientY - rect.top) * (GAME_H / rect.height);
}
function handleMenuClick(e) {
  const rect=canvas.getBoundingClientRect();
  const cx=(e.clientX-rect.left)*(GAME_W/rect.width), cy=toCanvasY(e.clientY);
  const hit=hitTestMenu(cx,cy);
  if (hit>=0) { if(!debugOpen){menuIndex=hit;handleMenuSelect();}else{debugIndex=hit;handleMenuSelect();} }
  else if (debugOpen) menuBack();
}
function handleMenuTap(e) {
  const t=e.changedTouches[0], rect=canvas.getBoundingClientRect();
  const cx=(t.clientX-rect.left)*(GAME_W/rect.width), cy=toCanvasY(t.clientY);
  const hit=hitTestMenu(cx,cy);
  if (hit>=0) { if(!debugOpen){menuIndex=hit;handleMenuSelect();}else{debugIndex=hit;handleMenuSelect();} }
  else if (debugOpen) menuBack(); else menuDown();
}

// ─── Debug actions ────────────────────────────────────────────
function runDebugAction(idx) {
  debugMode = true;
  if      (idx===0) startGroundEscape();
  else if (idx===1) startDebugTunnelGauntlet();
  else if (idx===2) startGroundEscape2();
  else if (idx===3) startDebugGEBoss();
  else if (idx===4) startDebugWave(1);
  else if (idx===5) startDebugWave(2);
  else if (idx===6) startDebugWave(3);
  else if (idx===7) startDebugShipBoss();
  else if (idx===8) startDebugTunnel();
  else if (idx===9) startDebugWave(4);
  else if (idx===10) startDebugBoss();
}

function startDebugTunnelGauntlet() {
  score=0; lives=5; waveNum=1;
  startGroundEscape();
  gnd.distance = gnd.totalDist;
  gnd.phase = "tunnel_approach";
  gnd.tunnelTimer = 0; gnd.tunnelReveal = 0; gnd.speed = 7;
  const jeepBaseY2 = GAME_H - JEEP_H - 4;
  gnd.blockages = [];
  for(let i=0;i<16;i++){
    let bw=45+Math.random()*80, bh=30+Math.random()*60;
    let by2=(ROAD_Y-20)+Math.random()*(jeepBaseY2-bh-(ROAD_Y-20));
    let n=6+Math.floor(Math.random()*3), pts=[];
    for(let j=0;j<n;j++){ let ang=(j/n)*Math.PI*2, r=0.32+Math.random()*0.2; pts.push([Math.cos(ang)*r,Math.sin(ang)*r]); }
    gnd.blockages.push({ y:by2, bh, bw, xOffset:Math.random()*50, hp:2+Math.floor(Math.random()*2), shape:pts, firePhase:Math.random()*Math.PI*2 });
  }
}

function startDebugWave(wave) {
  score=0; lives=5; waveNum=wave;
  enemyDir=-1; enemySpeed=1+(wave-1)*0.3; enemyVDir=1;
  bossDyingTimer=0; player.speed=PLAYER_BASE_SPEED; playerSpeedBoosted=false;
  bullets=[]; enemyBullets=[]; particles=[];
  cannon.active=false; cannon.dead=false; cannon.laser=null; mecha.active=false; mecha.dead=false;
  tunnel.walls=[]; tunnel.wallsSpawned=0; tunnel.playerHitTimer=0;
  tunnel.exitWall={active:false,x:GAME_W+60,hp:0,maxHp:30,segments:[]};
  player.x=80; player.y=GAME_H/2-player.h/2; player.invincible=0;
  initClouds();
  if (wave===4) {
    spawnWave(4);
    cannon.hp=20; cannon.maxHp=20; initAbsorbers();
    player.x=-100; player.y=GAME_H/2-player.h/2;
    wave4Intro.timer=0; wave4Intro.cannonX=null; wave4Intro.absorberX=null;
    state="wave4intro";
  } else { spawnWave(wave); state="playing"; }
}

function startDebugShipBoss() {
  score=0; lives=5; waveNum=4;
  enemyDir=-1; enemySpeed=1; enemyVDir=1;
  bossDyingTimer=0; player.speed=PLAYER_BASE_SPEED; playerSpeedBoosted=false;
  bullets=[]; enemyBullets=[]; particles=[];
  cannon.active=false; cannon.dead=false; cannon.laser=null; mecha.active=false; mecha.dead=false;
  tunnel.walls=[]; tunnel.wallsSpawned=0; tunnel.playerHitTimer=0;
  tunnel.exitWall={active:false,x:GAME_W+60,hp:0,maxHp:30,segments:[]};
  player.x=80; player.y=GAME_H/2-player.h/2; player.invincible=0;
  initClouds(); startShipBoss();
}

function startDebugBoss() {
  score=0; lives=5; waveNum=5;
  enemyDir=-1; enemySpeed=1; enemyVDir=1;
  bossDyingTimer=0; player.speed=PLAYER_BASE_SPEED; playerSpeedBoosted=false;
  bullets=[]; enemyBullets=[]; particles=[];
  cannon.active=false; cannon.dead=false; cannon.laser=null; mecha.active=false; mecha.dead=false;
  tunnel.walls=[]; tunnel.wallsSpawned=0; tunnel.playerHitTimer=0;
  tunnel.exitWall={active:false,x:GAME_W+60,hp:0,maxHp:30,segments:[]};
  player.x=80; player.y=GAME_H/2-player.h/2; player.invincible=0;
  initClouds(); startWave5Intro();
  setTimeout(()=>{ if(mecha.active){ mecha.hp=10; mecha.maxHp=10; }}, 0);
}

function startDebugTunnel() {
  lives=5; score=0; waveNum=4;
  particles=[]; bullets=[]; enemyBullets=[];
  player.speed = PLAYER_BASE_SPEED; playerSpeedBoosted = false;
  initClouds(); startTunnel();
}

// ─── Boot ─────────────────────────────────────────────────────
initClouds();
state = "start";
requestAnimationFrame(loop);
