import { UVS } from './textures.js';

export const BLOCKS = {
  AIR:   { id: 0, name: 'air',   solid: false },
  GRASS: { id: 1, name: 'grass', solid: true, uv: { top: UVS.GRASS_TOP, side: UVS.GRASS_SIDE, bottom: UVS.DIRT } },
  DIRT:  { id: 2, name: 'dirt',  solid: true, uv: { top: UVS.DIRT, side: UVS.DIRT, bottom: UVS.DIRT } },
  STONE: { id: 3, name: 'stone', solid: true, uv: { top: UVS.STONE, side: UVS.STONE, bottom: UVS.STONE } },
  SAND:  { id: 4, name: 'sand',  solid: true, uv: { top: UVS.SAND, side: UVS.SAND, bottom: UVS.SAND } },
  WATER: { id: 5, name: 'water', solid: false, uv: { top: UVS.WATER, side: UVS.WATER, bottom: UVS.WATER } },
  WOOD:  { id: 6, name: 'wood',  solid: true, uv: { top: UVS.WOOD_TOP, side: UVS.WOOD_SIDE, bottom: UVS.WOOD_TOP } },
  LEAVES:{ id: 7, name: 'leaves',solid: false, uv: { top: UVS.LEAVES, side: UVS.LEAVES, bottom: UVS.LEAVES } },
};

export const BY_ID = Object.values(BLOCKS).reduce((acc, b) => {
  acc[b.id] = b;
  return acc;
}, {});
