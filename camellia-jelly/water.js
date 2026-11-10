// 푸딩 바다: 높이장 파동 시뮬(130×75) + 투과 재질(잔물결 5겹 법선·빛줄기 그물) + 옆벽·흰 테두리 + 거품·물보라
import * as THREE from 'three';
import { B, terrainH } from './terrain.js';

export const WZ0 = -6.2, WZ1 = B.z1, NX = 130, NZ = 76;
const DX = B.W / (NX - 1), DZ = (WZ1 - WZ0) / (NZ - 1);

const RIPPLE = /* glsl */`
uniform float uTime; uniform float uWind; varying vec3 vWP;
float causticNet(vec2 p, float t){ vec2 q = p; float c = 0.0;
  for (int i = 0; i < 3; i++) { q = vec2(q.x + sin(q.y * 1.7 + t * 0.8 + float(i)) * 0.55, q.y + sin(q.x * 1.3 - t * 0.7 - float(i)) * 0.55); c += abs(sin(q.x * 2.2) + sin(q.y * 2.4)); }
  c /= 3.0; return pow(max(0.0, 1.0 - c * 0.72), 5.0); }
vec2 rippleGrad(vec2 p, float t){ vec2 g = vec2(0.0);
  vec2 D[5]; D[0] = normalize(vec2(1.0, 0.3)); D[1] = normalize(vec2(-0.6, 1.0)); D[2] = normalize(vec2(0.2, -1.0)); D[3] = normalize(vec2(-1.0, -0.45)); D[4] = normalize(vec2(0.8, 0.9));
  float F[5]; F[0] = 3.1; F[1] = 5.3; F[2] = 8.7; F[3] = 13.9; F[4] = 21.0;
  for (int i = 0; i < 5; i++) { float f = F[i]; float a = (0.05 + uWind * 0.05) / f; g += D[i] * cos(dot(D[i], p) * f + t * (1.3 + float(i) * 0.55)) * f * a; }
  return g; }
`;

