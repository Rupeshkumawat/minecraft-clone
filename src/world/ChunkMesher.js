import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js';
import { BY_ID, BLOCKS } from './blocks.js';

const FACES = [
  { axis: 0, sign: +1, u: 2, v: 1, shade: 0.82, type: 'side' },
  { axis: 0, sign: -1, u: 2, v: 1, shade: 0.82, type: 'side' },
  { axis: 1, sign: +1, u: 0, v: 2, shade: 1.00, type: 'top' },
  { axis: 1, sign: -1, u: 0, v: 2, shade: 0.60, type: 'bottom' },
  { axis: 2, sign: +1, u: 0, v: 1, shade: 0.92, type: 'side' },
  { axis: 2, sign: -1, u: 0, v: 1, shade: 0.92, type: 'side' },
];

const DIM = [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];

export class ChunkMesher {
  constructor(chunk, world) {
    this.chunk = chunk;
    this.world = world;
  }

  getWorldBlock(lx, ly, lz) {
    if (ly < 0 || ly >= CHUNK_HEIGHT) return BLOCKS.AIR.id;
    const wx = this.chunk.cx * CHUNK_SIZE + lx;
    const wz = this.chunk.cz * CHUNK_SIZE + lz;
    return this.world.getBlock(wx, ly, wz);
  }

  build() {
    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    const indices = [];
    let vertexIndex = 0;

    for (const face of FACES) {
      const { axis, sign, u, v, shade, type } = face;
      const du = DIM[u];
      const dv = DIM[v];
      const dAxis = DIM[axis];

      const mask = new Uint8Array(du * dv);

      for (let slice = 0; slice < dAxis; slice++) {
        mask.fill(0);

        for (let uu = 0; uu < du; uu++) {
          for (let vv = 0; vv < dv; vv++) {
            const coord = [0, 0, 0];
            coord[axis] = slice;
            coord[u] = uu;
            coord[v] = vv;
            const [lx, ly, lz] = coord;

            const id = this.chunk.getBlock(lx, ly, lz);
            if (id === BLOCKS.AIR.id) continue;

            const ncoord = [lx, ly, lz];
            ncoord[axis] += sign;
            const [nx, ny, nz] = ncoord;

            const neighbourId = this.getWorldBlock(nx, ny, nz);
            const neighbourDef = BY_ID[neighbourId];

            if (neighbourDef && (neighbourDef.solid || neighbourId === id)) continue;

            mask[uu * dv + vv] = id;
          }
        }

        for (let vv = 0; vv < dv; vv++) {
          for (let uu = 0; uu < du; ) {
            const id = mask[uu * dv + vv];
            if (id === 0) { uu++; continue; }

            let w = 1;
            while (uu + w < du && mask[(uu + w) * dv + vv] === id) w++;

            let h = 1;
            let grow = true;
            while (vv + h < dv && grow) {
              for (let k = 0; k < w; k++) {
                if (mask[(uu + k) * dv + (vv + h)] !== id) { grow = false; break; }
              }
              if (grow) h++;
            }

            const def = BY_ID[id];
            // Safely get UVs (fallback to a random texture if missing)
            const uvRect = def.uv && def.uv[type] ? def.uv[type] : [0, 0, 0.0625, 0.0625]; 

            const cornersUV = [[uu, vv], [uu + w, vv], [uu + w, vv + h], [uu, vv + h]];
            const verts = cornersUV.map(([cu, cv]) => {
              const c = [0, 0, 0];
              c[axis] = slice + (sign === 1 ? 1 : 0);
              c[u] = cu;
              c[v] = cv;
              return c;
            });

            const flip = sign < 0;
            const base = vertexIndex;

            const uvCoords = [
              [uvRect[0], uvRect[1]],
              [uvRect[2], uvRect[1]],
              [uvRect[2], uvRect[3]],
              [uvRect[0], uvRect[3]]
            ];

            for (let i = 0; i < 4; i++) {
              const [x, y, z] = verts[i];
              positions.push(x, y, z);
              
              const n = [0, 0, 0];
              n[axis] = sign;
              normals.push(n[0], n[1], n[2]);
              
              colors.push(shade, shade, shade);
              
              const uv = uvCoords[i];
              uvs.push(uv[0], uv[1]);
            }

            if (!flip) {
              indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            } else {
              indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
            }
            vertexIndex += 4;

            for (let dv2 = 0; dv2 < h; dv2++) {
              for (let du2 = 0; du2 < w; du2++) {
                mask[(uu + du2) * dv + (vv + dv2)] = 0;
              }
            }
            uu += w;
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }
}
