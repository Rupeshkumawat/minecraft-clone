import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world/World.js';
import { BLOCKS, BY_ID } from './world/blocks.js';
import { EntityManager } from './world/Entities.js';
import { CHUNK_HEIGHT } from './world/Chunk.js';
import { initAudio, playBreakSound, playPlaceSound, playZombieSound } from './world/sounds.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.FogExp2(0xaaccff, 0.01);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const sun = new THREE.DirectionalLight(0xfff5e6, 2.0);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 300;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.bias = -0.0005;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// UI: Damage Flash
const damageOverlay = document.createElement('div');
damageOverlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,0,0,0); pointer-events:none; transition: background 0.1s;';
document.body.appendChild(damageOverlay);

// UI: Health
let playerHealth = 100;
const healthUI = document.createElement('div');
healthUI.style.cssText = 'position:absolute; top:20px; left:20px; font-family:monospace; font-size:24px; color:red; text-shadow: 2px 2px 0px black;';
healthUI.innerText = '❤️❤️❤️❤️❤️';
document.body.appendChild(healthUI);

// UI: Crosshair
const crosshair = document.createElement('div');
crosshair.style.cssText = 'position:absolute; top:50%; left:50%; width:20px; height:20px; transform:translate(-50%,-50%); pointer-events:none; font-size:20px; color:white; text-align:center; line-height:20px; font-family:monospace; text-shadow: 1px 1px 2px black;';
crosshair.innerText = '+';
document.body.appendChild(crosshair);

// UI: Hotbar
const hotbar = document.createElement('div');
hotbar.style.cssText = 'position:absolute; bottom:20px; left:50%; transform:translateX(-50%); display:flex; gap:5px; background:rgba(0,0,0,0.6); padding:5px; border-radius:5px;';
const blockOptions = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.SAND, BLOCKS.WOOD, BLOCKS.LEAVES];
const slots = [];
blockOptions.forEach((block, index) => {
  const slot = document.createElement('div');
  slot.style.cssText = `width:40px; height:40px; border:2px solid ${index === 0 ? 'white' : 'gray'}; background:gray; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-family:monospace; font-weight:bold; text-shadow:1px 1px 1px black;`;
  slot.innerText = block.name.toUpperCase();
  hotbar.appendChild(slot);
  slots.push(slot);
});
document.body.appendChild(hotbar);

function updateHotbarUI(selectedIndex) {
  slots.forEach((slot, i) => {
    slot.style.border = i === selectedIndex ? '2px solid white' : '2px solid gray';
  });
}

const world = new World(scene, 12345);
const entityManager = new EntityManager(scene, world);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => { 
  if (!controls.isLocked) {
    controls.lock(); 
    initAudio(); 
  }
});

const player = {
  pos: new THREE.Vector3(32, 50, 32),
  vel: new THREE.Vector3(0, 0, 0),
  onGround: false,
  width: 0.6,
  height: 1.8,
};

world.loadChunk(Math.floor(player.pos.x / 16), Math.floor(player.pos.z / 16));
let spawnY = CHUNK_HEIGHT - 1; 
while (spawnY > 0) {
  const block = world.getBlock(32, spawnY, 32);
  if (block !== BLOCKS.AIR.id && block !== BLOCKS.WATER.id && block !== BLOCKS.LEAVES.id) break;
  spawnY--;
}
player.pos.y = spawnY + 3; 
controls.object.position.copy(player.pos);

const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

function isSolid(wx, wy, wz) {
  const id = world.getBlock(wx, wy, wz);
  return BY_ID[id] && BY_ID[id].solid;
}

const raycaster = new THREE.Raycaster();
raycaster.far = 6;
let currentBlock = BLOCKS.STONE.id;
let selectedIndex = 2;
updateHotbarUI(selectedIndex);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Digit1') { currentBlock = BLOCKS.GRASS.id; updateHotbarUI(0); }
  if (e.code === 'Digit2') { currentBlock = BLOCKS.DIRT.id; updateHotbarUI(1); }
  if (e.code === 'Digit3') { currentBlock = BLOCKS.STONE.id; updateHotbarUI(2); }
  if (e.code === 'Digit4') { currentBlock = BLOCKS.SAND.id; updateHotbarUI(3); }
  if (e.code === 'Digit5') { currentBlock = BLOCKS.WOOD.id; updateHotbarUI(4); }
  if (e.code === 'Digit6') { currentBlock = BLOCKS.LEAVES.id; updateHotbarUI(5); }
});

// Handle player taking damage
window.addEventListener('playerHurt', (e) => {
  playerHealth -= e.detail;
  healthUI.innerText = '❤️'.repeat(Math.max(0, Math.ceil(playerHealth / 20)));
  damageOverlay.style.background = 'rgba(255,0,0,0.4)';
  setTimeout(() => { damageOverlay.style.background = 'rgba(255,0,0,0)'; }, 200);

  if (playerHealth <= 0) {
    alert("You died! Respawning...");
    playerHealth = 100;
    healthUI.innerText = '❤️❤️❤️❤️❤️';
    player.pos.set(32, 50, 32);
    world.loadChunk(Math.floor(player.pos.x / 16), Math.floor(player.pos.z / 16));
    let sy = CHUNK_HEIGHT - 1; 
    while (sy > 0 && world.getBlock(32, sy, 32) === BLOCKS.AIR.id) sy--;
    player.pos.y = sy + 3;
    controls.object.position.copy(player.pos);
  }
});