export function createWater(uniforms) {
  const group = new THREE.Group();
  const N = NX * NZ, h = new Float32Array(N), v = new Float32Array(N), wet = new Uint8Array(N), floorY = new Float32Array(N);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = B.x0 + i * DX, z = WZ0 + j * DZ, t = terrainH(x, z); floorY[j * NX + i] = t; wet[j * NX + i] = t < 0.3 ? 1 : 0; }
  const P = { level: 0, damp: 0.992, wind: 0.4, tiltX: 0, tiltZ: 0, amp: 1 };

  // 수면
  const geo = new THREE.PlaneGeometry(B.W, WZ1 - WZ0, NX - 1, NZ - 1); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, (WZ0 + WZ1) / 2);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.8, roughness: 0.06, ior: 1.33, attenuationDistance: 2.3, attenuationColor: new THREE.Color(0xf3c95a), specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uWind = uniforms.uWind;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = RIPPLE + sh.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 gr = rippleGrad(vWP.xz, uTime); vec3 nW = normalize(vec3(-gr.x, 1.0, -gr.y)); normal = normalize(normal + (viewMatrix * vec4(nW - vec3(0.0, 1.0, 0.0), 0.0)).xyz * 0.9); }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float cc = causticNet(vWP.xz * 0.9 + vec2(uTime * 0.05, 0.0), uTime) + 0.55 * causticNet(vWP.xz * 1.9 - 1.7, uTime * 1.25);
        gl_FragColor.rgb += cc * 0.32 * vec3(1.0, 0.99, 0.94);`);
  };
  const surf = new THREE.Mesh(geo, mat); surf.name = 'pudding'; surf.userData.kind = 'water'; group.add(surf);

  // 옆벽(앞면 z=+9, 오른쪽 x=+13) + 흰 테두리
  const wallMat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.8, roughness: 0.15, metalness: 0, emissive: 0x000000, side: THREE.DoubleSide, depthWrite: false });
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const edges = []; // 각 변: 표본 칸 목록
  { const f = []; for (let i = 0; i < NX; i++) f.push(i + (NZ - 1) * NX); edges.push({ cells: f, out: [0, 0, 1] });
    const r = []; for (let j = NZ - 1; j >= 0; j--) r.push(NX - 1 + j * NX); edges.push({ cells: r, out: [1, 0, 0] }); }
  for (const e of edges) {
    const n = e.cells.length; const wg = new THREE.BufferGeometry(), rg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3)); wg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const idx = []; for (let k = 0; k < n - 1; k++) { const a = k * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); } wg.setIndex(idx); rg.setIndex(idx);
    e.wall = new THREE.Mesh(wg, wallMat); e.rim = new THREE.Mesh(rg, rimMat); e.wall.renderOrder = 3; e.rim.renderOrder = 4; e.wall.userData.kind = 'water'; group.add(e.wall, e.rim);
  }

  // 거품(연노랑 원판)과 물보라(작은 방울)
  const FOAM = 260, foamGeo = new THREE.CircleGeometry(0.14, 12); foamGeo.rotateX(-Math.PI / 2);
  const foamMesh = new THREE.InstancedMesh(foamGeo, new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.85, depthWrite: false }), FOAM); foamMesh.renderOrder = 5; group.add(foamMesh);
  const foam = Array.from({ length: FOAM }, () => ({ x: 0, z: 0, life: 0, s: 1 })); let foamI = 0;
  const DROP = 320, dropMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe9a0, roughness: 0.1, emissive: 0x332200, transparent: true, opacity: 0.9 }), DROP); dropMesh.castShadow = false; group.add(dropMesh);
  const drops = Array.from({ length: DROP }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 1 })); let dropI = 0;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();

  const cellOf = (x, z) => { const i = Math.round((x - B.x0) / DX), j = Math.round((z - WZ0) / DZ); return (i < 0 || j < 0 || i >= NX || j >= NZ) ? -1 : j * NX + i; };
  function disturb(x, z, r, a) {
    const ri = Math.ceil(r / DX) + 1, ci = Math.round((x - B.x0) / DX), cj = Math.round((z - WZ0) / DZ);
    for (let j = cj - ri; j <= cj + ri; j++) for (let i = ci - ri; i <= ci + ri; i++) { if (i < 1 || j < 1 || i >= NX - 1 || j >= NZ - 1) continue; const k = j * NX + i; if (!wet[k]) continue;
      const d = Math.hypot(B.x0 + i * DX - x, WZ0 + j * DZ - z); if (d < r) v[k] += a * (0.5 + 0.5 * Math.cos(Math.PI * d / r)); }
  }
  function addFoam(x, z, n = 6, spread = 0.35) { for (let q = 0; q < n; q++) { const f = foam[foamI = (foamI + 1) % FOAM]; f.x = x + (Math.random() - 0.5) * spread * 2; f.z = z + (Math.random() - 0.5) * spread * 2; f.life = 1; f.s = 0.6 + Math.random() * 1.2; } }
  function splashAt(x, y, z, n = 14, power = 1) { for (let q = 0; q < n; q++) { const d = drops[dropI = (dropI + 1) % DROP]; d.p.set(x, y, z); const a = Math.random() * Math.PI * 2, s = (0.6 + Math.random()) * power; d.v.set(Math.cos(a) * s * 1.2, (2.2 + Math.random() * 2) * power, Math.sin(a) * s * 1.2); d.life = 1; d.s = 0.5 + Math.random() * 0.9; } }
  const surfaceY = (x, z) => { const k = cellOf(x, z); return P.level + (k >= 0 ? h[k] * P.amp : 0) + tilt(x, z); };
  const tilt = (x, z) => -(P.tiltX * x + P.tiltZ * z);
  const isWet = (x, z) => { const k = cellOf(x, z); return k >= 0 && wet[k] === 1 && floorY[k] < P.level - 0.02; };

  function step() {
    const c = 0.42, d = P.damp;
    for (let j = 1; j < NZ - 1; j++) for (let i = 1; i < NX - 1; i++) { const k = j * NX + i; if (!wet[k]) continue;
      const hk = h[k], l = wet[k - 1] ? h[k - 1] : hk, r = wet[k + 1] ? h[k + 1] : hk, u = wet[k - NX] ? h[k - NX] : hk, dd = wet[k + NX] ? h[k + NX] : hk;
      v[k] = (v[k] + ((l + r + u + dd) * 0.25 - hk) * c) * d; }
    for (let k = 0; k < N; k++) { if (!wet[k]) { h[k] = 0; continue; } h[k] += v[k]; if (h[k] > 0.5) h[k] = 0.5; else if (h[k] < -0.5) h[k] = -0.5; }
  }

  let windAcc = 0, simAcc = 0; const SIM_DT = 1 / 120;
  function update(dt, t, flavor) {
    // 바람: 잔잔한 무작위 물방울
    windAcc += dt * (2 + P.wind * 22); while (windAcc > 1) { windAcc -= 1; const x = B.x0 + Math.random() * B.W, z = WZ0 + Math.random() * (WZ1 - WZ0); if (isWet(x, z)) disturb(x, z, 0.5, (Math.random() - 0.5) * 0.012 * (0.3 + P.wind)); }
    simAcc = Math.min(simAcc + dt, SIM_DT * 4); while (simAcc >= SIM_DT) { step(); simAcc -= SIM_DT; } /* 고정 간격(초당 120번) */
    const pos = geo.attributes.position;
    for (let k = 0; k < N; k++) { const x = pos.getX(k), z = pos.getZ(k); pos.setY(k, wet[k] ? P.level + h[k] * P.amp + tilt(x, z) : Math.min(floorY[k] - 0.05, P.level)); }
    pos.needsUpdate = true; geo.computeVertexNormals();
    // 옆벽
    const deep = new THREE.Color(flavor.deep), light = new THREE.Color(flavor.light);
    for (const e of edges) { const wp = e.wall.geometry.attributes.position, wc = e.wall.geometry.attributes.color, rp = e.rim.geometry.attributes.position;
      e.cells.forEach((k, q) => { const x = pos.getX(k), z = pos.getZ(k) + (e.out[2] ? 0.004 : 0), xx = x + (e.out[0] ? 0.004 : 0); const top = wet[k] ? P.level + h[k] * P.amp + tilt(x, z) : floorY[k]; const bot = Math.min(floorY[k], top);
        wp.setXYZ(q * 2, xx, bot, z); wp.setXYZ(q * 2 + 1, xx, top, z);
        const fb = Math.max(0, Math.min(1, (bot - B.BOTTOM) / 3)); wc.setXYZ(q * 2, deep.r * (0.7 + fb * 0.3), deep.g * (0.7 + fb * 0.3), deep.b * (0.7 + fb * 0.3)); wc.setXYZ(q * 2 + 1, light.r, light.g, light.b);
        const show = top > bot + 0.01 ? 1 : 0; rp.setXYZ(q * 2, xx + e.out[0] * 0.006, top - 0.045 * show, z + e.out[2] * 0.006); rp.setXYZ(q * 2 + 1, xx + e.out[0] * 0.006, top + 0.012 * show, z + e.out[2] * 0.006); });
      wp.needsUpdate = wc.needsUpdate = rp.needsUpdate = true; e.wall.geometry.computeVertexNormals(); e.wall.geometry.computeBoundingSphere(); e.rim.geometry.computeBoundingSphere(); }
    // 거품
    for (let q = 0; q < FOAM; q++) { const f = foam[q]; if (f.life > 0) f.life -= dt * 0.45; const s = Math.max(0, f.life) * f.s; S.set(s, 1, s); V.set(f.x, surfaceY(f.x, f.z) + 0.012, f.z); M.compose(V, Q.identity(), S); foamMesh.setMatrixAt(q, M); }
    foamMesh.instanceMatrix.needsUpdate = true;
    // 물보라
    for (let q = 0; q < DROP; q++) { const d = drops[q]; if (d.life > 0) { d.v.y -= 9.8 * dt; d.p.addScaledVector(d.v, dt); d.life -= dt * 0.9;
        if (d.v.y < 0 && d.p.y < surfaceY(d.p.x, d.p.z) && isWet(d.p.x, d.p.z)) { disturb(d.p.x, d.p.z, 0.3, -0.01); if (Math.random() < 0.3) addFoam(d.p.x, d.p.z, 1, 0.05); d.life = 0; } }
      const s = d.life > 0 ? d.s : 0; S.set(s, s, s); M.compose(d.p, Q.identity(), S); dropMesh.setMatrixAt(q, M); }
    dropMesh.instanceMatrix.needsUpdate = true;
  }
  function setFlavor(fl) { mat.attenuationColor.set(fl.atten); mat.color.set(fl.tint); }
  function reset() { h.fill(0); v.fill(0); foam.forEach(f => f.life = 0); drops.forEach(d => d.life = 0); }
  return { group, surf, P, update, disturb, addFoam, splashAt, surfaceY, isWet, setFlavor, reset, mat };
}
