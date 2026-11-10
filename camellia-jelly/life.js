// 캐릭터(원장 + 동물 9) · 아기 부엉이 · 길찾기 · 이벤트 · 터치 반응 · 이모지 입자
import * as THREE from 'three';
import { DEPTS, SPOTS, FLOOR } from './world.js';
import * as A from './audio.js';

const gm = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.8, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), ...o });
const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m); s.scale.set(sx, sy, sz); s.castShadow = true; return s; };
const P = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// 생김새: 털색, 옷색, 얼굴색
const LOOK = {
  boss: { fur: 0xf6d2b4, cloth: 0xf8f6f0, face: 0xf6d2b4 },
  ctl: { fur: 0x9b6a3c, cloth: 0x8a5a34, face: 0xf3dfc0 },
  col: { fur: 0xf6e4cc, cloth: 0xf39bb0, face: 0xfaeedd },
  herb: { fur: 0xe08a3a, cloth: 0x3f8a4a, face: 0xf7d9b0 },
  edu: { fur: 0xd99a5c, cloth: 0xf1e3c8, face: 0xf7dcb8 },
  diet: { fur: 0x8f8072, cloth: 0x5f7f3a, face: 0xe9e1d6 },
  vid: { fur: 0xf07a2a, cloth: 0x27365e, face: 0xfff1e2 },
  ops: { fur: 0x8a5a36, cloth: 0x2a3d63, face: 0xe9cfae },
  tang: { fur: 0xb4692e, cloth: 0x3b5f8f, face: 0xf1d2a8 },
  news: { fur: 0xb07a4e, cloth: 0xf07a6a, face: 0xf8e6d0 },
};

