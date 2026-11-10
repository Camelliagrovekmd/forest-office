// 사무실 소품·숲·섬·오리배·눈·이벤트 장소 빛
import * as THREE from 'three';
import { B, OFFICE, ISLE, terrainH } from './terrain.js';

export const FLOOR = B.FLOOR;
// 팀 자리: 책상 가운데, 줄(1=뒤, 2=가운데, 3=앞)
export const DEPTS = [
  { id: 'boss', name: '원장실', sub: '원장님', x: -10.6, z: -3.3, row: 1 },
  { id: 'herb', name: '약재·처방 자료실', sub: '다람쥐', x: -6.9, z: -3.3, row: 1 },
  { id: 'edu', name: '학술·강의팀', sub: '사슴', x: 0.3, z: -3.3, row: 1 },
  { id: 'col', name: '칼럼·홍보팀', sub: '토끼', x: -10.3, z: 0.7, row: 2 },
  { id: 'ctl', name: '총괄 관제실', sub: '부엉이', x: -6.3, z: 0.7, row: 2 },
  { id: 'ops', name: '운영지원팀', sub: '수달', x: -2.4, z: 0.7, row: 2 },
  { id: 'news', name: '소식·모니터링팀', sub: '고양이', x: 1.5, z: 0.7, row: 2 },
  { id: 'diet', name: '린다이어트팀', sub: '너구리', x: -6.6, z: 4.4, row: 3 },
  { id: 'vid', name: '영상·만화팀', sub: '여우', x: -2.9, z: 4.4, row: 3 },
  { id: 'tang', name: '원외탕전실', sub: '곰', x: 0.9, z: 4.4, row: 3 },
];
export const SPOTS = { tree: { x: -3.3, z: -3.7 }, selfie: { x: 2.9, z: -1.9 }, sofa: { x: -10.4, z: 4.55 }, ring: { x: 3.55, z: -3.0 } };

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const gummy = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.2, sheen: 0.3, ...o });
function box(w, h, d, m) { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.castShadow = g.receiveShadow = true; return g; }
function rbox(w, h, d, m) { // 둥근 상자(젤리 느낌)
  const g = new THREE.BoxGeometry(w, h, d, 4, 3, 4); const p = g.attributes.position, r = Math.min(w, h, d) * 0.22;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); const c = new THREE.Vector3(Math.max(-w / 2 + r, Math.min(w / 2 - r, v.x)), Math.max(-h / 2 + r, Math.min(h / 2 - r, v.y)), Math.max(-d / 2 + r, Math.min(d / 2 - r, v.z))); const dlt = v.clone().sub(c); if (dlt.length() > r) dlt.setLength(r); p.setXYZ(i, c.x + dlt.x, c.y + dlt.y, c.z + dlt.z); }
  g.computeVertexNormals(); const m2 = new THREE.Mesh(g, m); m2.castShadow = m2.receiveShadow = true; return m2; }
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

