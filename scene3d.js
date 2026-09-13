/* JanBra OÜ · kapp 3D-s. Laaditakse alles pärast lehe valmimist (main.js), ilma WebGL-ita jääb SVG-kapp.
   Renderdatakse ainult siis, kui midagi muutub (kerimine, kursor, suuruse muutus): mitte ühtegi kaadrit niisama. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const outQuint = t => 1 - Math.pow(1 - t, 5);
const inOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const inOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const seg = (p, a, b, e) => e(clamp01((p - a) / (b - a)));
const rad = THREE.MathUtils.degToRad;

function loadImage(url) {
  return new Promise((resolve, reject) => new THREE.ImageLoader().load(url, resolve, undefined, reject));
}
/* sama pilt 90° vastupäeva: kiud horisontaalselt (plaadid, riiulid) */
function rotateCCW(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalHeight || img.height; c.height = img.naturalWidth || img.width;
  const g = c.getContext('2d');
  g.translate(c.width / 2, c.height / 2); g.rotate(-Math.PI / 2);
  g.drawImage(img, -img.width / 2, -img.height / 2);
  return c;
}

export async function init(box, opts = {}) {
  const mobile = !!opts.mobile;
  const base = new URL('./', import.meta.url);
  const [oakImg, oakN, oakNH] = await Promise.all([
    loadImage(new URL('img/oak.webp', base).href),
    loadImage(new URL('img/oak-n.webp', base).href),
    loadImage(new URL('img/oak-nh.webp', base).href)
  ]);

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  box.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.36;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);

  /* ---- materjalid: tamm (kiud püsti / pikali), pähkel, kask, must metall, kroom ---- */
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const mkTex = (src, srgb, rx, ry) => {
    const t = src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = aniso; t.needsUpdate = true;
    return t;
  };
  const colV = mkTex(oakImg, true, 1, 3), nrmV = mkTex(oakN, false, 1, 3);
  const colH = mkTex(rotateCCW(oakImg), true, 2, 1), nrmH = mkTex(oakNH, false, 2, 1);
  const oakV = new THREE.MeshStandardMaterial({ map: colV, normalMap: nrmV, normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.62, metalness: 0, envMapIntensity: 0.8 });
  const oakH = new THREE.MeshStandardMaterial({ map: colH, normalMap: nrmH, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.62, metalness: 0, envMapIntensity: 0.8 });
  const walnut = new THREE.MeshStandardMaterial({ map: colH, normalMap: nrmH, normalScale: new THREE.Vector2(0.3, 0.3), color: 0x7d5a3c, roughness: 0.55, metalness: 0, envMapIntensity: 0.7 });
  const birch = new THREE.MeshStandardMaterial({ color: 0xd8ccb6, roughness: 0.9, metalness: 0, envMapIntensity: 0.45 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.32, metalness: 0.85 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd9dadc, roughness: 0.22, metalness: 1 });

  /* ---- kapp 1200 × 600 × 2100 mm, plaat 18 mm, sokkel 80 mm ---- */
  const W = 1.2, H = 2.1, D = 0.6, T = 0.018, PL = 0.08;
  const bodyH = H - PL, sideH = bodyH - T;
  const root = new THREE.Group(); scene.add(root);
  const parts = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z), E = (x, y, z) => new THREE.Euler(x, y, z);
  const panel = (w, h, d, mat, r = 0.0035) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    m.castShadow = true; m.receiveShadow = true; return m;
  };
  /* iga osa: kodukoht + lahtivõetud nihe/pööre + kerimisvahemik, kus ta kohale liigub */
  const add = (obj, parent, pos, spec) => {
    parent.add(obj); obj.position.copy(pos); obj.rotation.copy(spec.hrot || E(0, 0, 0));
    parts.push(Object.assign({ obj, home: { pos, rot: spec.hrot || E(0, 0, 0) } }, spec));
    return obj;
  };
  add(panel(W - 2 * T, bodyH - 2 * T, 0.008, birch, 0.002), root, V(0, PL + bodyH / 2, -D / 2 + 0.014), { off: V(0, 0.1, -0.8), rot: E(-0.08, 0, 0), pr: [0.0, 0.3] });
  add(panel(T, sideH, D, oakV), root, V(-(W / 2 - T / 2), PL + sideH / 2, 0), { off: V(-0.75, 0.1, 0), rot: E(0, 0, 0.07), pr: [0.03, 0.33] });
  add(panel(T, sideH, D, oakV), root, V(W / 2 - T / 2, PL + sideH / 2, 0), { off: V(0.75, 0.1, 0), rot: E(0, 0, -0.07), pr: [0.03, 0.33] });
  add(panel(W - 2 * T, T, D, oakH), root, V(0, PL + T / 2, 0), { off: V(0, -0.35, 0.3), rot: E(0.12, 0, 0), pr: [0.08, 0.36] });
  add(panel(W, T, D, oakH), root, V(0, H - T / 2, 0), { off: V(0, 0.5, 0.2), rot: E(-0.16, 0, 0), pr: [0.1, 0.38] });
  add(panel(W - 0.06, PL, D - 0.05, walnut, 0.002), root, V(0, PL / 2, -0.025), { off: V(0, -0.5, 0.4), rot: E(0, 0, 0), pr: [0.12, 0.4] });
  const shelfW = W - 2 * T - 0.002, shelfD = D - 0.04;
  add(panel(shelfW, T, shelfD, oakH), root, V(0, 0.43, -0.02), { off: V(-0.12, 0.05, 0.6), rot: E(0.16, 0.06, 0), pr: [0.36, 0.5] });
  add(panel(shelfW, T, shelfD, oakH), root, V(0, 0.78, -0.02), { off: V(0.12, 0.1, 0.75), rot: E(0.18, -0.06, 0), pr: [0.42, 0.56] });
  add(panel(shelfW, T, shelfD, oakH), root, V(0, 1.75, -0.02), { off: V(0.1, 0.3, 0.65), rot: E(0.16, 0.05, 0), pr: [0.5, 0.62] });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, shelfW - 0.01, 24), chrome);
  rail.castShadow = true;
  add(rail, root, V(0, 1.64, 0), { hrot: E(0, 0, Math.PI / 2), off: V(0, 0.4, 0.55), rot: E(0, 0, 0), pr: [0.54, 0.68] });
  /* uksed: hing välisserval; tulevad lahtiselt, siis sulguvad */
  const doorW = (W - 0.004) / 2 - 0.001, doorH = bodyH - 0.004, doorZ = D / 2 + T / 2 + 0.001, openA = 0.6;
  const doorL = new THREE.Group(), doorR = new THREE.Group();
  const dl = panel(doorW, doorH, T, oakV); dl.position.x = doorW / 2 + 0.001; doorL.add(dl);
  const dr = panel(doorW, doorH, T, oakV); dr.position.x = -(doorW / 2 + 0.001); doorR.add(dr);
  add(doorL, root, V(-W / 2, PL + bodyH / 2, doorZ), { off: V(-0.95, 0, 0.9), rot: E(0, 0.42, 0), pr: [0.6, 0.84], rr: [0.6, 0.84], rease: inOutCubic });
  add(doorR, root, V(W / 2, PL + bodyH / 2, doorZ), { off: V(0.95, 0, 0.9), rot: E(0, openA, 0), pr: [0.6, 0.78], rr: [0.78, 0.9], rease: inOutCubic });
  const handle = () => {
    const g = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 16), black); bar.position.z = 0.022; bar.castShadow = true; g.add(bar);
    for (const dy of [-0.06, 0.06]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.022, 12), black); s.rotation.x = Math.PI / 2; s.position.set(0, dy, 0.011); g.add(s); }
    return g;
  };
  add(handle(), doorL, V(doorW - 0.05, -0.04, T / 2), { off: V(0, 0, 0.3), rot: E(0, 0, 0), pr: [0.9, 0.98], local: true });
  add(handle(), doorR, V(-(doorW - 0.05), -0.04, T / 2), { off: V(0, 0, 0.3), rot: E(0, 0, 0), pr: [0.9, 0.98], local: true });

  /* ---- põrand ainult varju jaoks, valgus: võti + täide + kontuur ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const key = new THREE.DirectionalLight(0xfff0dc, 3.2);
  key.position.set(3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: 1, far: 18 });
  key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02; key.shadow.radius = mobile ? 6 : 9; key.shadow.blurSamples = 12;
  key.target.position.set(0, 1, 0); scene.add(key); scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xdde6ff, 0.55); fill.position.set(-4, 3, 2.5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4); rim.position.set(-1, 4, -4); scene.add(rim);

  /* ---- kaamera, kerimisprogress, kursor ---- */
  let progress = 0, aspect = 1, sx = 1, baseDist = 5, tiltX = 0, tiltY = 0, tX = 0, tY = 0, tilting = false, queued = false;
  const render = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; renderer.render(scene, camera); }); };
  const R = new THREE.Vector3(), Tw = new THREE.Vector3();
  const apply = () => {
    const e = inOutSine(progress);
    const az = rad(34 - 19 * e), el = rad(15 - 7 * e), d = baseDist * (1.46 - 0.46 * e), ty = 1.05 + 0.06 * (1 - e);
    /* lahtivõetud nihked on ekraani suhtes: x = kaamera parem suund, y = üles, z = kaamera poole */
    R.set(Math.cos(az), 0, -Math.sin(az)); Tw.set(Math.sin(az), 0, Math.cos(az));
    for (const p of parts) {
      const kp = 1 - seg(progress, p.pr[0], p.pr[1], p.ease || outQuint);
      const rr = p.rr || p.pr, kr = 1 - seg(progress, rr[0], rr[1], p.rease || p.ease || outQuint);
      if (p.local) p.obj.position.set(p.home.pos.x + p.off.x * kp, p.home.pos.y + p.off.y * kp, p.home.pos.z + p.off.z * kp);
      else { p.obj.position.copy(p.home.pos).addScaledVector(R, p.off.x * kp * sx).addScaledVector(Tw, p.off.z * kp); p.obj.position.y += p.off.y * kp; }
      p.obj.rotation.set(p.home.rot.x + p.rot.x * kr, p.home.rot.y + p.rot.y * kr, p.home.rot.z + p.rot.z * kr);
    }
    camera.position.set(Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
    camera.lookAt(0, ty, 0);
    root.rotation.set(tiltY, tiltX, 0);
  };
  const resize = () => {
    const w = box.clientWidth || 1, h = box.clientHeight || 1;
    aspect = w / h; camera.aspect = aspect;
    sx = Math.max(0.6, Math.min(1, aspect / 1.35));
    const f = Math.tan(rad(camera.fov / 2)) * 2;
    baseDist = Math.max(2.55 / f, 2.3 / (f * aspect));
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    apply();
  };
  const tiltStep = () => {
    const dx = tX - tiltX, dy = tY - tiltY;
    if (Math.abs(dx) < 0.0004 && Math.abs(dy) < 0.0004) { tiltX = tX; tiltY = tY; tilting = false; apply(); render(); return; }
    tiltX += dx * 0.1; tiltY += dy * 0.1; apply(); render(); requestAnimationFrame(tiltStep);
  };
  const nudge = () => { if (!tilting) { tilting = true; requestAnimationFrame(tiltStep); } };
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    box.addEventListener('pointermove', ev => {
      const r = box.getBoundingClientRect();
      tX = ((ev.clientX - r.left) / r.width - 0.5) * 0.18; tY = ((ev.clientY - r.top) / r.height - 0.5) * 0.06; nudge();
    });
    box.addEventListener('pointerleave', () => { tX = 0; tY = 0; nudge(); });
  }
  new ResizeObserver(() => { resize(); render(); }).observe(box);
  canvas.addEventListener('webglcontextlost', ev => { ev.preventDefault(); box.classList.remove('is3d'); });

  resize();
  renderer.render(scene, camera);
  return {
    mode: '3d', ready: true,
    get progress() { return progress; },
    set(p) { progress = clamp01(+p || 0); apply(); render(); },
    render
  };
}
