import * as THREE from 'three';
import { playPigSound, playSheepSound, playVillagerSound, playZombieSound, playHurtSound } from './sounds.js';

function createPart(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export class Entity {
  constructor(type, x, y, z) {
    this.type = type;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);
    this.velocity = new THREE.Vector3();
    this.wanderTimer = 0;
    this.targetDirection = new THREE.Vector3();
    this.walkCycle = 0;
    this.jumpTimer = 0;
    this.health = 10;
    this.attackCooldown = 0;
    
    if (type === 'pig') {
      const body = createPart(1.2, 0.8, 1.6, 0xff99aa);
      body.position.y = 0.6;
      this.mesh.add(body);
      const head = createPart(0.8, 0.8, 0.8, 0xff99aa);
      head.position.set(0, 0.8, 0.9);
      this.mesh.add(head);
      const snout = createPart(0.3, 0.3, 0.2, 0xcc7788);
      snout.position.set(0, 0.7, 1.35);
      this.mesh.add(snout);
      const legPos = [[-0.4, 0.2, -0.5], [0.4, 0.2, -0.5], [-0.4, 0.2, 0.5], [0.4, 0.2, 0.5]];
      this.legs = legPos.map(pos => {
        const leg = createPart(0.3, 0.4, 0.3, 0xff99aa);
        leg.position.set(...pos);
        this.mesh.add(leg);
        return leg;
      });
      this.speed = 1.5;
      this.sound = playPigSound;
    } else if (type === 'sheep') {
      const body = createPart(1.2, 1.2, 1.6, 0xeeeeee);
      body.position.y = 0.9;
      this.mesh.add(body);
      const head = createPart(0.7, 0.7, 0.7, 0xdddddd);
      head.position.set(0, 1.2, 0.9);
      this.mesh.add(head);
      const legPos = [[-0.4, 0.2, -0.5], [0.4, 0.2, -0.5], [-0.4, 0.2, 0.5], [0.4, 0.2, 0.5]];
      this.legs = legPos.map(pos => {
        const leg = createPart(0.3, 0.4, 0.3, 0xdddddd);
        leg.position.set(...pos);
        this.mesh.add(leg);
        return leg;
      });
      this.speed = 1.0;
      this.sound = playSheepSound;
    } else if (type === 'villager') {
      const body = createPart(0.7, 1.2, 0.4, 0x8b5a2b);
      body.position.y = 1.0;
      this.mesh.add(body);
      const head = createPart(0.6, 0.6, 0.6, 0xf0c090);
      head.position.set(0, 1.9, 0);
      this.mesh.add(head);
      const nose = createPart(0.2, 0.3, 0.2, 0xe0a080);
      nose.position.set(0, 1.85, 0.35);
      this.mesh.add(nose);
      const legPos = [[-0.2, 0.3, 0], [0.2, 0.3, 0]];
      this.legs = legPos.map(pos => {
        const leg = createPart(0.3, 0.6, 0.3, 0x8b5a2b);
        leg.position.set(...pos);
        this.mesh.add(leg);
        return leg;
      });
      this.speed = 0.8;
      this.sound = playVillagerSound;
    } else if (type === 'zombie') {
      // Green skin, blue shirt
      const body = createPart(0.8, 1.0, 0.4, 0x3366cc);
      body.position.y = 1.0;
      this.mesh.add(body);
      const head = createPart(0.7, 0.7, 0.7, 0x55aa55);
      head.position.set(0, 1.8, 0);
      this.mesh.add(head);
      const legPos = [[-0.2, 0.35, 0], [0.2, 0.35, 0]];
      this.legs = legPos.map(pos => {
        const leg = createPart(0.3, 0.7, 0.3, 0x224488);
        leg.position.set(...pos);
        this.mesh.add(leg);
        return leg;
      });
      // Arms outstretched
      const armL = createPart(0.3, 0.8, 0.3, 0x55aa55);
      armL.position.set(-0.55, 1.2, 0.3);
      armL.rotation.x = -Math.PI/2;
      this.mesh.add(armL);
      const armR = createPart(0.3, 0.8, 0.3, 0x55aa55);
      armR.position.set(0.55, 1.2, 0.3);
      armR.rotation.x = -Math.PI/2;
      this.mesh.add(armR);
      
      this.speed = 2.5; // Zombies are faster
      this.sound = playZombieSound;
    }
  }

  interact() {
    this.jumpTimer = 0.5;
    if (this.sound) this.sound();
  }

  damage(amount) {
    this.health -= amount;
    this.jumpTimer = 0.3;
    if (this.health <= 0) {
      return true; // dead
    }
    return false;
  }

  update(dt, world, playerPos) {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.type === 'zombie') {
      // Zombie AI: Chase the player!
      const dist = this.mesh.position.distanceTo(playerPos);
      
      if (dist < 20) {
        // Chase
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        this.targetDirection.set(dx, 0, dz).normalize();
      } else {
        // Wander if player is far
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = 2 + Math.random() * 3;
          this.targetDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }
      }

      // Check distance for attack
      if (dist < 1.5 && this.attackCooldown <= 0) {
        this.attackCooldown = 1.0; // Attack once per second
        playHurtSound();
        // Signal the main game that the player is hurt
        window.dispatchEvent(new CustomEvent('playerHurt', { detail: 10 }));
      }
    } else {
      // Passive animal AI
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2 + Math.random() * 3;
        this.targetDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      }
    }

    if (this.jumpTimer > 0) {
      this.jumpTimer -= dt;
      this.mesh.position.y += Math.sin(this.jumpTimer * 10) * 0.1;
      if (this.jumpTimer <= 0) {
        this.mesh.position.y = Math.floor(this.mesh.position.y);
      }
    } else {
      this.walkCycle += dt * 10;
      if (this.legs) {
        this.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(this.walkCycle + (i % 2 === 0 ? 0 : Math.PI)) * 0.5;
        });
      }

      const nextX = this.mesh.position.x + this.targetDirection.x * this.speed * dt;
      const nextZ = this.mesh.position.z + this.targetDirection.z * this.speed * dt;

      const cx = Math.floor(nextX);
      const cz = Math.floor(nextZ);
      const cy = Math.floor(this.mesh.position.y);
      
      const groundBlock = world.getBlock(cx, cy - 1, cz);
      const headBlock = world.getBlock(cx, cy, cz);

      if (groundBlock !== 0 && headBlock === 0) {
        this.mesh.position.x = nextX;
        this.mesh.position.z = nextZ;
        const angle = Math.atan2(this.targetDirection.x, this.targetDirection.z);
        this.mesh.rotation.y = angle;
      } else {
        this.targetDirection.multiplyScalar(-1);
      }
    }
  }
}

