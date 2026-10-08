/**
 * Low-poly models for the Shop items and guild badges, in the Karela palette
 * with flat shading to match Ani. render.mjs loads this in headless Chrome
 * and calls window.renderItem(id) for every id in ITEMS.
 * To add an item: add a model to ITEMS, run render.mjs, then add the file to
 * services/gameArt.ts.
 */
import * as THREE from "./three.module.js";

// Karela palette only (styles/designSystem.ts).
const C = {
  lime: 0x7cf205, teal: 0x209f77, aqua: 0x00f5d4, sky: 0x00bbf9,
  orange: 0xff9f1c, coral: 0xff4d6d, gold: 0xffd60a, ink: 0xf3f5ee, deep: 0x17211a,
};

const SIZE = 256;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.55, metalness: 0.05, ...extra });

const freshScene = () => {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0b0f0c, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.aqua, 1.6);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  return scene;
};

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

/** Frames the object so its bounding sphere fills the picture. */
const shoot = (scene, obj, { tiltX = -0.35, turnY = 0.6, fill = 1.12 } = {}) => {
  obj.rotation.x += tiltX;
  obj.rotation.y += turnY;
  scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  obj.position.sub(sphere.center);
  const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / fill;
  camera.position.set(0, sphere.radius * 0.15, dist);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/webp", 0.86);
};

// ---------- Models ----------

const gem = (color = C.sky) => {
  const g = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 1, 0.42, 8), mat(color, { roughness: 0.25, metalness: 0.2 }));
  crown.position.y = 0.21;
  const pav = new THREE.Mesh(new THREE.ConeGeometry(1, 1.15, 8), mat(color, { roughness: 0.25, metalness: 0.2 }));
  pav.rotation.x = Math.PI;
  pav.position.y = -0.575;
  g.add(crown, pav);
  return g;
};

const iceCluster = () => {
  const g = new THREE.Group();
  const shard = (h, x, z, rz, rx, color) => {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), mat(color, { roughness: 0.2, metalness: 0.1, emissive: color, emissiveIntensity: 0.12 }));
    m.scale.set(1, h, 1);
    m.position.set(x, h * 0.32, z);
    m.rotation.set(rx, 0.3, rz);
    g.add(m);
  };
  shard(2.6, 0, 0, 0, 0, C.aqua);
  shard(1.8, -0.55, 0.15, 0.45, 0.1, C.sky);
  shard(1.6, 0.55, -0.1, -0.4, -0.1, C.aqua);
  shard(1.1, 0.15, 0.55, -0.15, 0.5, C.ink);
  return g;
};

const flameGeo = (scale = 1) => {
  const pts = [];
  const prof = [[0, 0], [0.5, 0.1], [0.72, 0.42], [0.68, 0.82], [0.5, 1.18], [0.36, 1.5], [0.2, 1.85], [0.07, 2.2], [0, 2.4]];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r * scale, y * scale));
  return new THREE.LatheGeometry(pts, 7);
};

const flame = (outer = C.orange, inner = C.gold) => {
  const g = new THREE.Group();
  const o = new THREE.Mesh(flameGeo(1), mat(outer, { emissive: outer, emissiveIntensity: 0.25 }));
  const i = new THREE.Mesh(flameGeo(0.6), mat(inner, { emissive: inner, emissiveIntensity: 0.35 }));
  i.position.set(0, 0.02, 0.22);
  // Two side tongues so it reads as fire, not a cone.
  const l = new THREE.Mesh(flameGeo(0.42), mat(outer, { emissive: outer, emissiveIntensity: 0.25 }));
  l.position.set(-0.36, 0.08, 0.05);
  l.rotation.z = 0.32;
  const r = l.clone();
  r.position.x = 0.36;
  r.rotation.z = -0.32;
  r.scale.y = 0.85;
  // A coral glow at the base, where a real flame is hottest.
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(C.coral, { emissive: C.coral, emissiveIntensity: 0.3 }));
  core.scale.set(1.25, 0.55, 1.1);
  core.position.y = 0.2;
  g.add(core, o, i, l, r);
  return g;
};

const repair = () => {
  const g = flame();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.1, 5, 12), mat(C.lime));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.6;
  band.scale.set(1.1, 1.1, 1.1);
  const band2 = band.clone();
  band2.position.y = 0.95;
  band2.scale.setScalar(0.88);
  g.add(band, band2);
  return g;
};

/** The Bayanihan: a nipa hut on stilts with two bamboo carrying poles. */
const hut = () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.2), mat(C.teal));
  body.position.y = 0.75;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.95, 4), mat(C.gold));
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 1);
  roof.position.y = 1.62;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), mat(C.deep));
  door.position.set(0, 0.6, 0.61);
  g.add(body, roof, door);
  for (const [x, z] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]]) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 5), mat(C.gold));
    stilt.position.set(x, 0.1, z);
    g.add(stilt);
  }
  for (const z of [-0.5, 0.5]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 6), mat(C.lime));
    pole.rotation.z = Math.PI / 2;
    pole.position.set(0, 0.3, z);
    g.add(pole);
  }
  return g;
};

const hexBase = (color = C.teal, r = 1.1, h = 0.32) => new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 6), mat(color));

const flag = (color = C.lime, withBase = true) => {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.4, 6), mat(C.ink));
  pole.position.set(-0.5, 1.2, 0);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(1.25, 0); shape.lineTo(0.95, -0.38); shape.lineTo(1.25, -0.76); shape.lineTo(0, -0.76); shape.lineTo(0, 0);
  const cloth = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }), mat(color));
  cloth.position.set(-0.45, 2.35, -0.04);
  g.add(pole, cloth);
  if (withBase) {
    const base = hexBase(C.teal, 0.85, 0.26);
    base.position.y = 0.0;
    g.add(base);
  }
  return g;
};

