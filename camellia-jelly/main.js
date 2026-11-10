// 동백숲 운영실 젤리: 장면·조작·패널
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { B, buildTerrain } from './terrain.js';
import { createWater } from './water.js';
import { buildWorld, DEPTS, SPOTS, FLOOR } from './world.js';
import { createLife } from './life.js';
import * as A from './audio.js';

const FLAVORS = [
  { id: 'pudding', name: '연노랑 푸딩', dot: '#f6d978', atten: '#f3cf62', tint: '#fffaf0', deep: '#e7b448', light: '#fff4cf', floorA: '#d8a96f', floorB: '#efd49b', j: ['#fff7d2', '#f7d35c', '#d99a1e'], pill: '#f6cd55', ink: '#5a3a0a', screen: '#ffd27a' },
  { id: 'mint', name: '트리 민트', dot: '#86dcb6', atten: '#7fd6b0', tint: '#f6fffb', deep: '#3fae86', light: '#dcfff0', floorA: '#d2ab76', floorB: '#cfe6c8', j: ['#eafff5', '#7fe0b8', '#2f9e74'], pill: '#72d6a8', ink: '#0f4a33', screen: '#9fffd8' },
  { id: 'snow', name: '눈꽃 소다', dot: '#a9d3f3', atten: '#9fcff0', tint: '#f6fbff', deep: '#5a9fd8', light: '#eef8ff', floorA: '#d2ab76', floorB: '#d9e6f2', j: ['#f4fbff', '#9fd0f5', '#4a8fd0'], pill: '#8cc2ee', ink: '#123a63', screen: '#bfe6ff' },
];
let flavor = FLAVORS[0];

// ---------- 렌더러·장면 ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.02; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xece7de);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 400);

scene.add(new THREE.HemisphereLight(0xfff6e6, 0xb8a58a, 1.1));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.3); sun.position.set(-14, 26, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5); fill.position.set(18, 10, 20); scene.add(fill);
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = B.BOTTOM - 0.02; catcher.receiveShadow = true; scene.add(catcher);

const U = { uTime: { value: 0 }, uLevel: { value: 0 }, uWind: { value: 0.4 } };
const jelly = new THREE.Group(); jelly.matrixAutoUpdate = false; scene.add(jelly);
const terrain = buildTerrain(U); jelly.add(terrain.group); terrain.group.traverse(o => { if (o.isMesh) o.castShadow = true; });
const water = createWater(U); jelly.add(water.group);
const world = buildWorld(); jelly.add(world.group);
const life = createLife(world, water); jelly.add(life.group);
const S = life.S;

// ---------- 카메라·조작 ----------
const controls = new OrbitControls(camera, canvas);
const VIEWS = [{ az: -0.42, pol: 0.96, r: 74, t: [0.6, -0.8, 0] }, { az: 0.0, pol: 0.12, r: 62 }, { az: 0.6, pol: 1.0, r: 64 }, { az: -0.3, pol: 0.9, r: 34, t: [-4.5, 0, 0.5] }];
let viewI = 0;
function applyView(v, instant) { const asp = innerWidth / innerHeight, isMob = innerWidth < 860; const r = v.r * (asp < 1 ? Math.min(3.2, 1.02 / asp) : isMob ? 1.3 : 1); const t = new THREE.Vector3(...(isMob ? [0, -0.8, 0.5] : (v.t || [0, -0.8, 0])));
  const p = new THREE.Vector3(Math.sin(v.az) * Math.sin(v.pol) * r, Math.cos(v.pol) * r, Math.cos(v.az) * Math.sin(v.pol) * r).add(t);
  if (instant) { camera.position.copy(p); controls.target.copy(t); } else { camFly = { p0: camera.position.clone(), p1: p, t0: controls.target.clone(), t1: t, k: 0 }; } }
let camFly = null;
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 14, maxDistance: 260, maxPolarAngle: 1.42, rotateSpeed: 0.7 });
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }; controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  if (w >= 860) { const P = Math.min(150, w * 0.09); camera.setViewOffset(w + P, h, P, 0, w, h); camera.aspect = (w + P) / h; } else camera.clearViewOffset();
  camera.updateProjectionMatrix(); }