export class EntityManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.entities = [];
    this.spawnTimer = 0;
    this.zombieTimer = 0;
  }

  spawn(type, x, y, z) {
    const entity = new Entity(type, x, y, z);
    this.scene.add(entity.mesh);
    this.entities.push(entity);
  }

  removeEntity(index) {
    this.scene.remove(this.entities[index].mesh);
    this.entities.splice(index, 1);
  }

  update(dt, playerPos, isNight) {
    this.spawnTimer -= dt;
    this.zombieTimer -= dt;

    // Spawn passive animals during the day
    if (this.spawnTimer <= 0 && this.entities.filter(e => e.type !== 'zombie').length < 30) {
      this.spawnTimer = 2.0; 
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 30;
      const sx = Math.floor(playerPos.x + Math.cos(angle) * dist);
      const sz = Math.floor(playerPos.z + Math.sin(angle) * dist);
      let sy = 64;
      while (sy > 0 && this.world.getBlock(sx, sy, sz) === 0) sy--;
      if (sy > 0 && this.world.getBlock(sx, sy, sz) === 1) {
        const types = ['pig', 'sheep', 'villager'];
        this.spawn(types[Math.floor(Math.random() * types.length)], sx, sy + 1, sz);
      }
    }

    // Spawn zombies during the night
    if (isNight && this.zombieTimer <= 0 && this.entities.filter(e => e.type === 'zombie').length < 10) {
      this.zombieTimer = 4.0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 20;
      const sx = Math.floor(playerPos.x + Math.cos(angle) * dist);
      const sz = Math.floor(playerPos.z + Math.sin(angle) * dist);
      let sy = 64;
      while (sy > 0 && this.world.getBlock(sx, sy, sz) === 0) sy--;
      if (sy > 0 && this.world.getBlock(sx, sy, sz) === 1) {
        this.spawn('zombie', sx, sy + 1, sz);
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      
      if (ent.mesh.position.distanceTo(playerPos) > 80) {
        this.removeEntity(i);
        continue;
      }

      // Simple gravity/ground snap for entities
      const ex = Math.floor(ent.mesh.position.x);
      const ez = Math.floor(ent.mesh.position.z);
      let ey = Math.floor(ent.mesh.position.y);
      while (ey > 0 && this.world.getBlock(ex, ey - 1, ez) === 0) {
        ent.mesh.position.y -= 0.1;
        ey = Math.floor(ent.mesh.position.y);
      }

      ent.update(dt, this.world, playerPos);
    }
  }
}