const ribbon = (colors) => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.6, -0.6, 0.3), new THREE.Vector3(-0.8, 0.2, -0.2), new THREE.Vector3(0, -0.3, 0.2),
    new THREE.Vector3(0.8, 0.4, -0.2), new THREE.Vector3(1.5, 0.9, 0.1),
  ]);
  const geo = new THREE.TubeGeometry(curve, 48, 0.17, 6, false);
  let m;
  if (colors.length > 1) {
    const col = [];
    const pos = geo.attributes.position;
    const cs = colors.map((c) => new THREE.Color(c));
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(0.999, Math.max(0, (pos.getX(i) + 1.6) / 3.1)) * (cs.length - 1);
      const a = cs[Math.floor(t)], b = cs[Math.min(cs.length - 1, Math.floor(t) + 1)];
      const c = a.clone().lerp(b, t - Math.floor(t));
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true }));
  } else {
    m = new THREE.Mesh(geo, mat(colors[0], { emissive: colors[0], emissiveIntensity: 0.15 }));
  }
  const g = new THREE.Group();
  g.add(m);
  const end = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat(colors[colors.length - 1]));
  end.position.set(1.5, 0.9, 0.1);
  const start = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), mat(C.ink));
  start.position.set(-1.6, -0.6, 0.3);
  g.add(end, start);
  return g;
};

const ring = (colors) => {
  const g = new THREE.Group();
  const half = (c, start) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 6, 14, Math.PI), mat(c, { roughness: 0.35, metalness: 0.25 }));
    t.rotation.z = start;
    return t;
  };
  g.add(half(colors[0], 0), half(colors[1] ?? colors[0], Math.PI));
  const jewel = gem(colors[0]);
  jewel.scale.setScalar(0.3);
  jewel.position.set(0, 1.12, 0.05);
  g.add(jewel);
  return g;
};

const heart = (color = C.coral) => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.3, 0, -0.9, 0.95, 0, 0.45);
  s.bezierCurveTo(0.9, 0.95, 1.3, 0, 0, -0.9);
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1, curveSegments: 5 }), mat(color));
};

const shieldMesh = (color = C.sky) => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.95); s.lineTo(0.8, 0.7); s.lineTo(0.75, 0.0); s.quadraticCurveTo(0.6, -0.65, 0, -1); s.quadraticCurveTo(-0.6, -0.65, -0.75, 0); s.lineTo(-0.8, 0.7); s.lineTo(0, 0.95);
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1, curveSegments: 4 }), mat(color));
};

/** Hexagonal medal standing up, with an emblem on its face. */
const medal = (emblem, rim = C.gold) => {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.28, 6), mat(rim, { roughness: 0.35, metalness: 0.35 }));
  disc.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 6), mat(C.deep));
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.02;
  g.add(disc, face);
  emblem.position.z += 0.22;
  g.add(emblem);
  return g;
};

const ITEMS = {
  gem: () => [gem(), {}],
  streak_freeze: () => [iceCluster(), { tiltX: -0.25 }],
  streak_repair: () => [repair(), { tiltX: -0.2 }],
  bayanihan_boost: () => [hut(), { tiltX: -0.3, turnY: 0.7 }],
  territory_boost: () => [flag(C.lime), { tiltX: -0.25, turnY: 0.5 }],
  trail_aqua: () => [ribbon([C.aqua]), { tiltX: -0.5, turnY: 0.2 }],
  trail_sky: () => [ribbon([C.sky]), { tiltX: -0.5, turnY: 0.2 }],
  trail_teal: () => [ribbon([C.teal]), { tiltX: -0.5, turnY: 0.2 }],
  trail_gold: () => [ribbon([C.gold]), { tiltX: -0.5, turnY: 0.2 }],
  trail_karela: () => [ribbon([C.lime, C.aqua, C.teal]), { tiltX: -0.5, turnY: 0.2 }],
  frame_aqua: () => [ring([C.aqua, C.sky]), { tiltX: -0.15, turnY: 0.35 }],
  frame_ember: () => [ring([C.orange, C.gold]), { tiltX: -0.15, turnY: 0.35 }],
  frame_gold: () => [ring([C.gold, C.gold]), { tiltX: -0.15, turnY: 0.35 }],
  badge_pioneer: () => {
    const f = flag(C.lime, false);
    f.scale.setScalar(0.55);
    f.position.set(0.1, -0.68, 0);
    return [medal(f), { tiltX: -0.1, turnY: 0.35 }];
  },
  badge_century_walkers: () => {
    const r = ribbon([C.lime, C.aqua]);
    r.scale.setScalar(0.42);
    return [medal(r), { tiltX: -0.1, turnY: 0.35 }];
  },
  badge_bayanihan_heart: () => {
    const h = heart();
    h.scale.setScalar(0.62);
    h.position.y = 0.05;
    return [medal(h), { tiltX: -0.1, turnY: 0.35 }];
  },
  badge_iron_streak: () => {
    const f = flame();
    f.scale.setScalar(0.42);
    f.position.y = -0.42;
    return [medal(f), { tiltX: -0.1, turnY: 0.35 }];
  },
  badge_vanguard_guild: () => {
    const s = shieldMesh();
    s.scale.setScalar(0.6);
    return [medal(s), { tiltX: -0.1, turnY: 0.35 }];
  },
};

window.renderItem = (id) => {
  const [obj, opts] = ITEMS[id]();
  return shoot(freshScene(), obj, opts);
};
window.ITEM_IDS = Object.keys(ITEMS);
window.ready = true;