addEventListener('resize', () => { resize(); applyView(VIEWS[viewI], true); }); resize(); applyView(VIEWS[0], true);

// ---------- 젤리 흔들기(전단 스프링) ----------
const J = { sx: 0, sz: 0, vx: 0, vz: 0, sy: 0, vy: 0, k: 70, c: 2.4 };
function setBounce(v) { J.k = 25 + v * 1.3; J.c = 4.2 - v * 0.03; }
function jellyMatrix() { const b = B.BOTTOM; jelly.matrix.set(1, J.sx, 0, -J.sx * b, 0, 1 + J.sy, 0, -J.sy * b, 0, J.sz, 1, -J.sz * b, 0, 0, 0, 1); jelly.matrixWorldNeedsUpdate = true; }
function jellyStep(dt) { const ax = -J.k * J.sx - J.c * J.vx, az = -J.k * J.sz - J.c * J.vz; J.vx += ax * dt; J.vz += az * dt; J.sx += J.vx * dt; J.sz += J.vz * dt;
  const ay = -J.k * 1.6 * J.sy - J.c * J.vy - (Math.abs(J.vx) + Math.abs(J.vz)) * 0.02; J.vy += ay * dt; J.sy += J.vy * dt;
  J.sx = Math.max(-0.16, Math.min(0.16, J.sx)); J.sz = Math.max(-0.16, Math.min(0.16, J.sz));
  // 푸딩은 반대로 쏠림 + 가장자리에서 출렁
  water.P.tiltX = J.sx * 0.55; water.P.tiltZ = J.sz * 0.55;
  const acc = Math.hypot(ax, az); if (acc > 0.8) { for (let i = 0; i < 3; i++) { const x = B.x0 + Math.random() * B.W, z = 8.6; if (water.isWet(x, z)) water.disturb(x, z, 0.6, Math.sign(ax) * 0.004 * Math.min(4, acc)); const z2 = -5 + Math.random() * 13; if (water.isWet(12.6, z2)) water.disturb(12.6, z2, 0.6, Math.sign(az) * 0.004 * Math.min(4, acc)); } }
  jellyMatrix(); }

