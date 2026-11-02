import * as THREE from 'three';

export function createTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const drawTile = (x, y, baseColor, noiseAmount, isGrassSide = false) => {
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        // If grass side, draw green at the top 4 pixels, dirt below
        let r = baseColor.r, g = baseColor.g, b = baseColor.b;
        if (isGrassSide && j < 4) {
          r = 92; g = 184; b = 92; // Grass green
        } else if (isGrassSide && j < 5 && Math.random() > 0.5) {
          r = 92; g = 184; b = 92; // Grass fringe
        }

        const noise = (Math.random() - 0.5) * noiseAmount;
        ctx.fillStyle = `rgb(${Math.max(0, r+noise)},${Math.max(0, g+noise)},${Math.max(0, b+noise)})`;
        ctx.fillRect(x + i * 16, y + j * 16, 16, 16);
      }
    }
  };

  // 0: Grass Top
  drawTile(0, 0, { r: 92, g: 184, b: 92 }, 35);
  // 1: Dirt
  drawTile(0, 16, { r: 139, g: 90, b: 43 }, 40);
  // 2: Stone
  drawTile(0, 32, { r: 128, g: 128, b: 128 }, 60);
  // 3: Sand
  drawTile(0, 48, { r: 224, g: 208, b: 144 }, 30);
  // 4: Water
  drawTile(0, 64, { r: 48, g: 96, b: 192 }, 20);
  // 5: Grass Side
  drawTile(0, 80, { r: 139, g: 90, b: 43 }, 40, true);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; // Crisp pixels
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export const UVS = {
  GRASS_TOP:   [0.0, 0.9375, 0.0625, 1.0],
  DIRT:        [0.0, 0.8125, 0.0625, 0.875],
  STONE:       [0.0, 0.6875, 0.0625, 0.75],
  SAND:        [0.0, 0.5625, 0.0625, 0.625],
  WATER:       [0.0, 0.4375, 0.0625, 0.5],
  GRASS_SIDE:  [0.0, 0.3125, 0.0625, 0.375],
};
