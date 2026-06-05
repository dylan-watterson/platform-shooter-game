// ─── Utility ──────────────────────────────────────────────────
function rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh) {
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}
function lerpc(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}

function roundRect(x,y,w,h,r) {
  ctx.beginPath(); roundRectPath(x,y,w,h,r); ctx.fill();
}
function roundRectPath(x,y,w,h,r) {
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ─── Clouds ───────────────────────────────────────────────────
function initClouds() {
  clouds = [];
  for (let i=0;i<8;i++) clouds.push({
    x: Math.random()*900, y: Math.random()*380,
    w: 80+Math.random()*120, speed: 0.3+Math.random()*0.5,
    alpha: 0.12+Math.random()*0.18,
  });
}

function drawCloud(c) {
  ctx.save(); ctx.globalAlpha=c.alpha; ctx.fillStyle="#fff";
  ctx.beginPath();
  ctx.arc(c.x,c.y,c.w*0.3,0,Math.PI*2);
  ctx.arc(c.x+c.w*0.3,c.y-c.w*0.1,c.w*0.22,0,Math.PI*2);
  ctx.arc(c.x+c.w*0.6,c.y,c.w*0.28,0,Math.PI*2);
  ctx.arc(c.x+c.w*0.3,c.y+c.w*0.15,c.w*0.2,0,Math.PI*2);
  ctx.fill(); ctx.restore();
}

// ─── Backgrounds ──────────────────────────────────────────────
function drawBG() {
  if (waveNum === 4 && (state === "playing" || state === "wave4intro")) {
    drawShipInteriorBG();
  } else if (waveNum === 5 || state === "wave5intro" || state === "bossdying") {
    drawSinisterBG();
  } else {
    const g=ctx.createLinearGradient(0,0,0,GAME_H);
    g.addColorStop(0,"#1a3a6a"); g.addColorStop(0.5,"#2a5090"); g.addColorStop(1,"#1a3060");
    ctx.fillStyle=g; ctx.fillRect(0,0,GAME_W,GAME_H);
    for (let y=0;y<GAME_H;y+=4) {
      ctx.fillStyle="rgba(0,0,0,0.05)"; ctx.fillRect(0,y,GAME_W,2);
    }
    clouds.forEach(drawCloud);
  }
}

function drawSinisterBG() {
  ctx.fillStyle="#060006"; ctx.fillRect(0,0,GAME_W,GAME_H);
  const pulse = 0.08 + Math.sin(frameCount*0.03)*0.04;
  const rg = ctx.createRadialGradient(GAME_W*0.7, GAME_H/2, 50, GAME_W*0.7, GAME_H/2, 380);
  rg.addColorStop(0, `rgba(180,0,0,${pulse*2})`); rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle=rg; ctx.fillRect(0,0,GAME_W,GAME_H);
  ctx.fillStyle="#0a0008"; ctx.fillRect(0,0,GAME_W,44);
  ctx.fillStyle="#1a0018"; ctx.fillRect(0,42,GAME_W,4);
  ctx.fillStyle="#0a0008"; ctx.fillRect(0,GAME_H-44,GAME_W,44);
  ctx.fillStyle="#1a0018"; ctx.fillRect(0,GAME_H-46,GAME_W,4);
  const panelW = 160, offset = (frameCount * 0.8) % panelW;
  ctx.strokeStyle="rgba(120,0,30,0.3)"; ctx.lineWidth=1;
  for (let x=-panelW+offset; x<GAME_W+panelW; x+=panelW) {
    ctx.strokeRect(x+4, 44, panelW-8, GAME_H-88);
    ctx.fillStyle="rgba(140,0,30,0.5)";
    ctx.beginPath(); ctx.arc(x+14, 56, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+14, GAME_H-56, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+panelW-14, 56, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+panelW-14, GAME_H-56, 4, 0, Math.PI*2); ctx.fill();
  }
  const pipeOffset = (frameCount * 0.8) % 100;
  ctx.strokeStyle="rgba(80,0,10,0.9)"; ctx.lineWidth=10;
  ctx.beginPath(); ctx.moveTo(0,22); ctx.lineTo(GAME_W,22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,GAME_H-22); ctx.lineTo(GAME_W,GAME_H-22); ctx.stroke();
  ctx.fillStyle="rgba(100,0,20,0.8)";
  for (let x=-100+pipeOffset; x<GAME_W+100; x+=100) {
    ctx.fillRect(x-5, 15, 10, 14); ctx.fillRect(x-5, GAME_H-29, 10, 14);
  }
  const warnFlash = Math.floor(frameCount/8)%3!==0;
  if (warnFlash) {
    ctx.fillStyle="rgba(200,0,0,0.1)";
    ctx.fillRect(0,42,GAME_W,8); ctx.fillRect(0,GAME_H-50,GAME_W,8);
  }
  for (let y=0;y<GAME_H;y+=4) { ctx.fillStyle="rgba(0,0,0,0.1)"; ctx.fillRect(0,y,GAME_W,2); }
}

function drawShipInteriorBG() {
  ctx.fillStyle="#0a0a12"; ctx.fillRect(0,0,GAME_W,GAME_H);
  ctx.fillStyle="#141420"; ctx.fillRect(0,0,GAME_W,40);
  ctx.fillStyle="#1e1e30"; ctx.fillRect(0,38,GAME_W,4);
  ctx.fillStyle="#141420"; ctx.fillRect(0,GAME_H-40,GAME_W,40);
  ctx.fillStyle="#1e1e30"; ctx.fillRect(0,GAME_H-42,GAME_W,4);
  const panelW = 120, offset = (frameCount * 1.5) % panelW;
  ctx.strokeStyle="rgba(60,60,100,0.4)"; ctx.lineWidth=1;
  for (let x=-panelW+offset; x<GAME_W+panelW; x+=panelW) {
    ctx.strokeRect(x, 40, panelW-4, GAME_H-80);
    ctx.fillStyle="rgba(80,80,120,0.5)";
    ctx.beginPath(); ctx.arc(x+6, 50, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+6, GAME_H-50, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+panelW-10, 50, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+panelW-10, GAME_H-50, 3, 0, Math.PI*2); ctx.fill();
  }
  const pipeOffset = (frameCount * 1.5) % 80;
  ctx.strokeStyle="rgba(40,40,80,0.8)"; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(0,20); ctx.lineTo(GAME_W,20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,GAME_H-20); ctx.lineTo(GAME_W,GAME_H-20); ctx.stroke();
  ctx.fillStyle="rgba(60,60,100,0.7)";
  for (let x=-80+pipeOffset; x<GAME_W+80; x+=80) {
    ctx.fillRect(x-4, 14, 8, 12); ctx.fillRect(x-4, GAME_H-26, 8, 12);
  }
  const warnFlash = Math.floor(frameCount/20)%2===0;
  ctx.fillStyle = warnFlash ? "rgba(255,60,0,0.12)" : "rgba(255,120,0,0.06)";
  ctx.fillRect(0, 38, GAME_W, 8); ctx.fillRect(0, GAME_H-46, GAME_W, 8);
  const enginePulse = 0.15 + Math.sin(frameCount*0.05)*0.05;
  ctx.fillStyle=`rgba(0,80,200,${enginePulse})`;
  ctx.fillRect(GAME_W-60,0,60,GAME_H);
  for (let y=0;y<GAME_H;y+=4) { ctx.fillStyle="rgba(0,0,0,0.08)"; ctx.fillRect(0,y,GAME_W,2); }
}

// ─── HUD ──────────────────────────────────────────────────────
function drawHUD() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, GAME_W, 34);
  ctx.strokeStyle = "rgba(245,200,66,0.3)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,34); ctx.lineTo(GAME_W,34); ctx.stroke();
  ctx.font = "bold 16px Boogaloo,cursive"; ctx.fillStyle = "#f5c842";
  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, 12, 23);
  // Lives — left side (placeholder icons)
  ctx.textAlign = "left"; ctx.font = "16px Arial";
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lives ? "#f5c842" : "#443300";
    ctx.fillText(i < lives ? "🚗" : "💀", 12 + i * 26, 24);
  }
  // HP hearts — centre
  ctx.font = "18px Arial";
  const totalHeartW = 5 * 26, heartStartX = GAME_W/2 - totalHeartW/2;
  for (let i = 0; i < 5; i++) {
    ctx.fillText(i < hp ? "❤️" : "🖤", heartStartX + i*26, 24);
  }
  ctx.textAlign = "right"; ctx.font = "bold 16px Boogaloo,cursive"; ctx.fillStyle = "#f5c842";
  ctx.fillText("WAVE: " + waveNum + " / 5", GAME_W - 12, 23);
  if (debugMode && (state==="ground" || state==="ground2")) {
    const jeepBaseX  = Math.round(gnd.jeepY);
    const jeepFrontY = Math.round(gnd.jeepX);
    const label = `X:${jeepBaseX}  Y:${jeepFrontY}`;
    ctx.font = "bold 13px monospace";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(GAME_W - tw - 22, 38, tw + 16, 22);
    ctx.fillStyle = "#00ff99"; ctx.textAlign = "right";
    ctx.fillText(label, GAME_W - 10, 54);
  }
  ctx.textAlign = "left"; ctx.restore();
}
function updateHUD() {} // HUD is drawn on canvas