// ---------- 입력 ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickables = []; jelly.traverse(o => { if (o.isMesh && !o.isInstancedMesh) pickables.push(o); });
const toLocal = (p) => jelly.worldToLocal(p.clone()); /* 흔들리는 블록 안 좌표로 */
function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(pickables, false); }
function classify(hits) { for (const h of hits) { const u = h.object.userData; if (u.charId) return { kind: 'char', id: u.charId, h }; if (u.baby) { let o = h.object; while (o && !life.babies.some(b => b.g === o)) o = o.parent; return { kind: 'baby', i: life.babies.findIndex(b => b.g === o), h }; } if (u.kind === 'water') return { kind: 'water', h }; return { kind: 'ground', h }; } return null; }
const levelPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ip = new THREE.Vector3();
function waterPoint(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const lr = ray.ray.clone().applyMatrix4(invJ.copy(jelly.matrixWorld).invert()); levelPlane.constant = -water.P.level; if (!lr.intersectPlane(levelPlane, ip)) return null; if (Math.abs(ip.x) > 14 || Math.abs(ip.z) > 10) return null; return ip.clone(); }
const invJ = new THREE.Matrix4(), qv = new THREE.Vector3();
let drag = null, lastSplashSnd = 0, lastWob = 0;
function endDrag(click) { const d = drag; drag = null; controls.enabled = true; return click ? d : null; }
canvas.addEventListener('pointerdown', (e) => { A.initAudio(); if (drag && e.pointerId !== drag.pid) { endDrag(false); return; } /* 두 번째 손가락: 확대·회전으로 넘김 */ if (e.button !== 0 || (e.pointerType === 'touch' && !e.isPrimary)) return; const c = classify(pick(e)); if (!c) return;
  controls.enabled = false; drag = { pid: e.pointerId, kind: c.kind, x: e.clientX, y: e.clientY, last: c.kind === 'water' ? waterPoint(e) : null, moved: 0, c };
  if (c.kind === 'water' && drag.last && water.isWet(drag.last.x, drag.last.z)) { water.disturb(drag.last.x, drag.last.z, 0.6, -0.05); water.addFoam(drag.last.x, drag.last.z, 6); }
}, true);
addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.pid) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.hypot(dx, dy); drag.x = e.clientX; drag.y = e.clientY;
  if (drag.kind === 'water') { const p = waterPoint(e); if (p && drag.last) { const d = p.distanceTo(drag.last), n = Math.min(14, Math.max(1, Math.ceil(d / 0.25))); for (let i = 1; i <= n; i++) { const q = qv.copy(drag.last).lerp(p, i / n); if (water.isWet(q.x, q.z)) { water.disturb(q.x, q.z, 0.7, -0.16 - Math.min(0.12, d * 0.03)); if (Math.random() < 0.7) water.addFoam(q.x, q.z, 3, 0.25); } }
      const sp = d / Math.max(1e-3, 1 / 60); if (sp > 18 && water.isWet(p.x, p.z)) { water.splashAt(p.x, water.surfaceY(p.x, p.z), p.z, 4, 0.7); const now = performance.now(); if (now - lastSplashSnd > 260) { A.splash(0.6); lastSplashSnd = now; } } } drag.last = p; }
  else if (drag.kind === 'ground' || (drag.kind === 'char' && drag.moved > 8)) { const az = controls.getAzimuthalAngle(), cs = Math.cos(az), sn = Math.sin(az); const wx = dx * cs + dy * sn, wz = -dx * sn + dy * cs; J.vx += wx * 0.0045; J.vz += wz * 0.0045; J.vy -= Math.hypot(dx, dy) * 0.0006; const now = performance.now(); if (now - lastWob > 380 && Math.hypot(dx, dy) > 6) { A.wobble(Math.min(1.2, Math.hypot(dx, dy) / 30)); lastWob = now; } }
});
addEventListener('pointercancel', () => { if (drag) endDrag(false); }); addEventListener('blur', () => { if (drag) endDrag(false); });
addEventListener('pointerup', (e) => { if (!drag || e.pointerId !== drag.pid) return; const d = endDrag(true);
  if (d.moved < 6) { if (d.c.kind === 'char') life.tickle(d.c.id); else if (d.c.kind === 'baby' && d.c.i >= 0) life.pokeBaby(d.c.i); else if (d.c.kind === 'ground') { J.vy -= 0.25; A.pop(0.8); } else if (d.c.kind === 'water') { const p = toLocal(d.c.h.point); water.splashAt(p.x, water.surfaceY(p.x, p.z), p.z, 8, 0.8); A.splash(0.5); } }
  updateStats(); });
canvas.addEventListener('dblclick', (e) => { const c = classify(pick(e)); if (c && c.kind === 'water') { const p = toLocal(c.h.point); water.disturb(p.x, p.z, 1.4, -0.22); water.splashAt(p.x, water.surfaceY(p.x, p.z), p.z, 36, 1.3); water.addFoam(p.x, p.z, 24, 0.8); A.splash(1.2); life.surprise(); toast('모두 깜짝!'); } });

// ---------- 패널 ----------
const $ = (s) => document.querySelector(s);
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1500); }
const HARD = ['타이핑 다다다', '자료 정리', '집중 모드'];
document.querySelectorAll('.act').forEach(b => b.addEventListener('click', () => { A.initAudio(); A.pop(1.1); const m = b.dataset.mode;
  if (m === 'hard') { if (S.mode === 'hard') S.work = (S.work + 1) % 3; else S.work = 0; b.textContent = '열일하기 · ' + HARD[S.work]; } else $('#hard').textContent = '열일하기';
  life.setMode(m); document.querySelectorAll('.act').forEach(x => x.classList.toggle('on', x === b)); toast({ work: '업무 시작!', walk: '사무실 한 바퀴 산책', selfie: '셀카존으로 모여요', tree: '트리를 꾸며요', hard: '열일 모드: ' + HARD[S.work] }[m]); }));