window.addEventListener('mousedown', (e) => {
  if (!controls.isLocked) return;
  
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  
  // 1. Check Animals / Zombies
  const entityHits = raycaster.intersectObjects(entityManager.entities.map(e => e.mesh), true);
  if (entityHits.length > 0 && e.button === 0) {
    let hitObj = entityHits[0].object;
    while (hitObj.parent && !entityManager.entities.find(e => e.mesh === hitObj)) {
      hitObj = hitObj.parent;
    }
    const entIndex = entityManager.entities.findIndex(e => e.mesh === hitObj);
    if (entIndex !== -1) {
      const ent = entityManager.entities[entIndex];
      
      if (ent.type === 'zombie') {
        ent.interact(); // Zombie plays sound and flashes
        if (ent.damage(5)) { // Takes 2 hits to kill
          entityManager.removeEntity(entIndex);
        }
      } else {
        ent.interact();
      }
      return;
    }
  }

  // 2. Check Blocks
  raycaster.far = 6;
  const step = 0.1;
  let hit = null;
  for (let t = 0; t < raycaster.far; t += step) {
    const p = raycaster.ray.at(t, new THREE.Vector3());
    const bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
    if (isSolid(bx, by, bz)) {
      hit = { x: bx, y: by, z: bz };
      break;
    }
  }

  if (!hit) return;

  if (e.button === 0) {
    world.setBlock(hit.x, hit.y, hit.z, BLOCKS.AIR.id);
    playBreakSound();
  } else if (e.button === 2) {
    const dir = raycaster.ray.direction;
    const bx = hit.x - Math.round(dir.x);
    const by = hit.y - Math.round(dir.y);
    const bz = hit.z - Math.round(dir.z);
    if (!isSolid(bx, by, bz)) {
      world.setBlock(bx, by, bz, currentBlock);
      playPlaceSound();
    }
  }
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

const clock = new THREE.Clock();
const gravity = -25;
const jumpSpeed = 8;
const walkSpeed = 5;
let timeOfDay = 0; 

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  world.update(player.pos);

  // Determine if it's night for zombie spawning
  const sunAngle = timeOfDay * Math.PI * 2;
  const sunHeight = Math.sin(sunAngle - Math.PI/2);
  const isNight = sunHeight < -0.2;

  entityManager.update(dt, player.pos, isNight);

  if (controls.isLocked) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0, moveZ = 0;
    if (keys['KeyW']) { moveX += forward.x; moveZ += forward.z; }
    if (keys['KeyS']) { moveX -= forward.x; moveZ -= forward.z; }
    if (keys['KeyD']) { moveX += right.x;   moveZ += right.z; }
    if (keys['KeyA']) { moveX -= right.x;   moveZ -= right.z; }
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    player.vel.x = moveX * walkSpeed;
    player.vel.z = moveZ * walkSpeed;
    player.vel.y += gravity * dt;

    player.pos.x += player.vel.x * dt;
    for (let y = 0; y < player.height; y += 0.5) {
      for (let z = -player.width/2; z <= player.width/2; z += player.width) {
        if (isSolid(Math.floor(player.pos.x + Math.sign(player.vel.x)*player.width/2), Math.floor(player.pos.y + y), Math.floor(player.pos.z + z))) {
          player.pos.x -= player.vel.x * dt;
          player.vel.x = 0;
          break;
        }
      }
    }

    player.pos.z += player.vel.z * dt;
    for (let y = 0; y < player.height; y += 0.5) {
      for (let x = -player.width/2; x <= player.width/2; x += player.width) {
        if (isSolid(Math.floor(player.pos.x + x), Math.floor(player.pos.y + y), Math.floor(player.pos.z + Math.sign(player.vel.z)*player.width/2))) {
          player.pos.z -= player.vel.z * dt;
          player.vel.z = 0;
          break;
        }
      }
    }

    player.onGround = false;
    player.pos.y += player.vel.y * dt;
    for (let x = -player.width/2; x <= player.width/2; x += player.width) {
      for (let z = -player.width/2; z <= player.width/2; z += player.width) {
        if (isSolid(Math.floor(player.pos.x + x), Math.floor(player.pos.y + (player.vel.y < 0 ? 0 : player.height)), Math.floor(player.pos.z + z))) {
          if (player.vel.y < 0) {
            player.pos.y = Math.floor(player.pos.y) + 1;
            player.onGround = true;
          } else if (player.vel.y > 0) {
            player.pos.y = Math.floor(player.pos.y + player.height) - player.height - 0.01;
          }
          player.vel.y = 0;
        }
      }
    }

    if (keys['Space'] && player.onGround) {
      player.vel.y = jumpSpeed;
      player.onGround = false;
    }

    controls.object.position.copy(player.pos);
    controls.object.position.y += 0.8;
  }

  timeOfDay += dt * 0.01; 
  if (timeOfDay > 1) timeOfDay -= 1;

  const currentSunAngle = timeOfDay * Math.PI * 2;
  const currentSunHeight = Math.sin(currentSunAngle - Math.PI/2); 
  
  sun.position.set(player.pos.x + Math.cos(currentSunAngle) * 100, player.pos.y + currentSunHeight * 100, player.pos.z + 50);
  sun.target.position.copy(player.pos);
  sun.target.updateMatrixWorld();

  if (currentSunHeight > 0) {
    const dayColor = new THREE.Color(0xaaccff);
    const nightColor = new THREE.Color(0x0a0a20);
    const t = Math.max(0, currentSunHeight); 
    scene.background = nightColor.clone().lerp(dayColor, t);
    scene.fog.color.copy(scene.background);
    sun.intensity = Math.max(0, currentSunHeight * 2.0);
    ambient.intensity = 0.2 + t * 0.4;
    ambient.color.setHex(0xffffff);
  } else {
    scene.background = new THREE.Color(0x050510);
    scene.fog.color.copy(scene.background);
    sun.intensity = 0;
    ambient.intensity = 0.1;
    ambient.color.setHex(0x3344aa);
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