export function buildWorld() {
  const group = new THREE.Group(); const upd = []; const M = {};
  const wood = std(0xb07a4a), woodD = std(0x7a4f2e), cream = std(0xf4ead6), screen = std(0x26323f, { emissive: 0x6fb7ff, emissiveIntensity: 0.25 }), green = std(0x3f8a4a), red = gummy(0xd8344a);
  M.screen = screen;

  // 책상·의자·모니터
  for (const d of DEPTS) {
    const g = new THREE.Group(); g.position.set(d.x, FLOOR, d.z); g.scale.setScalar(1.25);
    const top = rbox(1.8, 0.12, 0.85, wood); top.position.y = 0.52; g.add(top);
    for (const sx of [-0.78, 0.78]) g.add(at(box(0.1, 0.5, 0.75, woodD), sx, 0.25, 0));
    const mon = new THREE.Group(); mon.add(at(box(0.62, 0.4, 0.05, std(0x2a2a2e)), 0, 0.33, 0)); const scr = box(0.56, 0.34, 0.01, screen); scr.position.set(0, 0.33, 0.03); mon.add(scr); mon.add(at(box(0.06, 0.16, 0.06, std(0x2a2a2e)), 0, 0.1, 0)); mon.position.set(0.25, 0.58, 0.05); mon.rotation.y = Math.PI; g.add(mon);
    if (d.id === 'boss') { const lap = box(0.5, 0.03, 0.34, std(0xc9ccd2)); lap.position.set(-0.4, 0.6, -0.1); g.add(lap); }
    if (d.id === 'tang') { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.3, 18), std(0xc8ccd2, { metalness: 0.6, roughness: 0.3 })); pot.position.set(-0.45, 0.73, 0.05); pot.castShadow = true; g.add(pot); }
    if (d.id === 'diet') { const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xffffff)); bowl.position.set(-0.45, 0.78, 0.1); g.add(bowl); for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), std([0x5cae4f, 0xe85c4a, 0xf4c84a, 0x5cae4f][i])), -0.52 + i * 0.05, 0.74, 0.08 + (i % 2) * 0.06)); }
    if (d.id === 'vid') { const pad = box(0.42, 0.02, 0.3, std(0x333344)); pad.position.set(-0.45, 0.6, 0.12); pad.rotation.y = 0.3; g.add(pad); }
    if (d.id === 'herb') { for (let i = 0; i < 3; i++) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 14), std([0xf1ece2, 0xe9dcc4, 0xd8c7a4][i])), -0.55 + i * 0.22, 0.66, 0.15)); }
    const chair = new THREE.Group(); chair.add(at(rbox(0.6, 0.1, 0.55, std(0x4a3a33)), 0, 0.42, 0)); chair.add(at(rbox(0.6, 0.6, 0.1, std(0x4a3a33)), 0, 0.75, -0.28)); chair.add(at(box(0.06, 0.38, 0.06, std(0x333333)), 0, 0.2, 0)); chair.position.set(0, 0, -0.75); g.add(chair);
    d.chair = chair; d.group = g; group.add(g);
  }

  // 약장(다람쥐 뒤), 책장들
  { const cab = new THREE.Group(); cab.add(at(rbox(2.6, 1.7, 0.5, woodD), 0, 0.85, 0)); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) cab.add(at(box(0.34, 0.3, 0.05, std(0xc79a64)), -1.05 + c * 0.42, 0.3 + r * 0.38, 0.26)); cab.position.set(-6.9, FLOOR, -4.85); group.add(cab); }
  const books = [0xc8303a, 0x3f7a46, 0x2f5d8a, 0xe0b04a, 0x8a5a9a, 0xf2f0e6];
  function shelf(x, z, ry, n = 3) { const s = new THREE.Group(); s.add(at(box(1.8, 1.5, 0.45, wood), 0, 0.75, 0)); for (let r = 0; r < n; r++) for (let i = 0; i < 9; i++) { const bk = box(0.15, 0.32 + (i % 3) * 0.04, 0.3, std(books[(i + r * 2) % 6])); bk.position.set(-0.72 + i * 0.18, 0.28 + r * 0.46, 0.1); s.add(bk); } s.position.set(x, FLOOR, z); s.rotation.y = ry; group.add(s); return s; }
  shelf(-12.55, 2.3, Math.PI / 2); shelf(3.75, 2.9, -Math.PI / 2); shelf(-0.6, -4.9, 0, 3);

  // 뒷벽 창틀(낮게) + 화환
  const frame = std(0xe9dcc6);
  for (let x = OFFICE.x0 + 0.2; x <= OFFICE.x1; x += 2.85) group.add(at(box(0.14, 1.9, 0.14, frame), x, FLOOR + 0.95, -5.25));
  group.add(at(box(OFFICE.x1 - OFFICE.x0, 0.14, 0.18, frame), (OFFICE.x0 + OFFICE.x1) / 2, FLOOR + 1.9, -5.25));
  group.add(at(box(OFFICE.x1 - OFFICE.x0, 0.32, 0.18, frame), (OFFICE.x0 + OFFICE.x1) / 2, FLOOR + 0.16, -5.25));
  for (let x = OFFICE.x0 + 0.5; x < OFFICE.x1; x += 0.55) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), x % 1.1 < 0.55 ? green : red); b.position.set(x, FLOOR + 1.85 - Math.abs(Math.sin(x * 1.3)) * 0.1, -5.12); group.add(b); }

  // 크리스마스 트리
  const tree = new THREE.Group(); tree.position.set(SPOTS.tree.x, FLOOR, SPOTS.tree.z);
  const tg = gummy(0x2f8a4a, { roughness: 0.5 });
  tree.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 10), woodD), 0, 0.2, 0));
  [[1.05, 1.0, 0.75], [0.85, 0.9, 1.35], [0.62, 0.8, 1.9], [0.38, 0.7, 2.4]].forEach(([r, h, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), tg); c.position.y = y; c.castShadow = true; tree.add(c); });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), std(0xffd54a, { emissive: 0xffc23a, emissiveIntensity: 1.2 })); star.position.y = 2.88; tree.add(star);
  const lights = []; for (let i = 0; i < 26; i++) { const a = i * 2.39, y = 0.55 + (i / 26) * 2.0, r = 1.0 * (1 - (y - 0.4) / 2.4) + 0.08; const l = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: [0xffd25a, 0xff8f7a, 0x9fe7ff][i % 3], emissiveIntensity: 1 })); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); tree.add(l); lights.push(l); }
  const ornaments = new THREE.Group(); tree.add(ornaments); group.add(tree); const ornGeo = new THREE.SphereGeometry(0.075, 12, 8), ornMats = {};
  upd.push((dt, t, S) => { star.rotation.y += dt; lights.forEach((l, i) => l.material.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * 3 + i * 1.7))); tree.rotation.z = Math.sin(t * 1.1) * 0.012 * S.wind; });
  let ornN = 0; const ornCols = [0xffd54a, 0x9fd8ff, 0xf4f0ff, 0x7ad9a8, 0xffb37a];
  function addOrnament() { if (ornaments.children.length > 40) ornaments.remove(ornaments.children[0]); const y = 0.6 + Math.random() * 1.9, r = 1.0 * (1 - (y - 0.4) / 2.4) + 0.06, a = Math.random() * Math.PI * 2; const ck = ornCols[ornN++ % 5]; const o = new THREE.Mesh(ornGeo, ornMats[ck] || (ornMats[ck] = gummy(ck, { emissive: 0x221100 }))); /* 모양·재질 함께 써서 쌓이지 않게 */ o.position.set(Math.cos(a) * r, y, Math.sin(a) * r); o.scale.setScalar(0.01); o.userData.born = performance.now(); ornaments.add(o); return o; }
  upd.push(() => { const now = performance.now(); ornaments.children.forEach(o => { const k = Math.min(1, (now - o.userData.born) / 350); o.scale.setScalar(k < 1 ? 1.4 * Math.sin(k * Math.PI * 0.75) + 0.01 : 1); }); });

  // 라운지: 소파·탁자·스탠드
  { const sofa = new THREE.Group(), sc = gummy(0xf1e2cc); sofa.add(at(rbox(2.4, 0.38, 0.95, sc), 0, 0.3, 0)); sofa.add(at(rbox(2.4, 0.7, 0.28, sc), 0, 0.6, -0.42)); for (const sx of [-1.2, 1.2]) sofa.add(at(rbox(0.28, 0.55, 0.95, sc), sx, 0.42, 0)); sofa.add(at(rbox(0.55, 0.42, 0.14, gummy(0x5f8a4a)), -0.65, 0.66, -0.25)); sofa.add(at(rbox(0.5, 0.42, 0.14, gummy(0xc8303a)), 0.7, 0.66, -0.25)); const bl = rbox(0.9, 0.06, 1.0, gummy(0xb8323e)); bl.position.set(-0.5, 0.52, 0.05); bl.rotation.z = 0.08; sofa.add(bl);
    sofa.position.set(SPOTS.sofa.x, FLOOR, SPOTS.sofa.z - 0.15); group.add(sofa);
    const tb = new THREE.Group(); tb.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 28), wood), 0, 0.38, 0)); tb.add(at(box(0.08, 0.36, 0.08, woodD), 0, 0.18, 0)); tb.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.12, 12), cream), 0.2, 0.48, 0)); tb.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), std(0x6a6f78, { metalness: 0.4 })), -0.2, 0.52, 0.05)); tb.position.set(SPOTS.sofa.x + 0.2, FLOOR, SPOTS.sofa.z + 1.35); tb.children.forEach(c => c.castShadow = true); group.add(tb);
    const lamp = new THREE.Group(); lamp.add(at(box(0.05, 1.5, 0.05, std(0x333333)), 0, 0.75, 0)); const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.35, 18, 1, true), std(0xfff2c8, { emissive: 0xffd88a, emissiveIntensity: 0.8, side: THREE.DoubleSide })); shade.position.y = 1.55; lamp.add(shade); lamp.position.set(SPOTS.sofa.x - 1.75, FLOOR, SPOTS.sofa.z - 0.3); group.add(lamp);
    const pl = new THREE.PointLight(0xffd59a, 2.2, 4, 1.6); pl.position.set(SPOTS.sofa.x - 1.6, FLOOR + 1.5, SPOTS.sofa.z); group.add(pl); }

  // 셀카존: 링라이트·삼각대·조명 상자
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 12, 40), std(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }));
  { const z = new THREE.Group(); ring.position.set(0, 1.55, 0); z.add(ring); z.add(at(box(0.04, 1.2, 0.04, std(0x222222)), 0, 0.6, 0)); const cam = new THREE.Group(); cam.add(at(box(0.32, 0.22, 0.2, std(0x1f1f24)), 0, 1.12, 0)); cam.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16), std(0x111111)), 0, 1.12, 0.16)); cam.children[1].rotation.x = Math.PI / 2; for (const a of [0, 2.1, 4.2]) { const lg = box(0.03, 1.15, 0.03, std(0x222222)); lg.position.set(Math.cos(a) * 0.22, 0.55, Math.sin(a) * 0.22); lg.rotation.z = Math.cos(a) * 0.2; lg.rotation.x = -Math.sin(a) * 0.2; cam.add(lg); } cam.position.set(-0.9, 0, 0.25); z.add(cam);
    const sb = rbox(0.6, 0.6, 0.15, std(0xffffff, { emissive: 0xfff8e8, emissiveIntensity: 0.7 })); sb.position.set(0.95, 1.5, 0.2); sb.rotation.y = -0.5; z.add(sb); z.add(at(box(0.04, 1.2, 0.04, std(0x222222)), 0.95, 0.6, 0.2));
    z.position.set(SPOTS.ring.x, FLOOR, SPOTS.ring.z); z.rotation.y = -0.6; group.add(z); }

  // 동백 화분 여기저기
  function camellia(x, z, s = 1, onFloor = true) { const g = new THREE.Group(); if (onFloor) { g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.28, 14), std(0xc98455)), 0, 0.14, 0)); }
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), gummy(0x2f6f3c)); bush.position.y = onFloor ? 0.5 : 0.3; bush.castShadow = true; g.add(bush);
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + x, f = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), gummy(0xd8344a, { emissive: 0x330008 })); f.position.set(Math.cos(a) * 0.27, (onFloor ? 0.5 : 0.3) + Math.sin(a * 2) * 0.15, Math.sin(a) * 0.27); g.add(f); }
    g.position.set(x, terrainH(x, z), z); g.scale.setScalar(s); group.add(g); return g; }
  [[-12.3, -4.6], [-8.6, -4.6], [-1.9, -4.7], [3.6, -4.6], [-12.3, 6.0], [-4.6, 6.1], [3.6, 5.8], [-8.4, 2.4]].forEach(([x, z]) => camellia(x, z, 1.05));

  // 뒤쪽 숲: 동백나무·소나무
  const forest = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) { const x = B.x0 + 0.6 + rnd() * (B.W - 1.2), z = -5.9 - rnd() * 2.9; if (Math.abs(x + 4.5 + Math.sin(z * 1.4) * 0.6) < 0.5) continue; const y = terrainH(x, z);
    if (rnd() < 0.55) { const c = camellia(x, z, 1.1 + rnd() * 0.9, false); forest.push(c); } else { const p = new THREE.Group(); p.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6), woodD), 0, 0.15, 0)); for (let k = 0; k < 3; k++) p.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.42 - k * 0.1, 0.55, 8), gummy(0x2b6b3f)), 0, 0.45 + k * 0.3, 0)); p.position.set(x, y, z); p.scale.setScalar(0.9 + rnd() * 0.8); p.children.forEach(m => m.castShadow = true); group.add(p); forest.push(p); } }
  upd.push((dt, t, S) => forest.forEach((f, i) => { f.rotation.z = Math.sin(t * 1.4 + i) * 0.03 * S.wind; }));

  // 동백섬: 등대·바위
  { const lh = new THREE.Group(); for (let i = 0; i < 4; i++) lh.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.02, 0.22 - i * 0.02, 0.28, 16), std(i % 2 ? 0xffffff : 0xd8344a)), 0, 0.14 + i * 0.28, 0)); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), std(0xfff3b0, { emissive: 0xffe28a, emissiveIntensity: 1.4 })); lamp.position.y = 1.27; lh.add(lamp); lh.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 16), std(0xd8344a)), 0, 1.47, 0)); lh.children.forEach(m => m.castShadow = true); lh.position.set(ISLE.x + 0.2, terrainH(ISLE.x + 0.2, ISLE.z - 0.1), ISLE.z - 0.1); group.add(lh);
    upd.push((dt, t) => lamp.material.emissiveIntensity = 0.8 + 0.8 * Math.max(0, Math.sin(t * 2.2)));
    camellia(ISLE.x - 0.55, ISLE.z + 0.35, 0.9, false); camellia(ISLE.x + 0.5, ISLE.z + 0.5, 0.7, false);
    for (const [x, z, s] of [[7.2, 6.8, 0.35], [11.6, -3.2, 0.45], [6.4, -4.5, 0.3], [12.0, 7.5, 0.3]]) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), std(0x9a8f84)); r.position.set(x, -0.05, z); r.castShadow = true; group.add(r); } }

  // 오리배(물자국)
  const duck = new THREE.Group(); { const y = gummy(0xffd23a); const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), y); body.scale.set(1.25, 0.6, 0.9); duck.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), y); hd.position.set(0.38, 0.32, 0); duck.add(hd); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 10), std(0xff8a3a)); bk.rotation.z = -Math.PI / 2; bk.position.set(0.62, 0.3, 0); duck.add(bk); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0x111111)); e.position.set(0.52, 0.38, s * 0.1); duck.add(e); } duck.children.forEach(m => m.castShadow = true); group.add(duck); }

  // 이벤트 장소 빛(바닥 고리)
  const glows = {};
  for (const k of ['tree', 'selfie', 'sofa']) { const g = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.0, depthWrite: false })); g.rotation.x = -Math.PI / 2; g.position.set(SPOTS[k].x, FLOOR + 0.06, SPOTS[k].z + (k === 'sofa' ? 0.4 : k === 'tree' ? 0.2 : 0)); g.scale.setScalar(k === 'tree' ? 1.5 : k === 'sofa' ? 1.6 : 1.2); group.add(g); glows[k] = g; }

  // 눈
  const SN = 1400, sg = new THREE.BufferGeometry(), sp = new Float32Array(SN * 3); for (let i = 0; i < SN; i++) { sp[i * 3] = B.x0 + Math.random() * B.W; sp[i * 3 + 1] = Math.random() * 9; sp[i * 3 + 2] = B.z0 + Math.random() * B.D; }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false })); group.add(snow);
  upd.push((dt, t, S) => { const n = Math.floor(SN * S.snow); sg.setDrawRange(0, n); for (let i = 0; i < n; i++) { sp[i * 3 + 1] -= dt * (0.7 + (i % 7) * 0.08); sp[i * 3] += dt * (S.wind * 1.2 + Math.sin(t + i) * 0.15); if (sp[i * 3 + 1] < terrainH(sp[i * 3], sp[i * 3 + 2]) || sp[i * 3] > B.x1) { sp[i * 3] = B.x0 + Math.random() * B.W; sp[i * 3 + 1] = 7 + Math.random() * 2; sp[i * 3 + 2] = B.z0 + Math.random() * B.D; } } sg.attributes.position.needsUpdate = true; });

  function update(dt, t, S, water) {
    upd.forEach(f => f(dt, t, S));
    // 오리배: 섬을 도는 타원, 물자국
    const a = t * 0.16, px = ISLE.x + Math.cos(a) * 2.6, pz = ISLE.z + Math.sin(a) * 3.4; const nx = ISLE.x + Math.cos(a + 0.05) * 2.6, nz = ISLE.z + Math.sin(a + 0.05) * 3.4;
    duck.position.set(px, water.surfaceY(px, pz) + 0.05, pz); duck.rotation.y = -Math.atan2(nz - pz, nx - px); duck.rotation.z = Math.sin(t * 2.3) * 0.06;
    const bx = px - Math.cos(-duck.rotation.y) * 0.55, bz = pz - Math.sin(-duck.rotation.y) * 0.55; if (water.isWet(bx, bz)) { water.disturb(bx, bz, 0.4, -0.006); if (Math.random() < 0.35) water.addFoam(bx, bz, 1, 0.12); }
    for (const k in glows) { const on = S.event === k || (k === 'sofa' && S.bossRest); glows[k].material.opacity += ((on ? 0.55 + 0.25 * Math.sin(t * 4) : 0.06) - glows[k].material.opacity) * Math.min(1, dt * 4); }
    ring.material.emissiveIntensity = S.flash > 0 ? 3 : 0.6;
  }
  function setFlavor(fl) { screen.emissive.set(fl.screen); }
  return { group, update, addOrnament, setFlavor, duck, tree, ornaments };
}
