import * as THREE from 'three';
import { Chunk, CHUNK_SIZE } from './Chunk.js';
import { ChunkMesher } from './ChunkMesher.js';
import { BLOCKS } from './blocks.js';
import { createTextureAtlas } from './textures.js';

export class World {
  constructor(scene, seed = 12345) {
    this.scene = scene;
    this.seed = seed;
    this.chunks = new Map();
    
    const texture = createTextureAtlas();
    // AAA Material: roughness 1.0 means blocks are matte, not shiny
    this.material = new THREE.MeshStandardMaterial({ 
      map: texture,
      vertexColors: true,
      alphaTest: 0.5,
      roughness: 1.0,
      metalness: 0.0
    });
    
    this.renderDistance = 4; 
  }

  key(cx, cz) { return `${cx},${cz}`; }

  loadChunk(cx, cz) {
    const k = this.key(cx, cz);
    if (this.chunks.has(k)) return;

    const chunk = new Chunk(cx, cz, this.seed);
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    
    // SHADOWS
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.chunks.set(k, { chunk, mesh });
    this.remesh(chunk);
    this.remeshNeighbors(cx, cz);
  }

  unloadChunk(cx, cz) {
    const k = this.key(cx, cz);
    if (!this.chunks.has(k)) return;

    const { mesh } = this.chunks.get(k);
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    this.chunks.delete(k);
    this.remeshNeighbors(cx, cz);
  }

  remeshNeighbors(cx, cz) {
    const neighbors = [
      [cx - 1, cz], [cx + 1, cz],
      [cx, cz - 1], [cx, cz + 1]
    ];
    for (const [nx, nz] of neighbors) {
      const entry = this.chunks.get(this.key(nx, nz));
      if (entry) this.remesh(entry.chunk);
    }
  }

  update(playerPos) {
    const pcx = Math.floor(playerPos.x / CHUNK_SIZE);
    const pcz = Math.floor(playerPos.z / CHUNK_SIZE);

    for (let cx = pcx - this.renderDistance; cx <= pcx + this.renderDistance; cx++) {
      for (let cz = pcz - this.renderDistance; cz <= pcz + this.renderDistance; cz++) {
        this.loadChunk(cx, cz);
      }
    }

    for (const [key, entry] of this.chunks.entries()) {
      const { cx, cz } = entry.chunk;
      if (Math.abs(cx - pcx) > this.renderDistance || Math.abs(cz - pcz) > this.renderDistance) {
        this.unloadChunk(cx, cz);
      }
    }
  }

  remesh(chunk) {
    const mesher = new ChunkMesher(chunk, this);
    const geo = mesher.build();
    const entry = this.chunks.get(this.key(chunk.cx, chunk.cz));
    if (entry) {
      entry.mesh.geometry.dispose();
      entry.mesh.geometry = geo;
    }
  }

  getBlock(wx, wy, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const entry = this.chunks.get(this.key(cx, cz));
    if (!entry) return BLOCKS.AIR.id;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return entry.chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx, wy, wz, id) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const entry = this.chunks.get(this.key(cx, cz));
    if (!entry) return;
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    entry.chunk.setBlock(lx, wy, lz, id);
    this.remesh(entry.chunk);
    this.remeshNeighbors(cx, cz); 
  }
}