$('#boss').addEventListener('click', () => { A.initAudio(); const r = life.toggleBoss(); syncBoss(); toast(r ? '원장님 소파에서 쉬는 중' : '원장님 다시 자리로'); });
function syncBoss() { const b = $('#boss'); b.classList.toggle('on', S.bossRest); b.innerHTML = S.bossRest ? '원장님 업무 복귀 <small>자리로 돌아가기</small>' : '원장님 휴식 <small>소파로 가서 눕기</small>'; }
function updateStats() { $('#st-selfie').textContent = S.stats.selfie; $('#st-orn').textContent = S.stats.orn; $('#st-tickle').textContent = S.stats.tickle; syncBoss(); }
setInterval(updateStats, 500);

const fl = $('#flavors'); FLAVORS.forEach((f, i) => { const b = document.createElement('button'); b.className = 'flv' + (i ? '' : ' on'); b.innerHTML = `<i style="background:radial-gradient(circle at 35% 30%, #fff 0 12%, ${f.dot} 45%, ${f.deep})"></i>${f.name}`; b.onclick = () => { A.initAudio(); A.pop(1.3); setFlavor(f); fl.querySelectorAll('.flv').forEach(x => x.classList.toggle('on', x === b)); }; fl.appendChild(b); });
function setFlavor(f) { flavor = f; water.setFlavor(f); terrain.recolor(f); world.setFlavor(f); const r = document.documentElement.style; r.setProperty('--j1', f.j[0]); r.setProperty('--j2', f.j[1]); r.setProperty('--j3', f.j[2]); r.setProperty('--pill', f.pill); r.setProperty('--pillInk', f.ink); }

const sl = (id, fn) => { const el = $('#' + id); const run = () => fn(+el.value); el.addEventListener('input', run); run(); };
sl('bounce', v => { setBounce(v); $('#v-bounce').textContent = v; });
sl('calm', v => { water.P.damp = 0.997 - v * 0.00018; water.P.amp = 1.9 - v * 0.008; $('#v-calm').textContent = v; });
sl('tide', v => { water.P.level = v / 100 * 0.28; U.uLevel.value = water.P.level; $('#v-tide').textContent = v < -30 ? '썰물' : v > 30 ? '밀물' : '보통'; });
sl('wind', v => { S.wind = v / 100; water.P.wind = v / 100; U.uWind.value = v / 100; $('#v-wind').textContent = v; });
sl('snow', v => { S.snow = v / 100; $('#v-snow').textContent = v; });
$('#reset').onclick = () => { A.pop(); water.reset(); life.reset(); J.sx = J.sz = J.vx = J.vz = J.sy = J.vy = 0; viewI = 0; applyView(VIEWS[0]); document.querySelectorAll('.act').forEach(x => x.classList.toggle('on', x.dataset.mode === 'work')); $('#hard').textContent = '열일하기'; updateStats(); toast('처음처럼'); };
$('#pause').onclick = (e) => { S.paused = !S.paused; e.target.textContent = S.paused ? '계속' : '멈춤'; e.target.classList.toggle('on', S.paused); };
$('#sound').onclick = (e) => { A.initAudio(); const v = !e.target.classList.contains('on'); A.setSound(v); e.target.classList.toggle('on', v); e.target.textContent = v ? '소리 끄기' : '소리 켜기'; if (v) A.giggle(); };
A.setSound(false);
$('#view').onclick = () => { viewI = (viewI + 1) % VIEWS.length; applyView(VIEWS[viewI]); };
$('#tags').onclick = (e) => { document.body.classList.toggle('notags'); e.target.classList.toggle('on', !document.body.classList.contains('notags')); };
$('#fold').onclick = (e) => { const p = $('#panel'); p.classList.toggle('folded'); e.target.textContent = p.classList.contains('folded') ? '+' : '–'; };
if (innerWidth < 860) { $('#panel').classList.add('folded'); $('#fold').textContent = '+'; }

// 제목: 글자 한 알씩
{ const h = $('#title'); [['Camellia-Grove', 's'], ['KMC Office', 'm'], ['Jelly.', 'l']].forEach(([t, k]) => { const ln = document.createElement('span'); ln.className = 'ln ' + k; [...t].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'ch' + (ch === ' ' ? ' sp' : '') + (ch === '.' ? ' dot' : ''); s.textContent = ch === ' ' ? '\u00a0' : ch; s.style.animationDelay = (i * 0.11) + 's'; s.addEventListener('pointerenter', () => { A.initAudio(); A.pop(0.9 + Math.random() * 0.5); }); ln.appendChild(s); }); h.appendChild(ln); }); }