// ─── Particles ────────────────────────────────────────────────
function explode(x,y,c1,c2,n=18) {
  for (let i=0;i<n;i++) {
    const a=(Math.PI*2*i)/n+Math.random()*0.5, sp=1.5+Math.random()*4;
    particles.push({ x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:1, decay:0.025+Math.random()*0.03,
      r:3+Math.random()*5, color:Math.random()>0.5?c1:c2,
      type:Math.random()>0.6?"star":"circle" });
  }
}

function drawParticle(p) {
  ctx.save(); ctx.globalAlpha=p.life;
  if (p.type==="smoke") {
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
    g.addColorStop(0,   p.color.replace(/[\d.]+\)$/,"0.55)"));
    g.addColorStop(0.5, p.color.replace(/[\d.]+\)$/,"0.28)"));
    g.addColorStop(1,   p.color.replace(/[\d.]+\)$/,"0)"));
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle=p.color;
    if (p.type==="star") {
      ctx.translate(p.x,p.y); ctx.rotate(frameCount*0.1);
      ctx.beginPath();
      for (let i=0;i<5;i++) {
        const a=Math.PI*2*i/5-Math.PI/2, ai=a+Math.PI/5;
        ctx.lineTo(Math.cos(a)*p.r,Math.sin(a)*p.r);
        ctx.lineTo(Math.cos(ai)*p.r*0.4,Math.sin(ai)*p.r*0.4);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Bullets ──────────────────────────────────────────────────
function drawBullet(b) {
  ctx.save(); ctx.translate(b.x,b.y);
  if (b.rocket) {
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.fillStyle="#888888"; ctx.fillRect(-14,-4,20,8);
    ctx.fillStyle="#cc4400";
    ctx.beginPath(); ctx.moveTo(6,-4); ctx.lineTo(14,0); ctx.lineTo(6,4); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#666666";
    ctx.beginPath(); ctx.moveTo(-14,-4); ctx.lineTo(-18,-10); ctx.lineTo(-10,-4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14,4);  ctx.lineTo(-18,10);  ctx.lineTo(-10,4);  ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(255,120,0,0.9)";
    ctx.beginPath(); ctx.ellipse(-14,0,5,3,0,0,Math.PI*2); ctx.fill();
  } else if (b.enemy) {
    ctx.fillStyle="#ff4040"; ctx.shadowColor="#ff0000"; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.ellipse(0,0,8,5,0,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle="#f5e030"; ctx.shadowColor="#ffcc00"; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.ellipse(0,0,10,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.ellipse(-2,-1,5,2,0,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ─── Player plane ─────────────────────────────────────────────
function drawPlane(x,y,w,h,inv,prop) {
  ctx.save(); ctx.translate(x+w/2,y+h/2);
  if (inv>0 && Math.floor(inv/4)%2===0) { ctx.restore(); return; }
  ctx.shadowColor="rgba(0,0,0,0.4)"; ctx.shadowBlur=8;
  ctx.fillStyle="#e8c840";
  ctx.beginPath(); ctx.ellipse(0,2,w*0.42,h*0.32,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#d44020";
  ctx.beginPath(); ctx.moveTo(-w*0.1,-h*0.1); ctx.lineTo(w*0.3,-h*0.45);
  ctx.lineTo(w*0.45,-h*0.1); ctx.lineTo(-w*0.15,0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-w*0.1,h*0.1); ctx.lineTo(w*0.25,h*0.45);
  ctx.lineTo(w*0.45,h*0.12); ctx.lineTo(-w*0.15,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#c83010";
  ctx.beginPath(); ctx.moveTo(w*0.42,0); ctx.lineTo(w*0.25,-h*0.15);
  ctx.lineTo(w*0.25,h*0.15); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#60d0f0"; ctx.strokeStyle="#205080"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.ellipse(w*0.08,-h*0.05,w*0.14,h*0.16,-0.3,0,Math.PI*2);
  ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(w*0.45,0); ctx.rotate(prop);
  ctx.fillStyle="#402010";
  for (let i=0;i<3;i++) {
    ctx.save(); ctx.rotate(Math.PI*2*i/3);
    ctx.beginPath(); ctx.ellipse(0,-h*0.35,h*0.08,h*0.35,0.2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.shadowBlur=0; ctx.strokeStyle="#402010"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,2,w*0.42,h*0.32,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

// ─── Enemy draw ───────────────────────────────────────────────
function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x+e.w/2, e.y+e.h/2+Math.sin(frameCount*0.04+e.bobOffset)*4);
  const hit=e.hp<e.maxHp;

  if (e.type==="megaboss") {
    const open = e.cockpitOpen || false;
    const hpRatio = e.hp / e.maxHp;
    const cx = e.x + e.w/2;
    const cy = e.y + e.h/2 + Math.sin(frameCount*0.04+e.bobOffset)*4;
    ctx.restore();
    drawSaucerHead(cx, cy, hpRatio, 70, 40, open);
    const shAmt = e.shieldAmt || 0;
    if (shAmt > 0.05) {
      ctx.save(); ctx.globalAlpha = shAmt * 0.85;
      ctx.translate(cx, cy); ctx.rotate(frameCount * 0.03);
      ctx.strokeStyle=`rgba(0,200,255,${shAmt})`; ctx.lineWidth=3;
      ctx.setLineDash([12,8]);
      ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.rotate(-frameCount * 0.06);
      ctx.strokeStyle=`rgba(100,255,255,${shAmt*0.6})`; ctx.lineWidth=1.5;
      ctx.setLineDash([6,10]);
      ctx.beginPath(); ctx.arc(0,0,90,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=`rgba(0,220,255,${shAmt})`;
      for(let i=0;i<6;i++){
        const a=frameCount*0.03+i*Math.PI/3;
        ctx.beginPath(); ctx.arc(Math.cos(a)*80,Math.sin(a)*80,5,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    if (e.electricBall) {
      const ball = e.electricBall;
      ctx.save(); ctx.globalAlpha = ball.alpha;
      ctx.fillStyle=`rgba(100,200,255,${ball.alpha})`;
      ctx.shadowColor="#00ffff"; ctx.shadowBlur=30;
      ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r||28,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(200,240,255,${ball.alpha*0.8})`;
      ctx.beginPath(); ctx.arc(ball.x,ball.y,(ball.r||28)*0.55,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=`rgba(255,255,255,${ball.alpha})`;
      ctx.beginPath(); ctx.arc(ball.x,ball.y,(ball.r||28)*0.25,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle=`rgba(150,230,255,${ball.alpha*0.9})`; ctx.lineWidth=1.5;
      for(let i=0;i<8;i++){
        const seed = ball.arcTimer*3+i*17;
        const a1 = (seed*0.4)%(Math.PI*2);
        const len = 35+((seed*7)%28);
        ctx.beginPath(); ctx.moveTo(ball.x,ball.y);
        const mx = ball.x+Math.cos(a1)*len*0.5+((seed*3)%12-6);
        const my = ball.y+Math.sin(a1)*len*0.5+((seed*5)%12-6);
        ctx.lineTo(mx,my);
        ctx.lineTo(ball.x+Math.cos(a1)*len,ball.y+Math.sin(a1)*len);
        ctx.stroke();
      }
      if(ball.arcTimer%3===0) particles.push({
        x:ball.x+(Math.random()-0.5)*20, y:ball.y+(Math.random()-0.5)*20,
        vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2,
        life:0.7, decay:0.05, r:2+Math.random()*3,
        color:"rgba(100,220,255,0.8)", type:"circle"
      });
      ctx.restore();
    }
    return;
  }

  if (e.type==="boss") {
    ctx.fillStyle=hit?"#ff6060":"#c0c0c0";
    ctx.beginPath(); ctx.ellipse(0,0,e.w*0.48,e.h*0.42,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=hit?"#cc3030":"#808080";
    ctx.beginPath(); ctx.moveTo(0,-e.h*0.15); ctx.lineTo(-e.w*0.55,-e.h*0.5);
    ctx.lineTo(-e.w*0.5,e.h*0.2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,e.h*0.1); ctx.lineTo(-e.w*0.5,e.h*0.55);
    ctx.lineTo(-e.w*0.45,-e.h*0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.ellipse(e.w*0.1,-e.h*0.05,e.w*0.22,e.h*0.28,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#111";
    ctx.beginPath(); ctx.ellipse(e.w*0.04,-e.h*0.1,e.w*0.06,e.h*0.08,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(e.w*0.2,-e.h*0.1,e.w*0.06,e.h*0.08,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#333";
    for (let i=0;i<4;i++) ctx.fillRect(e.w*0.03+i*e.w*0.07,e.h*0.08,e.w*0.04,e.h*0.12);
    const bw=e.w*0.9;
    ctx.fillStyle="#400"; ctx.fillRect(-bw/2,-e.h*0.62,bw,6);
    ctx.fillStyle="#f04040"; ctx.fillRect(-bw/2,-e.h*0.62,bw*(e.hp/e.maxHp),6);
  } else if (e.type==="mid") {
    ctx.fillStyle=hit?"#ff9040":"#803000";
    ctx.beginPath(); ctx.ellipse(0,0,e.w*0.4,e.h*0.35,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=hit?"#cc5010":"#502000";
    ctx.beginPath(); ctx.moveTo(0,-e.h*0.1); ctx.lineTo(-e.w*0.5,-e.h*0.45);
    ctx.lineTo(-e.w*0.42,e.h*0.18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,e.h*0.05); ctx.lineTo(-e.w*0.48,e.h*0.48);
    ctx.lineTo(-e.w*0.4,-e.h*0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#ffcc00";
    ctx.beginPath(); ctx.arc(e.w*0.08,-e.h*0.08,e.w*0.07,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w*0.24,-e.h*0.08,e.w*0.07,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#000";
    ctx.beginPath(); ctx.arc(e.w*0.1,-e.h*0.08,e.w*0.04,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w*0.26,-e.h*0.08,e.w*0.04,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle=hit?"#80d060":"#206020";
    ctx.beginPath(); ctx.ellipse(0,0,e.w*0.38,e.h*0.32,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=hit?"#509030":"#104010";
    ctx.beginPath(); ctx.moveTo(0,-e.h*0.08); ctx.lineTo(-e.w*0.48,-e.h*0.4);
    ctx.lineTo(-e.w*0.4,e.h*0.15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,e.h*0.05); ctx.lineTo(-e.w*0.45,e.h*0.42);
    ctx.lineTo(-e.w*0.38,-e.h*0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.arc(e.w*0.1,-e.h*0.06,e.w*0.06,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w*0.24,-e.h*0.06,e.w*0.06,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#000";
    ctx.beginPath(); ctx.arc(e.w*0.12,-e.h*0.06,e.w*0.03,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.w*0.26,-e.h*0.06,e.w*0.03,0,Math.PI*2); ctx.fill();
  }
  ctx.strokeStyle="#000"; ctx.lineWidth=1.5;
  ctx.beginPath();
  const erx = e.type==="boss"?e.w*0.48:e.w*0.4;
  const ery = e.type==="boss"?e.h*0.42:e.h*0.35;
  ctx.ellipse(0,0,erx,ery,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

// ─── UI overlays ──────────────────────────────────────────────
function drawOverlay(title, sub) {
  ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(0,0,GAME_W,GAME_H);
  ctx.textAlign="center"; ctx.fillStyle="#f5c842";
  ctx.font="bold 52px Rancho,cursive";
  ctx.strokeStyle="#8b2500"; ctx.lineWidth=6;
  ctx.strokeText(title,GAME_W/2,GAME_H/2-20); ctx.fillText(title,GAME_W/2,GAME_H/2-20);
  ctx.font="22px Boogaloo,cursive"; ctx.fillStyle="#fff";
  ctx.strokeStyle="#000"; ctx.lineWidth=3;
  ctx.strokeText(sub,GAME_W/2,GAME_H/2+30); ctx.fillText(sub,GAME_W/2,GAME_H/2+30);
  ctx.font="18px Boogaloo,cursive"; ctx.fillStyle="#f5c842";
  ctx.fillText("Score: "+score,GAME_W/2,GAME_H/2+65);
  ctx.textAlign="left"; ctx.shadowBlur=0;
}

function drawPauseMenu() {
  ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(0,0,GAME_W,GAME_H);
  const panelTop = 44, panelH = 180;
  ctx.fillStyle="rgba(10,10,20,0.9)";
  roundRect(GAME_W/2-130, panelTop, 260, panelH, 12);
  ctx.strokeStyle="rgba(245,200,66,0.5)"; ctx.lineWidth=2;
  ctx.beginPath(); roundRectPath(GAME_W/2-130, panelTop, 260, panelH, 12); ctx.stroke();
  ctx.textAlign="center"; ctx.font="bold 32px Rancho,cursive";
  ctx.strokeStyle="#000"; ctx.lineWidth=4;
  ctx.strokeText("PAUSED", GAME_W/2, panelTop+44);
  ctx.fillStyle="#f5c842"; ctx.fillText("PAUSED", GAME_W/2, panelTop+44);
  const items = ["▶  RESUME", "✕  QUIT TO MENU"];
  items.forEach((label, i) => {
    const y = panelTop + 85 + i*50, sel = pauseIndex === i;
    if (sel) {
      ctx.fillStyle="rgba(245,200,66,0.15)";
      roundRect(GAME_W/2-118, y-22, 236, 36, 6);
      ctx.fillStyle="#f5c842"; ctx.font="14px Boogaloo,cursive"; ctx.textAlign="left";
      ctx.fillText(Math.sin(frameCount*0.15)>0?"►":"▶", GAME_W/2-118, y+5);
    }
    ctx.textAlign="center";
    ctx.font = sel ? "bold 22px Rancho,cursive" : "20px Rancho,cursive";
    ctx.fillStyle = sel ? "#f5c842" : "rgba(255,255,255,0.7)";
    ctx.strokeStyle="#000"; ctx.lineWidth=3;
    ctx.strokeText(label, GAME_W/2, y+5); ctx.fillText(label, GAME_W/2, y+5);
  });
  ctx.font="12px Boogaloo,cursive"; ctx.fillStyle="rgba(255,255,255,0.3)";
  ctx.fillText(isMobile ? "Tap to select" : "ESC / P to resume  •  ↑↓ Navigate  ENTER Select", GAME_W/2, panelTop+panelH-10);
  ctx.textAlign="left";
}

function spawnConfetti() {
  if (frameCount%3===0) for (let i=0;i<4;i++) particles.push({
    x:Math.random()*GAME_W, y:-10,
    vx:(Math.random()-0.5)*3, vy:1+Math.random()*2,
    life:1, decay:0.005, r:5+Math.random()*5,
    color:["#f5c842","#ff4040","#60d060","#60a0ff","#ff80ff"][Math.floor(Math.random()*5)],
    type:Math.random()>0.5?"star":"circle",
  });
  particles.forEach(drawParticle);
}
