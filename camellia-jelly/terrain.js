// 땅: SDF 높이 함수 + 윗면 색 + 잘린 단면(푸딩 지층)
import * as THREE from 'three';

export const B = { W: 26, D: 18, x0: -13, x1: 13, z0: -9, z1: 9, BOTTOM: -3.2, FLOOR: 0.55 };
export const OFFICE = { x0: -13, x1: 4.2, z0: -5.2, z1: 6.6 }; // 사무실 바닥(위에서 본 사각형)
export const ISLE = { x: 9.4, z: 1.2, r: 1.15 };
export const RUGS = [{ x: -10.4, z: 4.6, r: 1.75, a: [0.80, 0.30, 0.30], b: [0.96, 0.90, 0.80] }, { x: -3.3, z: -3.7, r: 1.25, a: [0.95, 0.90, 0.80], b: [0.88, 0.80, 0.66] }, { x: 2.9, z: -1.7, r: 1.1, a: [0.98, 0.86, 0.86], b: [0.95, 0.80, 0.82] }];

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
function sdBox(px, pz, cx, cz, hx, hz, r) { const dx = Math.abs(px - cx) - hx + r, dz = Math.abs(pz - cz) - hz + r; return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0) - r; }

export function officeSdf(x, z) { const cx = (OFFICE.x0 + OFFICE.x1) / 2, cz = (OFFICE.z0 + OFFICE.z1) / 2; return sdBox(x, z, cx - 1, cz, (OFFICE.x1 - OFFICE.x0) / 2 + 1, (OFFICE.z1 - OFFICE.z0) / 2, 0.9); }
const landSdf = (x, z) => z + 5.55;

function landH(x, z) { const back = sstep(-6.2, -9, z); return 0.95 + back * (1.25 + 0.7 * Math.sin(x * 0.42 + 1.3) * Math.cos(x * 0.19)) + 0.08 * Math.sin(x * 2.1 + z * 1.7); }
function floorH(x, z) { let h = B.FLOOR; for (const r of RUGS) { const d = Math.hypot(x - r.x, z - r.z); h += 0.035 * sstep(r.r + 0.05, r.r - 0.08, d); } return h; }
function seabed(x, z) { return -1.55 + 0.09 * Math.sin(x * 1.25) * Math.cos(z * 1.05) + 0.05 * Math.sin(x * 3.1 + z * 2.3); }

export function terrainInfo(x, z) {
  const so = officeSdf(x, z), sl = landSdf(x, z);
  const above = z < -5.4 ? landH(x, z) : mix(floorH(x, z), landH(x, z), sstep(-5.0, -5.5, z));
  const m = sstep(0.55, -0.35, Math.min(so, sl));
  let h = mix(seabed(x, z), above, m), kind = m > 0.98 ? (z < -5.35 ? 'land' : 'floor') : m > 0.02 ? 'beach' : 'sea';
  const di = Math.hypot(x - ISLE.x, z - ISLE.z) - ISLE.r, mi = sstep(0.45, -0.35, di);
  if (mi > 0.01) { const hi = 0.42 + 0.22 * sstep(0.2, -1.0, di); const h2 = mix(seabed(x, z), hi, mi); if (h2 > h) { h = h2; kind = mi > 0.95 ? 'isle' : 'beach'; } }
  return { h, kind, m };
}
export const terrainH = (x, z) => terrainInfo(x, z).h;

// 지층: 아래부터 진갈색 → 갈색 → 모래색 → 흰 모래 줄
const STRATA = [[0, [0.29, 0.17, 0.10]], [0.34, [0.48, 0.30, 0.17]], [0.63, [0.84, 0.70, 0.48]], [0.9, [0.97, 0.94, 0.86]], [1, [0.97, 0.94, 0.86]]];