function makeChar(id) {
  const L = LOOK[id], root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const fur = gm(L.fur), cloth = gm(L.cloth), face = gm(L.face), black = new THREE.MeshStandardMaterial({ color: 0x1b1410, roughness: 0.2 }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const body = sph(0.3, cloth, 1, 1.12, 0.92); body.position.y = 0.4; rig.add(body);
  const head = new THREE.Group(); head.position.y = 0.88; rig.add(head);
  const skull = sph(0.31, fur, 1.05, 0.96, 0.98); head.add(skull);
  if (id !== 'boss') head.add(P(sph(0.2, face, 1.05, 0.8, 0.6), 0, -0.07, 0.17));
  const eyes = []; for (const s of [-1, 1]) { const e = sph(0.052, black, 1, 1.15, 0.7); e.position.set(s * 0.11, 0.02, 0.27); head.add(e); const hl = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), white); hl.position.set(s * 0.11 + 0.017, 0.045, 0.31); head.add(hl); eyes.push(e); }
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff7f96, transparent: true, opacity: 0.35, depthWrite: false }); const cheeks = [];
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), cheekMat); c.position.set(s * 0.19, -0.06, 0.262); c.rotation.y = s * 0.55; head.add(c); cheeks.push(c); }
  const nose = sph(0.03, id === 'boss' ? face : black, 1.2, 0.8, 1); nose.position.set(0, -0.05, 0.31); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 14, Math.PI), black); mouth.position.set(0, -0.11, 0.29); mouth.rotation.z = Math.PI; head.add(mouth);
  const arms = []; for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(s * 0.28, 0.55, 0.02); const a = sph(0.085, id === 'boss' ? cloth : fur, 1, 1.7, 1); a.position.y = -0.11; pv.add(a); pv.rotation.z = s * 0.35; rig.add(pv); arms.push(pv); }
  const feet = []; for (const s of [-1, 1]) { const f = sph(0.1, id === 'boss' ? gm(0x3a3a44) : fur, 1, 0.6, 1.3); f.position.set(s * 0.13, 0.06, 0.05); rig.add(f); feet.push(f); }
  const extra = {};
  // ---- 팀마다 실루엣 특징 1개를 과장 ----
  if (id === 'boss') { // 동그란 파란 안경 + 투블럭 머리 + 흰 가운
    const hair = sph(0.33, gm(0x4a2e1e), 1.06, 0.62, 1.04); hair.position.set(0, 0.13, -0.02); head.add(hair); const fr = sph(0.18, gm(0x4a2e1e), 1.4, 0.5, 0.6); fr.position.set(0.06, 0.2, 0.2); fr.rotation.z = -0.3; head.add(fr);
    const gl = new THREE.MeshStandardMaterial({ color: 0x3f8ff0, metalness: 0.3, roughness: 0.3 }); for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 8, 24), gl); g.position.set(s * 0.11, 0.02, 0.3); head.add(g); } head.add(P(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), gl), 0, 0.03, 0.31));
    const tie = sph(0.05, gm(0x2a3d63), 0.7, 2.2, 0.5); tie.position.set(0, 0.5, 0.27); rig.add(tie); body.scale.set(0.95, 1.2, 0.9); }
  if (id === 'ctl') { // 커다란 동그란 안경 + 귀깃
    for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 8, 26), new THREE.MeshStandardMaterial({ color: 0x3a2516 })); g.position.set(s * 0.12, 0.02, 0.29); head.add(g); const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), fur); tuft.position.set(s * 0.2, 0.3, 0); tuft.rotation.z = -s * 0.45; tuft.castShadow = true; head.add(tuft); }
    const bk = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 8), gm(0xf4b23a)); bk.rotation.x = Math.PI / 2 + 0.4; bk.position.set(0, -0.06, 0.32); head.add(bk); nose.visible = false;
    for (const s of [-1, 1]) arms[s < 0 ? 0 : 1].children[0].scale.set(0.8, 2.2, 1.6); }
  if (id === 'col') { // 아주 긴 귀
    for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * 0.12, 0.25, -0.02); const o = sph(0.075, fur, 1, 4.6, 0.6); o.position.y = 0.3; const inn = sph(0.045, gm(0xffb3c1), 1, 4.4, 0.4); inn.position.set(0, 0.3, 0.03); e.add(o, inn); e.rotation.z = -s * 0.12; head.add(e); (extra.ears ||= []).push(e); } }
  if (id === 'herb') { // 크게 말린 꼬리
    const tail = new THREE.Group(); for (let i = 0; i < 9; i++) { const t = i / 8; const s = sph(0.17 - t * 0.05, fur); s.position.set(0, 0.25 + Math.sin(t * 2.6) * 0.62, -0.32 - Math.sin(t * 3.4) * 0.35); tail.add(s); } rig.add(tail); extra.tail = tail;
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 10), fur); e.position.set(s * 0.17, 0.3, 0); head.add(e); } }
  if (id === 'edu') { // 큰 뿔
    const ant = gm(0x6b3f22); for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * 0.13, 0.26, 0); const main = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 8), ant); main.position.y = 0.2; main.rotation.z = -s * 0.35; g.add(main);
      for (const [y, l] of [[0.16, 0.18], [0.3, 0.16]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, l, 8), ant); b.position.set(-s * (0.02 - y * 0.35) + s * 0.08, y + 0.04, 0); b.rotation.z = -s * 1.1; g.add(b); } head.add(g); const ear = sph(0.06, fur, 1.8, 0.8, 0.6); ear.position.set(s * 0.3, 0.1, 0); head.add(ear); } }
  if (id === 'diet') { // 줄무늬 큰 꼬리 + 눈 가면
    const mask = sph(0.13, gm(0x3d332c), 2.3, 0.6, 0.6); mask.position.set(0, 0.03, 0.2); head.add(mask); const tail = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = sph(0.14 - i * 0.008, gm(i % 2 ? 0x3d332c : 0xb8a898)); s.position.set(0, 0.2 + i * 0.07, -0.32 - i * 0.1); tail.add(s); } rig.add(tail); extra.tail = tail;
    for (const s of [-1, 1]) head.add(P(sph(0.08, fur, 1, 1, 0.6), s * 0.22, 0.25, 0)); eyes.forEach(e => e.scale.multiplyScalar(1.15)); }
  if (id === 'vid') { // 크고 뾰족한 귀 + 흰 끝 꼬리
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), fur); e.position.set(s * 0.17, 0.33, 0); e.rotation.z = -s * 0.25; e.castShadow = true; head.add(e); }
    const tail = new THREE.Group(); const t1 = sph(0.16, fur, 1, 1, 2.2); t1.position.set(0, 0.25, -0.45); const t2 = sph(0.12, gm(0xffffff), 1, 1, 1.4); t2.position.set(0, 0.3, -0.78); tail.add(t1, t2); tail.rotation.x = -0.35; rig.add(tail); extra.tail = tail; }
  if (id === 'ops') { // 긴 꼬리 + 수염
    const tail = sph(0.1, fur, 0.8, 0.5, 4.2); tail.position.set(0, 0.1, -0.5); rig.add(tail); extra.tail = tail;
    for (const s of [-1, 1]) for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), black); w.rotation.z = Math.PI / 2 + k * 0.15; w.position.set(s * 0.17, -0.06 + k * 0.02, 0.27); head.add(w); }
    for (const s of [-1, 1]) head.add(P(sph(0.06, fur, 1, 1, 0.6), s * 0.24, 0.17, 0)); }
  if (id === 'tang') { // 둥근 큰 귀 + 큰 몸
    body.scale.set(1.25, 1.18, 1.1); for (const s of [-1, 1]) { const e = sph(0.1, fur, 1, 1, 0.6); e.position.set(s * 0.24, 0.25, 0); head.add(e); }
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.04), gm(0x3b5f8f)); strap.position.set(0, 0.42, 0.29); rig.add(strap); }
  if (id === 'news') { // 높게 선 귀 + 말아 올린 꼬리
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 3), fur); e.position.set(s * 0.17, 0.3, 0); e.rotation.z = -s * 0.2; head.add(e); }
    const tail = new THREE.Group(); for (let i = 0; i < 10; i++) { const t = i / 9, s = sph(0.05, fur); s.position.set(Math.sin(t * 3) * 0.12, 0.15 + t * 0.6, -0.32 - Math.sin(t * 2.2) * 0.12); tail.add(s); } rig.add(tail); extra.tail = tail;
    for (const s of [-1, 1]) for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 4), black); w.rotation.z = Math.PI / 2 + k * 0.15; w.position.set(s * 0.17, -0.07 + k * 0.02, 0.27); head.add(w); } }
  root.traverse(o => { if (o.isMesh) o.userData.charId = id; });
  return { id, root, rig, head, body, arms, feet, eyes, cheeks, cheekMat, extra };
}