// ---------- 이름표 ----------
const TAGS = [...DEPTS.map(d => ({ t: d.name, s: d.sub, p: new THREE.Vector3(d.x, FLOOR + 2.6, d.z - 0.9) })),
  { t: '크리스마스 트리', s: '아기 부엉이 3', p: new THREE.Vector3(SPOTS.tree.x, FLOOR + 3.45, SPOTS.tree.z) }, { t: '셀카존', s: '링라이트', p: new THREE.Vector3(SPOTS.ring.x, FLOOR + 2.4, SPOTS.ring.z) },
  { t: '라운지', s: '원장님 소파', p: new THREE.Vector3(SPOTS.sofa.x, FLOOR + 1.6, SPOTS.sofa.z) }, { t: '동백섬 등대', s: '오리배 한 바퀴', p: new THREE.Vector3(9.6, 2.3, 1.1) }, { t: '동백숲', s: '언덕 오솔길', p: new THREE.Vector3(-4.5, 3.0, -7.6) }];
const lab = $('#labels'); TAGS.forEach(g => { const el = document.createElement('div'); el.className = 'tag'; el.innerHTML = `${g.t}<small>${g.s}</small><i></i>`; lab.appendChild(el); g.el = el; });
const v3 = new THREE.Vector3();
function placeTags() { const w = innerWidth, h = innerHeight; const placed = [];
  for (const g of TAGS) { v3.copy(g.p).applyMatrix4(jelly.matrixWorld).project(camera); g.vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; g.sx = (v3.x + 1) / 2 * w; g.sy = (1 - v3.y) / 2 * h; g.w = g.el.offsetWidth || 110; }
  /* 겹치면 위로 올리고 핀 줄을 늘림(아래쪽 이름표부터 자리 잡기) */
  for (const g of [...TAGS].sort((a, b) => b.sy - a.sy)) { let lift = 0; const maxK = w < 860 ? 2 : 8; let ok = true; for (let k = 0; k <= maxK; k++) { if (k === maxK) { ok = false; break; } const y = g.sy - 22 - lift; const hit = placed.find(p => Math.abs(p.x - g.sx) < (p.w + g.w) / 2 + 4 && Math.abs(p.y - y) < 27); if (!hit) break; lift += 27; } g.lift = lift; placed.push({ x: g.sx, y: g.sy - 22 - lift, w: g.w });
    g.el.style.opacity = g.vis && ok ? 1 : 0; g.el.style.left = g.sx + 'px'; g.el.style.top = (g.sy - 22 - lift) + 'px'; g.el.style.setProperty('--stem', (16 + lift) + 'px'); } }

// ---------- 반복 ----------
const clock = new THREE.Clock(); let T = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  if (camFly) { camFly.k = Math.min(1, camFly.k + dt * 1.6); const e = 1 - Math.pow(1 - camFly.k, 3); camera.position.lerpVectors(camFly.p0, camFly.p1, e); controls.target.lerpVectors(camFly.t0, camFly.t1, e); if (camFly.k >= 1) camFly = null; }
  if (!S.paused) { T += dt; U.uTime.value = T; jellyStep(dt); water.update(dt, T, flavor); world.update(dt, T, S, water); life.update(dt, T); }
  controls.update(); jelly.updateMatrixWorld(true); placeTags(); renderer.render(scene, camera); requestAnimationFrame(frame);
}
setFlavor(FLAVORS[0]); jellyMatrix(); frame();

// QA·시연용
window.__jelly = { getDrag: () => drag, pick: (x, y) => { const c = classify(pick({ clientX: x, clientY: y })); return c && { kind: c.kind, id: c.id, obj: c.h.object.name || c.h.object.type, p: c.h.point.toArray().map(v => +v.toFixed(2)) }; }, life, water, J, S, setFlavor, FLAVORS, camera, controls, toast, applyView, VIEWS };