const CAUSTIC = /* glsl */`
uniform float uTime; uniform float uLevel; varying vec3 vWP;
float causticNet(vec2 p, float t){ vec2 q = p; float c = 0.0;
  for (int i = 0; i < 3; i++) { q = vec2(q.x + sin(q.y * 1.7 + t * 0.8 + float(i)) * 0.55, q.y + sin(q.x * 1.3 - t * 0.7 - float(i)) * 0.55); c += abs(sin(q.x * 2.2) + sin(q.y * 2.4)); }
  c /= 3.0; return pow(max(0.0, 1.0 - c * 0.72), 5.0); }
`;
export function injectCaustic(mat, uniforms, strength = 0.75) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uLevel = uniforms.uLevel;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = CAUSTIC + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float uw = smoothstep(uLevel + 0.04, uLevel - 0.35, vWP.y);
      float cc = causticNet(vWP.xz * 1.15, uTime) + 0.6 * causticNet(vWP.xz * 2.3 + 3.1, uTime * 1.3);
      gl_FragColor.rgb += uw * cc * ${strength.toFixed(2)} * vec3(1.0, 0.98, 0.9);`);
  };
}

export function buildTerrain(uniforms) {
  const group = new THREE.Group();
  const SX = 260, SZ = 180;
  const geo = new THREE.PlaneGeometry(B.W, B.D, SX, SZ); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const info = []; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), t = terrainInfo(x, z); pos.setY(i, t.h); info.push(t); }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }); injectCaustic(mat, uniforms);
  const top = new THREE.Mesh(geo, mat); top.receiveShadow = true; top.name = 'terrain'; top.userData.kind = 'ground'; group.add(top);

  function recolor(fl) {
    const fa = new THREE.Color(fl.floorA), fb = new THREE.Color(fl.floorB);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i), t = info[i]; let c;
      if (t.kind === 'floor') {
        const plank = Math.floor((z + 20) / 0.42), seam = Math.abs(((z + 20) / 0.42) % 1 - 0.5) > 0.46; const off = (plank % 2) * 0.9;
        const board = Math.abs(((x + 20 + off) / 1.8) % 1 - 0.5) > 0.485;
        c = (plank % 2 ? fa : fb).clone(); if (seam || board) c.multiplyScalar(0.82);
        c.multiplyScalar(0.96 + 0.06 * Math.sin(x * 7.1 + plank * 3.3));
        for (const r of RUGS) { const d = Math.hypot(x - r.x, z - r.z); if (d < r.r) { const ring = Math.floor(d / 0.32) % 2; c.setRGB(...(ring ? r.a : r.b)); if (d > r.r - 0.1) c.multiplyScalar(0.85); } }
      } else if (t.kind === 'land' || t.kind === 'isle') {
        const g = 0.5 + 0.5 * Math.sin(x * 1.7 + z * 2.3) * Math.cos(x * 0.7 - z * 1.1);
        c = new THREE.Color().setRGB(0.38 + 0.08 * g, 0.62 + 0.1 * g, 0.30 + 0.05 * g);
        if (y > 1.9) c.lerp(new THREE.Color(0.93, 0.95, 0.97), Math.min(1, (y - 1.9) * 1.6)); // 산꼭대기 눈
        if (t.kind === 'land' && Math.abs(x + 4.5 + Math.sin(z * 1.4) * 0.6) < 0.32 && z > -8.2) c.setRGB(0.80, 0.66, 0.45); // 오솔길
      } else if (t.kind === 'beach') {
        c = new THREE.Color(0.93, 0.85, 0.66); if (y < 0.05) c.lerp(new THREE.Color(0.85, 0.74, 0.55), 0.5);
      } else { c = new THREE.Color(0.90, 0.82, 0.62).lerp(new THREE.Color(fl.deep), 0.25); c.multiplyScalar(0.95 + 0.05 * Math.sin(x * 4 + z * 3)); }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.attributes.color.needsUpdate = true;
  }

  // 잘린 단면 4면
  const skMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }); injectCaustic(skMat, uniforms, 0.35);
  const sides = [ // [시작x, 시작z, 끝x, 끝z, 바깥 방향]
    [B.x0, B.z1, B.x1, B.z1], [B.x1, B.z1, B.x1, B.z0], [B.x1, B.z0, B.x0, B.z0], [B.x0, B.z0, B.x0, B.z1]];
  for (const [ax, az, bx, bz] of sides) {
    const N = 220, verts = [], cols = [], idx = []; const NB = STRATA.length - 1;
    const yAt = (u, k, topY) => mix(B.BOTTOM, topY, STRATA[k][0]) + (k > 0 && k < NB ? 0.03 * Math.sin(u * 46 + k * 2.1) : 0);
    for (let k = 0; k < NB; k++) { // 띠마다 따로(색 경계가 또렷하게)
      const base = verts.length / 3, c = STRATA[k][1];
      for (let i = 0; i <= N; i++) { const u = i / N, x = mix(ax, bx, u), z = mix(az, bz, u), topY = terrainH(x, z);
        verts.push(x, yAt(u, k, topY), z, x, yAt(u, k + 1, topY), z); cols.push(...c, ...c); }
      for (let i = 0; i < N; i++) { const a = base + i * 2, b = a + 1, c2 = a + 2, d = a + 3; idx.push(a, c2, b, b, c2, d); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, skMat); m.receiveShadow = true; m.userData.kind = 'ground'; group.add(m);
  }
  const bot = new THREE.Mesh(new THREE.PlaneGeometry(B.W, B.D), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 1 })); bot.rotation.x = Math.PI / 2; bot.position.y = B.BOTTOM; group.add(bot);
  return { group, top, recolor };
}
