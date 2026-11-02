import { BLOCKS } from './blocks.js';
import { fbm2D } from './noise.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

export class Chunk {
  constructor(cx, cz, seed = 0) {
    this.cx = cx;
    this.cz = cz;
    this.seed = seed;
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.generate();
  }
  idx(x, y, z) { return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE; }
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return BLOCKS.AIR.id;
    return this.data[this.idx(x, y, z)];
  }
  setBlock(x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.data[this.idx(x, y, z)] = id;
  }
  generate() {
    const SEA_LEVEL = 20;
    
    // 1. Terrain
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = this.cx * CHUNK_SIZE + x;
        const wz = this.cz * CHUNK_SIZE + z;
        const h = fbm2D(wx * 0.02, wz * 0.02, this.seed, 4);
        const height = Math.floor(10 + h * 35);
        
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let id = BLOCKS.AIR.id;
          if (y < height - 3) id = BLOCKS.STONE.id;
          else if (y < height) id = BLOCKS.DIRT.id;
          else if (y === height) id = height <= SEA_LEVEL + 1 ? BLOCKS.SAND.id : BLOCKS.GRASS.id;
          else if (y <= SEA_LEVEL) id = BLOCKS.WATER.id;
          this.setBlock(x, y, z, id);
        }

        // 2. Vegetation (Trees) - 5% chance per grass block
        if (height > SEA_LEVEL + 2 && this.getBlock(x, height, z) === BLOCKS.GRASS.id) {
          if (Math.random() < 0.03) {
            this.spawnTree(x, height + 1, z);
          }
        }
      }
    }
  }

  spawnTree(x, y, z) {
    // Trunk (3-5 blocks tall)
    const treeHeight = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < treeHeight; i++) {
      this.setBlock(x, y + i, z, BLOCKS.WOOD.id);
    }
    
    // Leaves (spherical canopy)
    const leafTop = y + treeHeight;
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = leafTop - 2; ly <= leafTop + 1; ly++) {
          // Skip corners for round shape
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
          if (this.getBlock(x + lx, ly, z + lz) === BLOCKS.AIR.id) {
            this.setBlock(x + lx, ly, z + lz, BLOCKS.LEAVES.id);
          }
        }
      }
    }
  }
}
