// ─── Constants ────────────────────────────────────────────────
const GAME_W = 800, GAME_H = 450;
const PLAYER_BASE_SPEED = 4.5;
const CANNON_POSITIONS = [0,1,2,3,4].map(i => 55 + i * ((GAME_H-110)/4));
const ABSORBER_Y = [0,1,2,3,4].map(i => 55 + i * ((GAME_H-110)/4));

// Ground level constants
const ROAD_Y = 300;
const JEEP_H = 44;
const JEEP_W = 90;
const L1_Y = 325;
const L2_Y = 400;
const L3_Y = 364;
