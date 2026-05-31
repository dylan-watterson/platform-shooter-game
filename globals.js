// ─── globals.js — canvas, ctx, and shared game state ──────────

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = GAME_W; canvas.height = GAME_H;

// Game state
let state = "start";
let paused = false;
let pauseIndex = 0;
let score = 0, lives = 5, waveNum = 1, frameCount = 0, animFrame;
let sfxEnabled = true;
let menuIndex = 0;
let menuCooldown = 0;
let debugOpen = false;
let debugIndex = 0;
let debugMode = false;

// Game objects
let bullets = [], enemyBullets = [], enemies = [], particles = [], clouds = [];
let enemyDir = -1, enemySpeed = 1, enemyVDir = 1;
let bossDyingTimer = 0, bossDyingX = 0, bossDyingY = 0;
let escapeAnim = { phase:0, timer:0, playerVX:0, playerVY:0 };
let wave4Intro = { timer:0 };
let playerSpeedBoosted = false;
let powerup = { x:0, y:0, active:false, collected:false, timer:0 };

// Audio
let audioCtx = null;

// Tunnel state
let tunnel = {
  walls: [], scrollX: 0, speed: 4, wallsSpawned: 0, wallsTotal: 20,
  spawnTimer: 0, countdownTimer: 150, playerHitTimer: 0,
  powerup: { x:0, y:0, active:false, collected:false },
  exitWall: { active:false, x:0, hp:0, maxHp:30, segments:[] },
};

// Laser cannon state
let cannon = {
  active: false, dead: false, hp: 20, maxHp: 20, posIdx: 2,
  y: 0, targetY: 0, cstate: "moving", stateTimer: 0, laserY: 0, laserAlpha: 0,
};

// Player object
const player = {
  x:80, y:200, w:70, h:36,
  speed:4.5, invincible:0,
  shootCooldown:0, propAngle:0, bobAngle:0,
};
