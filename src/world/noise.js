function hash2(x, z, seed = 0) {
  let h = x * 374761393 + z * 668265263 + seed * 982451653;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}
function smoothstep(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
export function noise2D(x, z, seed = 0) {
  const x0 = Math.floor(x), z0 = Math.floor(z);
  const x1 = x0 + 1,      z1 = z0 + 1;
  const tx = smoothstep(x - x0);
  const tz = smoothstep(z - z0);
  const v00 = hash2(x0, z0, seed);
  const v10 = hash2(x1, z0, seed);
  const v01 = hash2(x0, z1, seed);
  const v11 = hash2(x1, z1, seed);
  const a = lerp(v00, v10, tx);
  const b = lerp(v01, v11, tx);
  return lerp(a, b, tz);
}
export function fbm2D(x, z, seed = 0, octaves = 4) {
  let total = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * freq, z * freq, seed + i) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}