function makeBabyOwl(col) {
  const g = new THREE.Group(); const f = gm(col), c = gm(0xf6ead6);
  const b = sph(0.13, f, 1, 1.05, 0.95); b.position.y = 0.13; g.add(b); g.add(P(sph(0.09, c, 1, 1, 0.5), 0, 0.15, 0.08));
  for (const s of [-1, 1]) { const e = sph(0.026, new THREE.MeshStandardMaterial({ color: 0x111111 })); e.position.set(s * 0.045, 0.19, 0.115); g.add(e); const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 8), f); t.position.set(s * 0.08, 0.27, 0); t.rotation.z = -s * 0.4; g.add(t); }
  const wings = []; for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.12, 0.17, 0); const wm = sph(0.05, f, 0.5, 1.4, 1); wm.position.y = -0.05; w.add(wm); g.add(w); wings.push(w); }
  const bk = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 6), gm(0xf4b23a)); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.16, 0.14); g.add(bk);
  g.traverse(o => { if (o.isMesh) { o.userData.baby = true; o.castShadow = true; } }); return { g, wings };
}

// 이모지 그림(하트, 느낌표, Z, 땀, 반짝, 음표)
function emojiTex(ch, color) { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.font = '700 72px "Pretendard", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = '#fff'; x.strokeText(ch, 48, 52); x.fillStyle = color; x.fillText(ch, 48, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

const CS = 1.8; // 캐릭터 크기
export function createLife(world, water) {
  const group = new THREE.Group();
  const TEX = { heart: emojiTex('♥', '#ff5f86'), bang: emojiTex('!', '#ffb21f'), z: emojiTex('Z', '#5f7fd8'), sweat: emojiTex('💧', '#6cc4ff'), spark: emojiTex('✦', '#ffd54a'), note: emojiTex('♪', '#8a5a3c'), key: emojiTex('▪', '#5b6b7c'), paper: emojiTex('▭', '#7a7a7a') };
  const POOL = 120, sprites = []; for (let i = 0; i < POOL; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.heart, transparent: true, depthWrite: false })); s.visible = false; s.renderOrder = 10; group.add(s); sprites.push({ s, v: new THREE.Vector3(), life: 0, max: 1, size: 0.3 }); }
  let spI = 0; function emote(kind, pos, n = 1, o = {}) { for (let q = 0; q < n; q++) { const e = sprites[spI = (spI + 1) % POOL]; e.s.material.map = TEX[kind]; e.s.material.needsUpdate = true; e.s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * (o.spread ?? 0.3), 0, (Math.random() - 0.5) * (o.spread ?? 0.3))); e.v.set((Math.random() - 0.5) * (o.vx ?? 0.4), o.vy ?? 0.8, (Math.random() - 0.5) * 0.2); e.life = e.max = o.life ?? 1.2; e.size = o.size ?? 0.3; e.s.visible = true; } }

  const chars = DEPTS.map(d => { const c = makeChar(d.id); c.d = d; c.seat = new THREE.Vector3(d.x, FLOOR, d.z - 0.95); c.root.position.copy(c.seat); c.root.scale.setScalar(CS); group.add(c.root); Object.assign(c, { path: [], state: 'seat', speed: 1.7 + Math.random() * 0.3, t0: Math.random() * 10, tickle: 0, jump: 0, face: 0, blush: 0, walkPh: 0, goal: 'seat' }); return c; });
  const byId = Object.fromEntries(chars.map(c => [c.id, c]));

  // 아기 부엉이 3마리(트리 꼭대기·중간)
  const babies = [[0x8a6a52, 0, 2.62, 0.18], [0x9fb8c8, -0.62, 1.58, 0.55], [0xe8b6c6, 0.66, 1.78, 0.42]].map(([col, x, y, z], i) => { const b = makeBabyOwl(col); b.g.position.set(x, y, z); world.tree.add(b.g); return { ...b, i, flap: 0, base: new THREE.Vector3(x, y, z) }; });

  // ---- 길: 통로 고리 ----
  const AZ1 = -1.75, AZ2 = 2.35, AX0 = -12.2, AX1 = 3.45; const LOOP = [[AX0, AZ1], [AX1, AZ1], [AX1, AZ2], [AX0, AZ2]];
  const segLen = LOOP.map((p, i) => { const q = LOOP[(i + 1) % 4]; return Math.hypot(q[0] - p[0], q[1] - p[1]); }), PER = segLen.reduce((a, b) => a + b, 0);
  function loopParam(x, z) { let best = 1e9, bs = 0, acc = 0; for (let i = 0; i < 4; i++) { const p = LOOP[i], q = LOOP[(i + 1) % 4], dx = q[0] - p[0], dz = q[1] - p[1], L2 = dx * dx + dz * dz; let t = ((x - p[0]) * dx + (z - p[1]) * dz) / L2; t = Math.max(0, Math.min(1, t)); const px = p[0] + dx * t, pz = p[1] + dz * t, dd = Math.hypot(px - x, pz - z); if (dd < best) { best = dd; bs = acc + t * segLen[i]; } acc += segLen[i]; } return bs; }
  function loopPoint(s) { s = ((s % PER) + PER) % PER; let acc = 0; for (let i = 0; i < 4; i++) { if (s <= acc + segLen[i]) { const t = (s - acc) / segLen[i], p = LOOP[i], q = LOOP[(i + 1) % 4]; return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; } acc += segLen[i]; } return LOOP[0]; }
  function alongLoop(sa, sb) { let d = sb - sa; if (d > PER / 2) d -= PER; if (d < -PER / 2) d += PER; const pts = [], dir = Math.sign(d); let acc = 0; const corners = [0, segLen[0], segLen[0] + segLen[1], segLen[0] + segLen[1] + segLen[2]];
    // 지나가는 모서리 넣기
    const steps = Math.ceil(Math.abs(d) / 0.5); for (let k = 1; k <= steps; k++) { const s = sa + d * k / steps; pts.push(loopPoint(s)); } return pts; }
  const exitPts = (c) => { const d = c.d, sx = d.x, sz = d.z - 0.95; return d.row === 1 ? [[sx + 1.65, sz], [sx + 1.65, AZ1]] : d.row === 2 ? [[sx, AZ1]] : [[sx, AZ2]]; };
  function route(c, goalPts, entry) { // 현재 위치 → 통로 → goalPts
    const pts = []; const from = c.root.position; let ax, az;
    if (c.goal === 'seat') { const ex = exitPts(c); pts.push(...ex); [ax, az] = ex[ex.length - 1]; } else if (c.goal === 'sofa') { pts.push([-8.7, 4.6], [-8.7, AZ2]); [ax, az] = [-8.7, AZ2]; } else { const s0 = loopParam(from.x, from.z); [ax, az] = loopPoint(s0); pts.push([ax, az]); }
    const [ex, ez] = entry; pts.push(...alongLoop(loopParam(ax, az), loopParam(ex, ez))); pts.push([ex, ez]); pts.push(...goalPts); c.path = pts; c.state = 'move';
  }
  function sendSeat(c) { if (c.goal === 'seat' && c.state === 'seat') return; const ex = exitPts(c).reverse(); route(c, [...ex.slice(1), [c.seat.x, c.seat.z]], ex[0]); c.goal = 'seat'; c.after = 'seat'; }
  function sendTo(c, x, z, after, goal, entryZ) { const ez = entryZ ?? (z < 0.3 ? AZ1 : AZ2); route(c, [[x, z]], [Math.max(AX0, Math.min(AX1, x)), ez]); c.goal = goal; c.after = after; }

  const S = { mode: 'work', work: 0, event: null, bossRest: false, flash: 0, wind: 0.4, snow: 0.35, paused: false, stats: { selfie: 0, orn: 0, tickle: 0 } };
  let walkClock = 0, eventClock = 0;
  function setMode(m) {
    S.mode = m; S.event = (m === 'selfie' || m === 'tree') ? m : null; eventClock = 0;
    const list = chars.filter(c => !(c.id === 'boss' && S.bossRest));
    if (m === 'work' || m === 'hard') list.forEach(sendSeat);
    if (m === 'walk') list.forEach((c, i) => { c.walkS = (i / list.length) * PER; const [x, z] = loopPoint(c.walkS); sendTo(c, x, z, 'walk', 'walk'); });
    if (m === 'selfie') list.forEach((c, i) => { const row = i < 5 ? 0 : 1, k = row ? i - 5 : i; const x = -0.3 + k * 0.85 + row * 0.42, z = -1.05 - row * 0.85; sendTo(c, x, z, 'selfie', 'selfie', AZ1); });
    if (m === 'tree') list.forEach((c, i) => { const a = -0.15 + (i / Math.max(1, list.length - 1)) * (Math.PI + 0.3); const rr = i % 2 ? 2.15 : 2.9; const x = SPOTS.tree.x + Math.cos(a) * rr * 1.25, z = SPOTS.tree.z + 0.2 + Math.sin(a) * rr; sendTo(c, x, z, 'tree', 'tree', AZ1); });
  }
  function toggleBoss() { const c = byId.boss; c.jump = 0.35; A.pop(1.2);
    if (!S.bossRest) { S.bossRest = true; route(c, [[-8.7, 4.6], [-9.15, 4.45]], [-8.7, AZ2]); c.goal = 'sofa'; c.after = 'lie'; }
    else { S.bossRest = false; c.state = 'stand'; c.root.rotation.z = 0; c.rig.rotation.x = 0; if (S.mode === 'work' || S.mode === 'hard') sendSeat(c); else setMode(S.mode); }
    return S.bossRest; }
  function surprise() { A.gasp(); chars.forEach((c, i) => { c.jump = 0.6 + i * 0.02; emote('bang', c.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 1, { vy: 0.3, life: 1, size: 0.38, spread: 0 }); }); babies.forEach(b => b.flap = 1.2); }
  function tickle(id) { const c = byId[id]; if (!c) return; c.tickle = 1.4; c.blush = 1; S.stats.tickle++; if (id === 'ctl') A.hoot(); else if (id === 'news') A.meow(); else A.giggle(id === 'tang' ? 0.75 : id === 'boss' ? 0.9 : 1.1 + Math.random() * 0.2);
    emote('heart', c.root.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 4, { vy: 0.9, life: 1.3, size: 0.26 }); if (id === 'boss' && (S.bossRest || c.state === 'seat')) toggleBoss(); }
  function pokeBaby(i) { const b = babies[i]; b.flap = 1.6; A.hoot(); emote('note', world.tree.localToWorld(b.base.clone()).add(new THREE.Vector3(0, 0.35, 0)), 2, { size: 0.22 }); }

  const tmp = new THREE.Vector3();
  function update(dt, t) {
    S.flash = Math.max(0, S.flash - dt);
    eventClock += dt; walkClock += dt;
    for (const c of chars) {
      const r = c.root, tt = t + c.t0; let moving = false;
      if (c.state === 'move') {
        const tgt = c.path[0]; if (!tgt) { c.state = c.after === 'seat' ? 'seat' : c.after === 'lie' ? 'lie' : c.after; }
        else { tmp.set(tgt[0] - r.position.x, 0, tgt[1] - r.position.z); const d = tmp.length(), st = c.speed * dt; if (d <= st) { r.position.x = tgt[0]; r.position.z = tgt[1]; c.path.shift(); } else { tmp.multiplyScalar(st / d); r.position.add(tmp); } moving = true; c.face = Math.atan2(tgt[0] - r.position.x, tgt[1] - r.position.z); }
      } else if (c.state === 'walk') { c.walkS += dt * 1.1; const [x, z] = loopPoint(c.walkS), [x2, z2] = loopPoint(c.walkS + 0.3); r.position.x = x; r.position.z = z; c.face = Math.atan2(x2 - x, z2 - z); moving = true; }
      // 몸 방향
      let want = c.state === 'seat' || c.state === 'selfie' ? 0 : c.state === 'tree' ? Math.atan2(SPOTS.tree.x - r.position.x, SPOTS.tree.z - r.position.z) + (r.position.x > SPOTS.tree.x ? -0.8 : 0.8) : c.face; /* 트리 쪽 3/4 옆얼굴 */
      if (c.state === 'lie') want = 0; let da = want - r.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); r.rotation.y += da * Math.min(1, dt * 8);
      // 높이·자세
      c.arms[0].rotation.z = -0.35; c.arms[1].rotation.z = 0.35; c.head.rotation.y = 0; /* 기본 자세로 먼저 되돌림 */
      const seatLift = c.state === 'seat' ? 0.3 : 0; let y = FLOOR + seatLift; c.rig.rotation.set(0, 0, 0); c.rig.position.set(0, 0, 0);
      if (moving) { c.walkPh += dt * 11; y += Math.abs(Math.sin(c.walkPh)) * 0.07; c.rig.rotation.z = Math.sin(c.walkPh) * 0.09; c.feet[0].position.z = 0.05 + Math.sin(c.walkPh) * 0.1; c.feet[1].position.z = 0.05 - Math.sin(c.walkPh) * 0.1; c.arms[0].rotation.x = Math.sin(c.walkPh) * 0.6; c.arms[1].rotation.x = -Math.sin(c.walkPh) * 0.6; }
      else { c.feet[0].position.z = c.feet[1].position.z = 0.05; c.arms[0].rotation.x = c.arms[1].rotation.x = 0; }
      if (c.state === 'seat') { // 일하기: 타이핑 / 자료 정리 / 집중 야근
        const w = S.mode === 'hard' ? S.work : -1, sp = w === 0 ? 26 : 12;
        c.arms[0].rotation.x = -1.1 + Math.sin(tt * sp) * (w === 0 ? 0.35 : 0.15); c.arms[1].rotation.x = -1.1 + Math.sin(tt * sp + 1.6) * (w === 0 ? 0.35 : 0.15); c.head.rotation.x = 0.12 + Math.sin(tt * 1.3) * 0.03; c.feet.forEach(f => f.visible = false);
        if (w === 0 && Math.random() < dt * 6) { emote('key', r.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.5, 0.75)), 1, { vy: 0.7, life: 0.6, size: 0.12 }); if (Math.random() < 0.15) A.tick(); }
        if (w === 1) { c.arms[0].rotation.x = -1.9 + Math.sin(tt * 3) * 0.4; c.head.rotation.y = Math.sin(tt * 1.6) * 0.4; if (Math.random() < dt * 2.2) emote('paper', r.position.clone().add(new THREE.Vector3(0, 1.4, 0.8)), 1, { vy: 1.0, vx: 1.2, life: 1.1, size: 0.2 }); }
        if (w === 2) { c.rig.rotation.x = 0.22; c.rig.position.z = 0.08; c.head.rotation.x = 0.3; if (Math.random() < dt * 1.2) emote('sweat', r.position.clone().add(new THREE.Vector3(0.34, 2.0, 0.3)), 1, { vy: -0.2, life: 0.8, size: 0.18, spread: 0 }); if (Math.random() < dt * 1.5) emote('spark', r.position.clone().add(new THREE.Vector3(0, 2.3, 0)), 1, { vy: 0.6, life: 0.7, size: 0.2 }); }
      } else { c.feet.forEach(f => f.visible = true); c.head.rotation.x = 0; c.head.rotation.y = 0; }
      if (c.state === 'selfie') { y += Math.max(0, Math.sin(tt * 4)) * 0.05; c.arms[1].rotation.z = 2.4; c.arms[1].rotation.x = -0.3; c.arms[0].rotation.z = -0.9 - Math.sin(tt * 6) * 0.2; }
      if (c.state === 'tree') { y += Math.abs(Math.sin(tt * 5)) * 0.18; c.arms[0].rotation.z = -2.2; c.arms[1].rotation.z = 2.2 + Math.sin(tt * 8) * 0.3; }
      if (c.state === 'lie') { r.position.set(-9.15, FLOOR, 4.45); y = FLOOR + 1.0 + Math.sin(tt * 1.6) * 0.02; c.root.rotation.z = Math.PI / 2 - 0.12; /* 머리는 왼쪽 팔걸이 쪽 */ c.feet.forEach(f => f.visible = true); c.head.rotation.x = 0; if (Math.random() < dt * 0.8) { emote('z', r.position.clone().add(new THREE.Vector3(-0.9, 1.3, 0.2)), 1, { vy: 0.5, vx: -0.2, life: 1.8, size: 0.24, spread: 0 }); if (Math.random() < 0.3) A.snore(); } }
      else r.rotation.z = 0;
      // 점프·간지럼·볼
      if (c.jump > 0) { c.jump -= dt; y += Math.sin(Math.max(0, c.jump) / 0.6 * Math.PI) * 0.45; }
      if (c.tickle > 0) { c.tickle -= dt; c.rig.rotation.z += Math.sin(t * 38) * 0.18 * c.tickle; const sq = 1 + Math.sin(t * 30) * 0.08 * c.tickle; c.rig.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); c.eyes.forEach(e => e.scale.y = 0.35); } else { c.rig.scale.set(1, 1, 1); c.eyes.forEach(e => e.scale.y = 1.15 * (Math.sin(tt * 0.9) > 0.985 ? 0.1 : 1)); }
      c.blush = Math.max(0, c.blush - dt * 0.4); c.cheekMat.opacity = 0.35 + c.blush * 0.6;
      if (c.extra.tail) c.extra.tail.rotation.y = Math.sin(tt * (moving ? 6 : 2)) * 0.25; if (c.extra.ears) c.extra.ears.forEach((e, k) => e.rotation.x = Math.sin(tt * 2 + k) * 0.08 - (c.jump > 0 ? 0.4 : 0));
      r.position.y = y;
    }
    // 이벤트 진행
    if (S.event === 'selfie' && chars.some(c => c.state === 'selfie') && eventClock > 2.6) { eventClock = 0; S.flash = 0.18; S.stats.selfie++; A.shutter(); const p = new THREE.Vector3(SPOTS.selfie.x, FLOOR + 1.6, SPOTS.selfie.z); emote('spark', p, 6, { vy: 1.2, vx: 1.6, life: 0.9, size: 0.24, spread: 1.6 }); chars.filter(c => c.state === 'selfie').forEach(c => Math.random() < 0.4 && emote('heart', c.root.position.clone().add(new THREE.Vector3(0, 2.0, 0)), 1, { size: 0.26 })); }
    if (S.event === 'tree' && chars.some(c => c.state === 'tree') && eventClock > 0.75) { eventClock = 0; const o = world.addOrnament(); S.stats.orn++; A.chime(S.stats.orn); emote('spark', world.tree.localToWorld(o.position.clone()), 2, { vy: 0.5, life: 0.7, size: 0.2 }); }
    // 아기 부엉이: 바람 따라 흔들
    babies.forEach(b => { b.flap = Math.max(0, b.flap - dt); const sway = Math.sin(t * (1.6 + b.i * 0.3) + b.i) * (0.05 + S.wind * 0.22); b.g.rotation.z = sway; b.g.position.y = b.base.y + (b.flap > 0 ? Math.abs(Math.sin(t * 16)) * 0.15 : 0); const fl = b.flap > 0 ? Math.sin(t * 40) * 0.9 : Math.sin(t * 3 + b.i) * 0.1 * (0.3 + S.wind); b.wings[0].rotation.z = -0.2 - fl; b.wings[1].rotation.z = 0.2 + fl; });
    // 이모지
    for (const e of sprites) { if (e.life <= 0) { e.s.visible = false; continue; } e.life -= dt; e.s.position.addScaledVector(e.v, dt); e.v.multiplyScalar(0.985); const k = e.life / e.max, sz = e.size * (k > 0.85 ? (1 - k) / 0.15 : 1); e.s.scale.set(sz, sz, sz); e.s.material.opacity = Math.min(1, k * 2.5); }
  }
  function reset() { S.bossRest = false; chars.forEach(c => { c.path = []; c.state = 'seat'; c.goal = 'seat'; c.root.position.copy(c.seat); c.root.rotation.set(0, 0, 0); c.tickle = c.jump = c.blush = 0; }); setMode('work'); }
  return { group, chars, byId, babies, S, setMode, toggleBoss, surprise, tickle, pokeBaby, update, reset, emote };
}
