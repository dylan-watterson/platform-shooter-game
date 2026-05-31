// render-ground.js — ED-209 and ground scene draw functions
function drawEDCannonCharge(edX, edTargetY, edFacing, edStandAmt, sbt) {
  const plateT   = Math.min(1, sbt / 40);
  const barrelT  = Math.min(1, Math.max(0, (sbt - 40) / 40));
  const muzzleChargeT = Math.min(1, Math.max(0, (sbt - 80) / 100));
  const torsoLift = edStandAmt * 48;

  ctx.save();
  ctx.translate(edX, edTargetY - torsoLift);
  ctx.scale(edFacing, 1);

  // ── Grate at rest (fades out as plates open) ──
  const gateAlpha = 1 - plateT;
  if(gateAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = gateAlpha;
    ctx.fillStyle = "#3c3c3c";
    ctx.beginPath();
    ctx.moveTo(-52, -80); ctx.lineTo(-33, -80);
    ctx.lineTo(-33, -39); ctx.lineTo(-45, -39);
    ctx.closePath(); ctx.fill();
    // Horizontal bars
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2;
    for(let i = 0; i <= 5; i++) {
      const y = -80 + (i / 5) * 41;
      const lx = -52 + (i / 5) * 7;
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(-33, y); ctx.stroke();
    }
    // Vertical bars
    ctx.strokeStyle = "#4a4a4a"; ctx.lineWidth = 1.5;
    for(let i = 1; i < 3; i++) {
      const x = -52 + (i / 3) * 19;
      ctx.beginPath(); ctx.moveTo(x, -80); ctx.lineTo(x, -39); ctx.stroke();
    }
    ctx.strokeStyle = "#606060"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-52, -80); ctx.lineTo(-33, -80);
    ctx.lineTo(-33, -39); ctx.lineTo(-45, -39);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // ── Grate halves sliding apart ──
  if(plateT < 1 && plateT > 0) {
    const alpha = 1 - plateT;
    const slide = plateT * 28;
    // Top half slides up
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#3c3c3c";
    ctx.beginPath();
    ctx.moveTo(-52, -80 - slide); ctx.lineTo(-33, -80 - slide);
    ctx.lineTo(-33, -59 - slide); ctx.lineTo(-47, -59 - slide);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2;
    for(let i = 0; i <= 2; i++) {
      const y = -80 + (i / 2) * 21;
      const lx = -52 + (i / 2) * 5;
      ctx.beginPath(); ctx.moveTo(lx, y - slide); ctx.lineTo(-33, y - slide); ctx.stroke();
    }
    ctx.strokeStyle = "#606060"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-52, -80 - slide); ctx.lineTo(-33, -80 - slide);
    ctx.lineTo(-33, -59 - slide); ctx.lineTo(-47, -59 - slide);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    // Bottom half slides down
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#3c3c3c";
    ctx.beginPath();
    ctx.moveTo(-47, -59 + slide); ctx.lineTo(-33, -59 + slide);
    ctx.lineTo(-33, -39 + slide); ctx.lineTo(-45, -39 + slide);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2;
    for(let i = 0; i <= 2; i++) {
      const y = -59 + (i / 2) * 20;
      const lx = -47 + (i / 2) * 2;
      ctx.beginPath(); ctx.moveTo(lx, y + slide); ctx.lineTo(-33, y + slide); ctx.stroke();
    }
    ctx.strokeStyle = "#606060"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-47, -59 + slide); ctx.lineTo(-33, -59 + slide);
    ctx.lineTo(-33, -39 + slide); ctx.lineTo(-45, -39 + slide);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // ── Cannon barrel extending from x=-33 ──
  if(barrelT > 0) {
    const barrelLen = barrelT * 44;
    const barrelY = -59;
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(-33, barrelY - 7, -barrelLen, 14);
    ctx.strokeStyle = "#505050"; ctx.lineWidth = 1.5;
    ctx.strokeRect(-33, barrelY - 7, -barrelLen, 14);
    for(let i = 1; i <= 3; i++) {
      const rx = -33 - (barrelLen * i / 4);
      ctx.fillStyle = "#444";
      ctx.fillRect(rx - 3, barrelY - 9, 6, 18);
      ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
      ctx.strokeRect(rx - 3, barrelY - 9, 6, 18);
    }
    ctx.fillStyle = "#333";
    ctx.fillRect(-33 - barrelLen - 4, barrelY - 9, 4, 18);
    ctx.strokeStyle = "#555"; ctx.lineWidth = 1;
    ctx.strokeRect(-33 - barrelLen - 4, barrelY - 9, 4, 18);
  }

  ctx.restore();

  // ── Muzzle charge glow ──
  if(muzzleChargeT > 0 && barrelT >= 1) {
    const muzzleX = edX + edFacing * -(33 + 44 + 4);
    const muzzleY = edTargetY - torsoLift - 59;
    const glowR = 6 + muzzleChargeT * 22;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const og = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, glowR * 2);
    og.addColorStop(0, `rgba(180,220,255,${0.4 * muzzleChargeT})`);
    og.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(muzzleX, muzzleY, glowR * 2, 0, Math.PI * 2); ctx.fill();
    const cg = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, glowR);
    cg.addColorStop(0, `rgba(255,255,255,${0.9 * muzzleChargeT})`);
    cg.addColorStop(0.5, `rgba(180,220,255,${0.7 * muzzleChargeT})`);
    cg.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(muzzleX, muzzleY, glowR, 0, Math.PI * 2); ctx.fill();
    const t = frameCount * 0.1;
    for(let i = 0; i < 4; i++) {
      const a = t + (i / 4) * Math.PI * 2;
      const ar = glowR * (0.8 + 0.3 * Math.sin(t * 2 + i));
      ctx.beginPath();
      ctx.strokeStyle = `rgba(220,240,255,${0.6 * muzzleChargeT})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = "#88ccff"; ctx.shadowBlur = 6;
      for(let s = 0; s <= 6; s++) {
        const sa = a + (s / 6) * Math.PI * 0.5;
        const jitter = s > 0 && s < 6 ? Math.sin(s * 3.7 + t * 4 + i) * ar * 0.3 : 0;
        const r = ar + jitter;
        const px = muzzleX + Math.cos(sa) * r;
        const py = muzzleY + Math.sin(sa) * r;
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

// ─── ED-209 ground boss drawing ──────────────────────────────────
// x,y = position of feet on road. standAmt=0 crouched, 1=standing.
function drawED209Ground(x, y, squash, standAmt, hitFlash=0) {
  ctx.save();
  ctx.translate(x, y);
  const facing = gnd.edFacing || 1;
  ctx.scale(facing, 1);
  const sy = 1 - squash*0.16;
  const sx = 1 + squash*0.10;
  ctx.scale(sx, sy);

  // Shadow — unscale both facing and squash so it stays flat on road
  ctx.save(); ctx.scale(facing/sx, 1/sy);
  const shadowA = Math.max(0, 0.45*(1-(Math.max(0,gnd.edY-gnd.edTargetY)/280)));
  ctx.fillStyle=`rgba(0,0,0,${shadowA})`;
  ctx.beginPath(); ctx.ellipse(0,gnd.edTargetY-y+4,58+squash*18,8,0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  const torsoLift = standAmt * 48;

  // Back leg
  ctx.save(); ctx.globalAlpha=0.7;
  drawLegGround(20, standAmt, squash, hitFlash);
  ctx.restore();

  // Torso
  ctx.save();
  ctx.translate(0, -torsoLift);
  const hullG=ctx.createLinearGradient(-52,-130,52,0);
  hullG.addColorStop(0,"#585858"); hullG.addColorStop(0.45,"#3c3c3c"); hullG.addColorStop(1,"#222");
  ctx.fillStyle=hullG;
  ctx.beginPath();
  ctx.moveTo(-32,0); ctx.lineTo(44,0); ctx.lineTo(50,-38);
  ctx.lineTo(48,-110); ctx.lineTo(28,-130); ctx.lineTo(-18,-130);
  ctx.lineTo(-54,-95); ctx.lineTo(-46,-38); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#686868"; ctx.lineWidth=2; ctx.stroke();
  // Chest panel
  ctx.fillStyle="#1c1c1c";
  ctx.beginPath(); ctx.moveTo(-14,-50); ctx.lineTo(30,-50); ctx.lineTo(28,-100); ctx.lineTo(-12,-100); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#303030"; ctx.lineWidth=1; ctx.stroke();
  ctx.strokeStyle="#282828"; ctx.lineWidth=2;
  for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-12,-55-i*8); ctx.lineTo(27,-55-i*8); ctx.stroke(); }
  // Grate panel (facing side)
  ctx.fillStyle="#3c3c3c";
  ctx.beginPath();
  ctx.moveTo(-52,-80); ctx.lineTo(-33,-80); ctx.lineTo(-33,-39); ctx.lineTo(-45,-39);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#555"; ctx.lineWidth=2;
  for(let i=0;i<=5;i++){
    const gy=-80+(i/5)*41, glx=-52+(i/5)*7;
    ctx.beginPath(); ctx.moveTo(glx,gy); ctx.lineTo(-33,gy); ctx.stroke();
  }
  ctx.strokeStyle="#4a4a4a"; ctx.lineWidth=1.5;
  for(let i=1;i<3;i++){
    const gx=-52+(i/3)*19;
    ctx.beginPath(); ctx.moveTo(gx,-80); ctx.lineTo(gx,-39); ctx.stroke();
  }
  ctx.strokeStyle="#606060"; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(-52,-80); ctx.lineTo(-33,-80); ctx.lineTo(-33,-39); ctx.lineTo(-45,-39);
  ctx.closePath(); ctx.stroke();
  // Seams + rivets
  ctx.strokeStyle="rgba(100,100,100,0.4)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-44,-40); ctx.lineTo(48,-40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-50,-80); ctx.lineTo(46,-80); ctx.stroke();
  ctx.fillStyle="#555";
  [[-28,-36],[40,-36],[-42,-76],[42,-76]].forEach(([rx,ry])=>{
    ctx.beginPath(); ctx.arc(rx,ry,2.5,0,Math.PI*2); ctx.fill();
  });
  // Hip plates
  ctx.fillStyle="#2e2e2e";
  ctx.beginPath(); ctx.moveTo(-32,0); ctx.lineTo(-10,0); ctx.lineTo(-16,-36); ctx.lineTo(-46,-36); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#444"; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle="#2a2a2a";
  ctx.beginPath(); ctx.moveTo(44,0); ctx.lineTo(22,0); ctx.lineTo(26,-36); ctx.lineTo(50,-36); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#444"; ctx.lineWidth=1; ctx.stroke();
  // Head
  drawED209Head(standAmt, hitFlash);
  ctx.restore();

  // Front leg (drawn after torso)
  drawLegGround(-16, standAmt, squash, hitFlash);

  // Hit flash (white) or death flash (red) — torso shape
  const torsoFlashAlpha = hitFlash > 0 ? 0.5*(hitFlash/12) : gnd.edDeathFlash ? 0.6 : 0;
  const torsoFlashColor = hitFlash > 0 ? "#ffffff" : "#cc1111";
  if(torsoFlashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = torsoFlashAlpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = torsoFlashColor;
    const tl = standAmt * 48;
    ctx.beginPath();
    ctx.moveTo(-32,-tl); ctx.lineTo(44,-tl); ctx.lineTo(50,-38-tl);
    ctx.lineTo(48,-110-tl); ctx.lineTo(28,-130-tl); ctx.lineTo(-18,-130-tl);
    ctx.lineTo(-54,-95-tl); ctx.lineTo(-46,-38-tl); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}



function drawLegGround(offsetX, standAmt, squash, hitFlash=0) {
  ctx.save();
  ctx.translate(offsetX, 0);
  const torsoLift = standAmt * 48;
  const hipY = -(torsoLift + 8);
  const kneeYCrouch=-38, kneeYStand=-70-torsoLift*0.6;
  const kneeXCrouch=-4,  kneeXStand=2;
  const kx = kneeXCrouch+(kneeXStand-kneeXCrouch)*standAmt;
  const ky = kneeYCrouch+(kneeYStand-kneeYCrouch)*standAmt;
  const thighW=26, shinW=22;
  // Thigh
  const tdx=kx, tdy=ky-hipY, tLen=Math.sqrt(tdx*tdx+tdy*tdy);
  const tpx=-tdy/tLen, tpy=tdx/tLen;
  ctx.fillStyle="#363636";
  ctx.beginPath();
  ctx.moveTo(0+tpx*thighW*0.55,     hipY+tpy*thighW*0.55);
  ctx.lineTo(0-tpx*thighW*0.45,     hipY-tpy*thighW*0.45);
  ctx.lineTo(kx-tpx*thighW*0.4,     ky-tpy*thighW*0.4);
  ctx.lineTo(kx+tpx*thighW*0.6,     ky+tpy*thighW*0.6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#505050"; ctx.lineWidth=1.5; ctx.stroke();
  // Knee
  ctx.fillStyle="#444";
  ctx.beginPath(); ctx.arc(kx,ky,13,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#606060"; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle="#303030";
  ctx.beginPath(); ctx.arc(kx,ky,4.5,0,Math.PI*2); ctx.fill();
  // Shin
  const ankXCrouch=kx+26+squash*4, ankXStand=kx+14;
  const ax=ankXCrouch+(ankXStand-ankXCrouch)*standAmt, ay=-14;
  const sdx=ax-kx, sdy=ay-ky, sLen=Math.sqrt(sdx*sdx+sdy*sdy);
  const spx=-sdy/sLen, spy=sdx/sLen;
  ctx.fillStyle="#2e2e2e";
  ctx.beginPath();
  ctx.moveTo(kx+spx*shinW*0.55, ky+spy*shinW*0.55);
  ctx.lineTo(kx-spx*shinW*0.45, ky-spy*shinW*0.45);
  ctx.lineTo(ax-spx*shinW*0.35, ay-spy*shinW*0.35);
  ctx.lineTo(ax+spx*shinW*0.65, ay+spy*shinW*0.65);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#484848"; ctx.lineWidth=1.5; ctx.stroke();
  // Ankle
  ctx.fillStyle="#3a3a3a";
  ctx.beginPath(); ctx.arc(ax,ay,8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#555"; ctx.lineWidth=1.5; ctx.stroke();
  // Foot
  const fSplay=squash*6;
  ctx.fillStyle="#222";
  ctx.beginPath();
  ctx.moveTo(ax+16,ay+2); ctx.lineTo(ax+16,ay+15);
  ctx.lineTo(ax-38-fSplay,ay+15); ctx.lineTo(ax-42-fSplay,ay+7);
  ctx.lineTo(ax-38-fSplay,ay+2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#444"; ctx.lineWidth=1.5; ctx.stroke();
  // Hit flash (white) or death flash (red)
  const legFlashAlpha = hitFlash > 0 ? 0.5*(hitFlash/12) : gnd.edDeathFlash ? 0.6 : 0;
  const legFlashColor = hitFlash > 0 ? "#ffffff" : "#cc1111";
  if(legFlashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = legFlashAlpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = legFlashColor;
    ctx.beginPath();
    ctx.moveTo(0+tpx*thighW*0.55, hipY+tpy*thighW*0.55);
    ctx.lineTo(0-tpx*thighW*0.45, hipY-tpy*thighW*0.45);
    ctx.lineTo(kx-tpx*thighW*0.4, ky-tpy*thighW*0.4);
    ctx.lineTo(kx+tpx*thighW*0.6, ky+tpy*thighW*0.6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(kx,ky,13,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(kx+spx*shinW*0.55, ky+spy*shinW*0.55);
    ctx.lineTo(kx-spx*shinW*0.45, ky-spy*shinW*0.45);
    ctx.lineTo(ax-spx*shinW*0.35, ay-spy*shinW*0.35);
    ctx.lineTo(ax+spx*shinW*0.65, ay+spy*shinW*0.65);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(ax,ay,8,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ax+16,ay+2); ctx.lineTo(ax+16,ay+15);
    ctx.lineTo(ax-38-fSplay,ay+15); ctx.lineTo(ax-42-fSplay,ay+7);
    ctx.lineTo(ax-38-fSplay,ay+2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawED209Head(standAmt, hitFlash=0) {
  ctx.save();
  ctx.translate(-6,-136);
  ctx.rotate(0.14 - standAmt*0.08);
  const hW=58,hH=42;
  ctx.fillStyle="#2c2c2c"; ctx.fillRect(-10,hH-4,26,16);
  ctx.strokeStyle="#444"; ctx.lineWidth=1; ctx.stroke();
  const hG=ctx.createLinearGradient(-hW*0.4,0,hW*0.6,hH);
  hG.addColorStop(0,"#606060"); hG.addColorStop(0.5,"#444"); hG.addColorStop(1,"#2a2a2a");
  ctx.fillStyle=hG;
  ctx.beginPath();
  ctx.moveTo(-hW*0.38,6); ctx.lineTo(-hW*0.38,hH*0.2);
  ctx.lineTo(hW*0.62,hH); ctx.lineTo(hW*0.62,0);
  ctx.lineTo(hW*0.1,-8); ctx.lineTo(-hW*0.28,-2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#707070"; ctx.lineWidth=2; ctx.stroke();
  // Top ridge
  ctx.fillStyle="#505050";
  ctx.beginPath();
  ctx.moveTo(-hW*0.2,-2); ctx.lineTo(hW*0.55,-2);
  ctx.lineTo(hW*0.62,0); ctx.lineTo(hW*0.1,-8); ctx.lineTo(-hW*0.28,-2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#666"; ctx.lineWidth=1; ctx.stroke();
  // Antenna fin
  ctx.fillStyle="#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(hW*0.45,0); ctx.lineTo(hW*0.62,0);
  ctx.lineTo(hW*0.62,-18); ctx.lineTo(hW*0.50,-22);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#555"; ctx.lineWidth=1; ctx.stroke();
  // Visor
  const eyeY=hH*0.22,eyeH=12,eyeL=-hW*0.36,eyeR=hW*0.54;
  ctx.fillStyle="#0e0000"; ctx.fillRect(eyeL,eyeY,eyeR-eyeL,eyeH);
  const scan=0.5+Math.sin(frameCount*0.1)*0.5;
  const eG=ctx.createLinearGradient(eyeL,0,eyeR,0);
  eG.addColorStop(0,`rgba(255,20,20,${scan})`);
  eG.addColorStop(0.35,"rgba(200,0,0,0.5)");
  eG.addColorStop(1,"rgba(80,0,0,0.1)");
  ctx.fillStyle=eG; ctx.fillRect(eyeL,eyeY,eyeR-eyeL,eyeH);
  ctx.shadowColor="#ff0000"; ctx.shadowBlur=20*scan;
  ctx.fillStyle=`rgba(255,80,80,${scan})`;
  ctx.beginPath(); ctx.arc(eyeL+3,eyeY+eyeH/2,5,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle="rgba(80,80,80,0.7)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(eyeL,eyeY); ctx.lineTo(eyeR,eyeY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(eyeL,eyeY+eyeH); ctx.lineTo(eyeR,eyeY+eyeH); ctx.stroke();
  // Hit flash (white) or death flash (red)
  const headFlashAlpha = hitFlash > 0 ? 0.5*(hitFlash/12) : gnd.edDeathFlash ? 0.6 : 0;
  const headFlashColor = hitFlash > 0 ? "#ffffff" : "#cc1111";
  if(headFlashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = headFlashAlpha;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = headFlashColor;
    ctx.fillRect(-10,hH-4,26,16);
    ctx.beginPath();
    ctx.moveTo(-hW*0.38,6); ctx.lineTo(-hW*0.38,hH*0.2);
    ctx.lineTo(hW*0.62,hH); ctx.lineTo(hW*0.62,0);
    ctx.lineTo(hW*0.1,-8); ctx.lineTo(-hW*0.28,-2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-hW*0.2,-2); ctx.lineTo(hW*0.55,-2);
    ctx.lineTo(hW*0.62,0); ctx.lineTo(hW*0.1,-8); ctx.lineTo(-hW*0.28,-2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hW*0.45,0); ctx.lineTo(hW*0.62,0);
    ctx.lineTo(hW*0.62,-18); ctx.lineTo(hW*0.50,-22);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ── ED-209 Move 1: Rocket Lob ─────────────────────────────────────
function drawEdEnergyBall(b) {
  if(b.landed) return; // explosion already handled by particles
  ctx.save();
  ctx.globalAlpha = b.alpha;
  // Draw as rocket sprite — rotate to face direction of travel
  const angle = Math.atan2(b.vy, b.vx);
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);
  // Body
  ctx.fillStyle="#888888";
  ctx.fillRect(-14,-4,20,8);
  // Nose cone
  ctx.fillStyle="#cc4400";
  ctx.beginPath(); ctx.moveTo(6,-4); ctx.lineTo(14,0); ctx.lineTo(6,4); ctx.closePath(); ctx.fill();
  // Fins
  ctx.fillStyle="#666666";
  ctx.beginPath(); ctx.moveTo(-14,-4); ctx.lineTo(-10,-4); ctx.lineTo(-14,-10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-10, 4); ctx.lineTo(-14, 10); ctx.closePath(); ctx.fill();
  // Exhaust glow
  const flicker = 0.6+Math.sin(frameCount*0.3+b.lane)*0.4;
  ctx.shadowColor="#ff6600"; ctx.shadowBlur=8*flicker;
  ctx.fillStyle=`rgba(255,140,0,${flicker})`;
  ctx.beginPath(); ctx.ellipse(-14,0,5,3,0,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;
  ctx.restore();
}

function spawnDebrisExplosion(x, y, big) {
  const count = big ? 18 : 8;
  for(let i=0;i<count;i++){
    const spd = big ? 2+Math.random()*5 : 1+Math.random()*3;
    const ang = Math.random()*Math.PI*2;
    particles.push({
      x, y,
      vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - (big?1:0.5),
      life: 1, decay: big ? 0.025 : 0.04,
      r: big ? 5+Math.random()*7 : 2+Math.random()*4,
      color: Math.random()<0.5
        ? `rgba(255,${100+Math.floor(Math.random()*120)},0,0.9)`
        : `rgba(255,220,80,0.9)`,
      type:"circle",
    });
  }
  if(sfxEnabled) playTone(big?120:220, "sawtooth", big?0.4:0.2, 0.3, big?200:100);
}


function drawDebrisPiece(o) {
  if(o.exploding){
    const t=o.explodeTimer/20;
    ctx.save();
    ctx.globalAlpha=Math.max(0,1-t);
    const er=ctx.createRadialGradient(o.x+o.w/2,o.y+o.h/2,0,o.x+o.w/2,o.y+o.h/2,(o.big?60:30)*Math.max(0.05,t));
    er.addColorStop(0,"rgba(255,240,120,0.9)");
    er.addColorStop(0.5,"rgba(255,100,0,0.6)");
    er.addColorStop(1,"rgba(255,40,0,0)");
    ctx.fillStyle=er;
    ctx.beginPath(); ctx.arc(o.x+o.w/2,o.y+o.h/2,(o.big?60:30)*(t+0.1),0,Math.PI*2); ctx.fill();
    ctx.restore();
    return;
  }
  const flicker=0.6+Math.sin(o.firePhase)*0.4;
  ctx.save();
  ctx.translate(o.x+o.w/2, o.y+o.h/2);
  ctx.rotate(o.rot);
  const gr=ctx.createRadialGradient(0,0,2,0,0,o.w*0.9);
  gr.addColorStop(0,`rgba(255,180,40,${0.6*flicker})`);
  gr.addColorStop(0.5,`rgba(255,80,0,${0.3*flicker})`);
  gr.addColorStop(1,"rgba(255,40,0,0)");
  ctx.fillStyle=gr;
  ctx.beginPath(); ctx.ellipse(0,0,o.w*0.9,o.h*0.9,0,0,Math.PI*2); ctx.fill();
  const pts = o.shape || [[-0.4,-0.4],[0.4,-0.4],[0.4,0.4],[-0.4,0.4]];
  ctx.fillStyle=o.big?`rgb(${50+Math.floor(flicker*30)},30,10)`:`rgb(${90+Math.floor(flicker*40)},55,20)`;
  ctx.beginPath();
  pts.forEach((p,i)=>{ const x=p[0]*o.w, y=p[1]*o.h; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle=`rgba(255,${o.big?80:140},0,${0.8*flicker})`; ctx.lineWidth=o.big?2.5:1.5;
  ctx.beginPath();
  pts.forEach((p,i)=>{ const x=p[0]*o.w, y=p[1]*o.h; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.closePath(); ctx.stroke();
  ctx.strokeStyle=`rgba(255,200,60,${0.4*flicker})`; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-o.w*0.3,-o.h*0.4); ctx.lineTo(o.w*0.1,o.h*0.1); ctx.lineTo(-o.w*0.1,o.h*0.4); ctx.stroke();
  const fh=(o.big?22:10)*flicker;
  const ff=ctx.createLinearGradient(0,-o.h/2,0,-o.h/2-fh);
  ff.addColorStop(0,`rgba(255,${o.big?100:160},0,${0.8*flicker})`);
  ff.addColorStop(1,"rgba(255,80,0,0)");
  ctx.fillStyle=ff;
  for(let fi=-1;fi<=1;fi++){
    ctx.beginPath();
    ctx.moveTo(fi*o.w*0.25,-o.h/2);
    ctx.quadraticCurveTo(fi*o.w*0.1+Math.sin(o.firePhase+fi)*4,-o.h/2-fh*0.6,fi*o.w*0.05,-o.h/2-fh);
    ctx.quadraticCurveTo(fi*o.w*0.3,-o.h/2-fh*0.3,fi*o.w*0.4,-o.h/2);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if(!o.landed){
    const shadowY=o.landY+o.h/2+4;
    const dist=Math.max(0,shadowY-o.y);
    const sa=Math.max(0,1-dist/200)*0.4;
    ctx.fillStyle=`rgba(0,0,0,${sa})`;
    ctx.beginPath(); ctx.ellipse(o.x+o.w/2,shadowY,o.w*0.5,5,0,0,Math.PI*2); ctx.fill();
  }
  if(o.big && o.landed){
    const bx=o.x, by=o.y-12, bw=o.w;
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(bx,by,bw,5);
    ctx.fillStyle=`rgb(${255-Math.floor((o.hp/3)*80)},${Math.floor((o.hp/3)*200)},0)`;
    ctx.fillRect(bx,by,bw*(o.hp/3),5);
    ctx.fillStyle=`rgba(255,220,0,${0.7+Math.sin(frameCount*0.18)*0.3})`;
    ctx.font="bold 10px Boogaloo,cursive"; ctx.textAlign="center";
    ctx.fillText("SHOOT!",o.x+o.w/2,o.y-16);
  }
}

function drawGroundScene() {
  ctx.save();
  if(gnd.shake>0.5) ctx.translate((Math.random()-0.5)*gnd.shake,(Math.random()-0.5)*gnd.shake*0.4);

  const progress=gnd.distance/gnd.totalDist;

  if(gnd.level===2) {
    // ── Level 2: fixed narrative background ──────────────────────
    const p = progress;
    const seg = (a,b) => Math.max(0, Math.min(1, (p-a)/(b-a)));
    const firePhase  = 1 - seg(0, 0.2);
    const clearPhase = seg(0.2, 0.6);
    const skyPhase   = seg(0.3, 0.7);
    const dayPhase   = seg(0.5, 1.0);

    const r  = Math.floor(20 + firePhase*50 + dayPhase*50);
    const g  = Math.floor(10 + firePhase*8  + skyPhase*130 + dayPhase*30);
    const b  = Math.floor(20 + firePhase*5  + skyPhase*190 + dayPhase*30);
    const r2 = Math.floor(35 + firePhase*60 + dayPhase*80);
    const g2 = Math.floor(15 + firePhase*12 + skyPhase*160 + dayPhase*30);
    const b2 = Math.floor(15 + firePhase*5  + skyPhase*200 + dayPhase*30);
    const skyGrad = ctx.createLinearGradient(0,0,0,ROAD_Y);
    skyGrad.addColorStop(0, `rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`);
    skyGrad.addColorStop(1, `rgb(${Math.min(255,r2)},${Math.min(255,g2)},${Math.min(255,b2)})`);
    ctx.fillStyle=skyGrad; ctx.fillRect(0,0,GAME_W,ROAD_Y);

    if(firePhase > 0) {
      ctx.fillStyle=`rgba(30,15,8,${firePhase*0.35})`;
      ctx.fillRect(0,0,GAME_W,ROAD_Y);
    }
    if(skyPhase > 0) {
      const sg2 = ctx.createLinearGradient(0,0,0,ROAD_Y*0.5);
      sg2.addColorStop(0,`rgba(255,240,180,${skyPhase*0.25})`);
      sg2.addColorStop(1,"rgba(100,180,255,0)");
      ctx.fillStyle=sg2; ctx.fillRect(0,0,GAME_W,ROAD_Y*0.5);
    }
    if(dayPhase > 0) {
      const hz = ctx.createLinearGradient(0,ROAD_Y*0.7,0,ROAD_Y);
      hz.addColorStop(0,"rgba(255,200,100,0)");
      hz.addColorStop(1,`rgba(255,180,80,${dayPhase*0.12})`);
      ctx.fillStyle=hz; ctx.fillRect(0,ROAD_Y*0.7,GAME_W,ROAD_Y*0.3);
    }
    const mPhase = seg(0.6, 0.85);
    if(mPhase > 0) {
      const mScrollX = gnd.scrollX * 0.06;
      const peaks = [{ox:GAME_W+400,w:220,h:110},{ox:GAME_W+180,w:280,h:140},{ox:GAME_W+600,w:240,h:100},{ox:GAME_W+50,w:200,h:120}];
      peaks.forEach((pk,i)=>{
        const px=pk.ox-mScrollX;
        const mg=ctx.createLinearGradient(px+pk.w/2,ROAD_Y-pk.h,px+pk.w/2,ROAD_Y);
        mg.addColorStop(0,`rgba(${80+i*8},${100+i*10},${130+i*12},${mPhase*0.75})`);
        mg.addColorStop(0.6,`rgba(${60+i*6},${80+i*8},${110+i*10},${mPhase*0.55})`);
        mg.addColorStop(1,`rgba(${50+i*5},${65+i*6},${90+i*8},${mPhase*0.35})`);
        ctx.fillStyle=mg;
        ctx.beginPath();
        ctx.moveTo(px,ROAD_Y); ctx.lineTo(px+pk.w*0.15,ROAD_Y-pk.h*0.4);
        ctx.lineTo(px+pk.w*0.38,ROAD_Y-pk.h*0.85); ctx.lineTo(px+pk.w*0.5,ROAD_Y-pk.h);
        ctx.lineTo(px+pk.w*0.62,ROAD_Y-pk.h*0.88); ctx.lineTo(px+pk.w*0.78,ROAD_Y-pk.h*0.5);
        ctx.lineTo(px+pk.w,ROAD_Y); ctx.closePath(); ctx.fill();
        if(pk.h>115&&mPhase>0.3){
          ctx.fillStyle=`rgba(240,245,255,${mPhase*0.5})`;
          ctx.beginPath(); ctx.moveTo(px+pk.w*0.42,ROAD_Y-pk.h*0.78);
          ctx.lineTo(px+pk.w*0.5,ROAD_Y-pk.h); ctx.lineTo(px+pk.w*0.58,ROAD_Y-pk.h*0.8);
          ctx.closePath(); ctx.fill();
        }
      });
    }

  } else {
  // Sky gradient — orange/red ruins
  const sg=ctx.createLinearGradient(0,0,0,ROAD_Y);
  sg.addColorStop(0,"#1a0505"); sg.addColorStop(0.6,"#3a0a00"); sg.addColorStop(1,"#551500");
  ctx.fillStyle=sg; ctx.fillRect(0,0,GAME_W,ROAD_Y);

  // Background smoke haze
  ctx.fillStyle="rgba(40,20,10,0.18)"; ctx.fillRect(0,0,GAME_W,ROAD_Y);

  // Fire columns rising into sky from ground level
  gnd.fireColumns.forEach(c=>{
    const flicker=0.7+Math.sin(frameCount*0.18+c.phase)*0.3;
    const baseY=ROAD_Y-10;
    const topY=baseY-c.h*flicker;
    // Outer glow (wide, low opacity)
    const og=ctx.createLinearGradient(c.x,topY-30,c.x,baseY);
    og.addColorStop(0,"rgba(255,80,0,0)");
    og.addColorStop(0.5,`rgba(255,100,0,${0.07*flicker})`);
    og.addColorStop(1,`rgba(255,140,0,${0.18*flicker})`);
    ctx.fillStyle=og; ctx.fillRect(c.x-c.w*0.6,topY-30,c.w*2.2,baseY-topY+30);
    // Core flame
    const fg=ctx.createLinearGradient(c.x,topY,c.x,baseY);
    fg.addColorStop(0,"rgba(255,220,80,0)");
    fg.addColorStop(0.35,`rgba(255,140,0,${0.55*flicker})`);
    fg.addColorStop(1,`rgba(255,60,0,${0.75*flicker})`);
    ctx.fillStyle=fg;
    ctx.beginPath();
    ctx.moveTo(c.x,baseY);
    ctx.bezierCurveTo(c.x-c.w*0.5,baseY-c.h*0.4*flicker, c.x-c.w*0.2,topY+c.h*0.1, c.x,topY);
    ctx.bezierCurveTo(c.x+c.w*0.2,topY+c.h*0.1, c.x+c.w*0.5,baseY-c.h*0.4*flicker, c.x+c.w,baseY);
    ctx.closePath(); ctx.fill();
  });
  } // end level branch

  // Burning debris falling through sky (glowing chunks)
  gnd.burnDebris.forEach(d=>{
    const fireScale = gnd.level===2 ? Math.max(0, 1 - progress*(1/0.2)) : 1;
    if(fireScale < 0.02) return;
    const glow=(0.6+Math.sin(d.firePhase)*0.4);
    ctx.save();
    ctx.globalAlpha = fireScale;
    ctx.translate(d.x+d.w/2, d.y+d.h/2);
    ctx.rotate(d.rot);
    // Ember glow halo
    const eg=ctx.createRadialGradient(0,0,2,0,0,d.w*0.9);
    eg.addColorStop(0,`rgba(255,200,50,${0.55*glow})`);
    eg.addColorStop(0.5,`rgba(255,80,0,${0.3*glow})`);
    eg.addColorStop(1,"rgba(255,40,0,0)");
    ctx.fillStyle=eg; ctx.beginPath(); ctx.ellipse(0,0,d.w*0.9,d.h*0.9,0,0,Math.PI*2); ctx.fill();
    // Debris chunk
    ctx.fillStyle=`rgb(${60+Math.floor(glow*40)},${30+Math.floor(glow*20)},10)`;
    ctx.fillRect(-d.w/2,-d.h/2,d.w,d.h);
    // Hot edge
    ctx.strokeStyle=`rgba(255,${120+Math.floor(glow*100)},0,${0.7*glow})`;
    ctx.lineWidth=1.5; ctx.strokeRect(-d.w/2,-d.h/2,d.w,d.h);
    // Tiny fire trail upward
    const tf=ctx.createLinearGradient(0,-d.h/2,0,-d.h/2-18);
    tf.addColorStop(0,`rgba(255,140,0,${0.5*glow})`);
    tf.addColorStop(1,"rgba(255,80,0,0)");
    ctx.fillStyle=tf; ctx.fillRect(-d.w*0.25,-d.h/2-18,d.w*0.5,18);
    ctx.restore();
  });

  // Background buildings (far, slow scroll)
  gnd.buildings.forEach(b=>{
    const by=ROAD_Y-b.h;
    // Level 2: buildings (both types) fade out as progress increases — trees take over
    const buildingAlpha = gnd.level===2 ? Math.max(0, 1 - progress*(1/0.4)) : 1;
    if(buildingAlpha < 0.02) return;
    ctx.save();
    ctx.globalAlpha = buildingAlpha;
    if(b.destroyed){
      // Jagged ruined top — no smoke column above
      ctx.fillStyle="#1a1008";
      ctx.beginPath();
      ctx.moveTo(b.x,ROAD_Y); ctx.lineTo(b.x,by+b.h*0.5);
      ctx.lineTo(b.x+b.w*0.25,by+b.h*0.35); ctx.lineTo(b.x+b.w*0.5,by+b.h*0.55);
      ctx.lineTo(b.x+b.w*0.75,by+b.h*0.3); ctx.lineTo(b.x+b.w,by+b.h*0.5);
      ctx.lineTo(b.x+b.w,ROAD_Y); ctx.closePath(); ctx.fill();
      // Fire glow only (no tall smoke column)
      const fireScale2 = gnd.level===2 ? 0 : 1;
      const fg=0.2+Math.sin(frameCount*0.12+b.fireOffset)*0.12;
      if(fireScale2 > 0.02) {
        ctx.fillStyle=`rgba(255,80,0,${fg*0.5*fireScale2})`; ctx.fillRect(b.x,by+b.h*0.3,b.w,b.h*0.7);
        // Short smoke puff — just above the building, not full height
        const sm=0.15+Math.sin(frameCount*0.025+b.fireOffset)*0.05;
        ctx.fillStyle=`rgba(30,20,10,${sm*fireScale2})`;
        ctx.fillRect(b.x+b.w*0.1, by-20, b.w*0.8, 20);
      }
    } else {
      ctx.fillStyle="#111";
      ctx.fillRect(b.x,by,b.w,b.h);
      ctx.fillStyle="rgba(255,200,80,0.2)";
      for(let wy=by+6;wy<ROAD_Y-8;wy+=10) for(let wx=b.x+4;wx<b.x+b.w-6;wx+=9) ctx.fillRect(wx,wy,5,5);
    }
    ctx.restore();
  });

  // Forest — level 2 only, clusters of trees + bushes
  if(gnd.level===2 && gnd.trees) {
    gnd.trees.forEach(t=>{
      const by = ROAD_Y - t.h;
      const v = t.variant;
      if(t.type==="bush") {
        // Low bush — rounded cluster at ground level
        const g1=`rgb(${25+v*6},${80+v*10},${20+v*4})`;
        const g2=`rgb(${18+v*4},${60+v*8},${14+v*3})`;
        ctx.fillStyle=g2;
        ctx.beginPath(); ctx.ellipse(t.x+t.w/2, ROAD_Y-8, t.w*0.55, t.h*0.6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle=g1;
        ctx.beginPath(); ctx.ellipse(t.x+t.w/2-t.w*0.15, ROAD_Y-10, t.w*0.4, t.h*0.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(t.x+t.w/2+t.w*0.18, ROAD_Y-9, t.w*0.38, t.h*0.45, 0, 0, Math.PI*2); ctx.fill();
      } else if(t.type==="tall") {
        // Tall tree — trunk + full canopy
        ctx.fillStyle="#3a2510";
        ctx.fillRect(t.x+t.w*0.38, by+t.h*0.45, t.w*0.24, t.h*0.55);
        const g1=`rgb(${22+v*7},${90+v*14},${18+v*4})`;
        const g2=`rgb(${15+v*5},${68+v*10},${12+v*3})`;
        // Main canopy
        ctx.fillStyle=g2;
        ctx.beginPath(); ctx.arc(t.x+t.w/2, by+t.h*0.32, t.w*0.52, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle=g1;
        ctx.beginPath(); ctx.arc(t.x+t.w/2-t.w*0.12, by+t.h*0.22, t.w*0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(t.x+t.w/2+t.w*0.14, by+t.h*0.26, t.w*0.37, 0, Math.PI*2); ctx.fill();
        // Undergrowth at base
        ctx.fillStyle=g2;
        ctx.beginPath(); ctx.ellipse(t.x+t.w/2, ROAD_Y-6, t.w*0.45, 10, 0, 0, Math.PI*2); ctx.fill();
      } else {
        // Mid tree
        ctx.fillStyle="#3d2812";
        ctx.fillRect(t.x+t.w*0.4, by+t.h*0.5, t.w*0.2, t.h*0.5);
        const g1=`rgb(${28+v*8},${95+v*12},${22+v*5})`;
        const g2=`rgb(${18+v*5},${72+v*9},${16+v*3})`;
        ctx.fillStyle=g2;
        ctx.beginPath(); ctx.arc(t.x+t.w/2, by+t.h*0.38, t.w*0.46, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle=g1;
        ctx.beginPath(); ctx.arc(t.x+t.w/2-t.w*0.1, by+t.h*0.28, t.w*0.36, 0, Math.PI*2); ctx.fill();
      }
    });
  }

  // Ground glow — fades on level 2, gone once trees appear
  const groundGlowScale = gnd.level===2 ? Math.max(0, 1 - progress*(1/0.2)) : 1;
  if(groundGlowScale > 0.02) {
    const gf=0.12+Math.sin(frameCount*0.07)*0.05;
    ctx.fillStyle=`rgba(255,50,0,${gf*groundGlowScale})`; ctx.fillRect(0,ROAD_Y-10,GAME_W,30);
  }

  // Road — dusty cracked surface
  const rg=ctx.createLinearGradient(0,ROAD_Y,0,GAME_H);
  rg.addColorStop(0,"#5a4a38"); rg.addColorStop(0.3,"#4a3d2e"); rg.addColorStop(1,"#3a3028");
  ctx.fillStyle=rg; ctx.fillRect(0,ROAD_Y,GAME_W,GAME_H-ROAD_Y);
  // Grit/dust overlay — scattered lighter patches
  ctx.fillStyle="rgba(180,155,100,0.06)"; ctx.fillRect(0,ROAD_Y,GAME_W,GAME_H-ROAD_Y);
  // Road edge kerb
  ctx.fillStyle="#6a5540"; ctx.fillRect(0,ROAD_Y,GAME_W,5);
  // Dust drifts — subtle horizontal bands
  ctx.fillStyle="rgba(200,170,110,0.04)"; ctx.fillRect(0,ROAD_Y+20,GAME_W,18);
  ctx.fillStyle="rgba(200,170,110,0.04)"; ctx.fillRect(0,ROAD_Y+60,GAME_W,12);

  // Road markings
  const dashOffset=(gnd.scrollX*1.2)%80;
  ctx.fillStyle="rgba(200,200,200,0.25)";
  for(let x=-dashOffset;x<GAME_W+80;x+=80) ctx.fillRect(x,ROAD_Y+GAME_H*0.15,40,4);

  // Rubble on road
  gnd.rubble.forEach(r=>{
    ctx.fillStyle="#555544"; ctx.fillRect(r.x,r.y,r.w,r.h);
  });

  // Craters — hidden during tunnel enter/fade
  if(gnd.phase!=="tunnel_enter" && gnd.phase!=="fade" && gnd.level!==2) {
  gnd.obstacles.filter(o=>o.type==="crater").forEach(o=>{
    ctx.fillStyle="#222"; ctx.fillRect(o.x,o.y,o.w,o.h);
    ctx.strokeStyle="#444"; ctx.lineWidth=1; ctx.strokeRect(o.x,o.y,o.w,o.h);
  });
  }

  // Debris behind jeep — y above jeep (further away, draw first)
  const jeepCY = gnd.jeepY - JEEP_H;
  gnd.obstacles.filter(o=>o.type==="debris" && (o.y+o.h/2) < jeepCY).forEach(drawDebrisPiece);
  // (debris drawn in two passes around the jeep — see below)


  // ── Gauntlet debris piles (perspective-scaled, right side of road) ──
  const inTunnelPhase = gnd.phase==="tunnel_approach"||gnd.phase==="tunnel_gauntlet"||gnd.phase==="tunnel_enter"||gnd.phase==="fade";
  if(inTunnelPhase && gnd.blockages) {
    const reveal = Math.min(1, gnd.tunnelReveal||1);

    gnd.blockages.forEach((blk, i) => {
      if(blk.hp<=0) return;
      const f = 0.6+Math.sin(blk.firePhase)*0.4;
      const hpR = blk.hp/3;

      const bw = blk.bw;
      const bh = blk.bh;
      const bx = GAME_W - bw - (blk.xOffset||0) - 30 + (1-reveal)*140;
      const by = blk.y;
      const cx = bx + bw/2, cy = by + bh/2;

      ctx.save();
      ctx.translate(cx, cy);

      // Glow halo
      const gr = ctx.createRadialGradient(0,0,2,0,0,bw*0.9);
      gr.addColorStop(0,`rgba(255,180,40,${0.6*f})`);
      gr.addColorStop(0.5,`rgba(255,80,0,${0.3*f})`);
      gr.addColorStop(1,"rgba(255,40,0,0)");
      ctx.fillStyle=gr;
      ctx.beginPath(); ctx.ellipse(0,0,bw*0.9,bh*0.9,0,0,Math.PI*2); ctx.fill();

      // Boulder polygon
      const pts = blk.shape || [[-0.4,-0.4],[0.4,-0.4],[0.4,0.4],[-0.4,0.4]];
      ctx.fillStyle=`rgb(${50+Math.floor(f*30)},30,10)`;
      ctx.beginPath();
      pts.forEach((p,pi)=>{ const x=p[0]*bw,y=p[1]*bh; pi===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
      ctx.closePath(); ctx.fill();

      // Hot cracked edges
      ctx.strokeStyle=`rgba(255,80,0,${0.8*f})`; ctx.lineWidth=2.5;
      ctx.beginPath();
      pts.forEach((p,pi)=>{ const x=p[0]*bw,y=p[1]*bh; pi===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
      ctx.closePath(); ctx.stroke();
      ctx.strokeStyle=`rgba(255,200,60,${0.4*f})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-bw*0.3,-bh*0.4); ctx.lineTo(bw*0.1,bh*0.1); ctx.lineTo(-bw*0.1,bh*0.4); ctx.stroke();

      // Fire tongues
      const fh = 22*f;
      const ff = ctx.createLinearGradient(0,-bh/2,0,-bh/2-fh);
      ff.addColorStop(0,`rgba(255,100,0,${0.8*f})`); ff.addColorStop(1,"rgba(255,80,0,0)");
      ctx.fillStyle=ff;
      for(let fi=-1;fi<=1;fi++){
        ctx.beginPath();
        ctx.moveTo(fi*bw*0.25,-bh/2);
        ctx.quadraticCurveTo(fi*bw*0.1+Math.sin(blk.firePhase+fi)*4,-bh/2-fh*0.6,fi*bw*0.05,-bh/2-fh);
        ctx.quadraticCurveTo(fi*bw*0.3,-bh/2-fh*0.3,fi*bw*0.4,-bh/2);
        ctx.closePath(); ctx.fill();
      }

      ctx.restore();

      // HP bar hidden (logic still active)
    });

    // Prompt
    if(gnd.phase==="tunnel_gauntlet") {
      const pulse=0.7+Math.sin(frameCount*0.15)*0.3;
      ctx.fillStyle=`rgba(255,220,0,${pulse})`;
      ctx.font="bold 16px Boogaloo,cursive"; ctx.textAlign="center";
      ctx.fillText("CLEAR THE ROAD!", GAME_W/2, ROAD_Y-20);
    }
  }

  // ── Rocket draw hook — missiles with targetY < jeepY draw here (behind jeep) ──
  if(gnd.rocketDrawHook) gnd.rocketDrawHook();

  // ── Armoured Jeep ──
  const jx=gnd.jeepX;
  const jy=gnd.jeepY - JEEP_H + (gnd.bumpY||0);
  const hit=gnd.hitTimer>0&&Math.floor(frameCount/4)%2===0;

  ctx.save();
  ctx.translate(jx, jy);

  // Wheels
  const wheelY=JEEP_H-8;
  [20,JEEP_W-20].forEach(wx=>{
    const spin=(gnd.speed > 0.1 ? gnd.scrollX/15 : frameCount*0.2)%(Math.PI*2);
    ctx.fillStyle=hit?"#ff4444":"#222"; ctx.beginPath(); ctx.arc(wx,wheelY,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#555"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(wx,wheelY,12,0,Math.PI*2); ctx.stroke();
    // Spokes
    ctx.strokeStyle="#666"; ctx.lineWidth=2;
    for(let i=0;i<4;i++){
      const a=spin+i*Math.PI/2;
      ctx.beginPath(); ctx.moveTo(wx,wheelY); ctx.lineTo(wx+Math.cos(a)*10,wheelY+Math.sin(a)*10); ctx.stroke();
    }
    ctx.fillStyle="#444"; ctx.beginPath(); ctx.arc(wx,wheelY,4,0,Math.PI*2); ctx.fill();
  });

  // Body
  ctx.fillStyle=hit?"#885533":"#4a6630";
  ctx.fillRect(0,JEEP_H-26,JEEP_W,20);
  ctx.fillStyle=hit?"#aa6644":"#3d5528";
  ctx.fillRect(12,JEEP_H-46,JEEP_W-22,24);

  // Windshield
  ctx.fillStyle="rgba(150,220,255,0.3)"; ctx.fillRect(JEEP_W-30,JEEP_H-44,18,18);
  ctx.strokeStyle="#555"; ctx.lineWidth=1; ctx.strokeRect(JEEP_W-30,JEEP_H-44,18,18);

  // Armour plates
  ctx.fillStyle="#3a4f22";
  ctx.fillRect(0,JEEP_H-30,8,20); ctx.fillRect(JEEP_W-8,JEEP_H-30,8,20);

  ctx.restore(); // jeep translate

  // Debris in front of jeep — y below jeep (closer, draw after jeep)
  gnd.obstacles.filter(o=>o.type==="debris" && (o.y+o.h/2) >= jeepCY).forEach(drawDebrisPiece);

  ctx.restore(); // shake restore
}
