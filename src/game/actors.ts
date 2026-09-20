import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CELL } from "./maze";
import { NPCS, glyphLabel, type BoonId, type Glyph, type NpcId, type QuestItemId } from "./content";

/** NPCs with a Meshy-generated mesh; the rest stay procedural. */
const NPC_MODEL_URL: Partial<Record<NpcId, string>> = {
  bramble: "/models/npc/bramble.glb",
  vellum: "/models/npc/vellum.glb",
  calden: "/models/npc/calden.glb",
};
const NPC_MODEL_HEIGHT = 1.7;

const gltfLoader = new GLTFLoader();
const npcModelCache = new Map<NpcId, THREE.Object3D>();
const npcModelLoads = new Map<NpcId, Promise<THREE.Object3D | null>>();

function deepCloneModel(root: THREE.Object3D): THREE.Object3D {
  const clone = root.clone(true);
  clone.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry = o.geometry.clone();
    o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
  });
  return clone;
}

function loadNpcModel(id: NpcId): Promise<THREE.Object3D | null> {
  const url = NPC_MODEL_URL[id];
  if (!url) return Promise.resolve(null);
  const cached = npcModelCache.get(id);
  if (cached) return Promise.resolve(cached);
  let pending = npcModelLoads.get(id);
  if (!pending) {
    pending = new Promise((resolve) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const scale = size.y > 0 ? NPC_MODEL_HEIGHT / size.y : 1;
          root.scale.setScalar(scale);
          root.position.y -= box.min.y * scale;
          npcModelCache.set(id, root);
          resolve(root);
        },
        undefined,
        () => resolve(null),
      );
    });
    npcModelLoads.set(id, pending);
  }
  return pending;
}

function mat(
  color: number,
  opts?: { emissive?: number; emissiveIntensity?: number; transparent?: boolean; opacity?: number },
) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
  });
}

function limb(h: number, r: number, color: number) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 6), mat(color));
}

export function makeNpc(id: NpcId): THREE.Group {
  const def = NPCS[id];
  const g = new THREE.Group();
  g.name = `npc:${id}`;

  if (id === "bramble") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.7, 7), mat(def.color));
    body.position.y = 0.42;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 6), mat(0xc48a62));
    head.position.y = 0.9;
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 7), mat(0x2e4a2c));
    hood.position.y = 1.08;
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 6), mat(0xb45a28));
    beard.position.set(0, 0.72, 0.14);
    beard.rotation.x = 0.45;
    g.add(body, head, hood, beard);
  } else if (id === "vellum") {
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 1.35, 7),
      mat(0xc8d8e8, { emissive: 0x6a88aa, emissiveIntensity: 0.28, transparent: true, opacity: 0.72 }),
    );
    body.position.y = 0.85;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 7, 6),
      mat(0xd8e8f4, { emissive: 0x88aacc, emissiveIntensity: 0.22, transparent: true, opacity: 0.8 }),
    );
    head.position.y = 1.58;
    const veil = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.4, 6),
      mat(0xe8f0f8, { transparent: true, opacity: 0.5 }),
    );
    veil.position.y = 1.78;
    g.add(body, head, veil);
  } else if (id === "grik") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 6), mat(0x5a7a32));
    body.position.y = 0.34;
    body.scale.set(1, 0.85, 0.9);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 6), mat(0x6a8a3a));
    head.position.y = 0.68;
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 5), mat(0x6a8a3a));
    earL.position.set(-0.18, 0.78, 0);
    earL.rotation.z = 0.6;
    const earR = earL.clone();
    earR.position.x = 0.18;
    earR.rotation.z = -0.6;
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 6), mat(0x5a2a58));
    coat.position.y = 0.28;
    g.add(body, head, earL, earR, coat);
  } else if (id === "calden") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 1.05, 7), mat(0x6a6e78));
    body.position.y = 0.62;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 6), mat(0xc4a07a));
    head.position.y = 1.28;
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.22, 7), mat(0x8a9098, { emissive: 0x334044, emissiveIntensity: 0.1 }));
    helm.position.y = 1.42;
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.38), mat(0x5a4030));
    shield.position.set(-0.38, 0.7, 0.05);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0xd4a84b, { emissive: 0x6a4a10, emissiveIntensity: 0.2 }));
    boss.position.set(-0.43, 0.7, 0.05);
    g.add(body, head, helm, shield, boss);
  } else {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.1, 7), mat(0xc4a060));
    body.position.y = 0.62;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 6), mat(0xb88968));
    head.position.y = 1.28;
    const glasses = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 5, 8), mat(0xd4c4a0));
    glasses.position.set(0, 1.3, 0.14);
    glasses.rotation.x = Math.PI / 2;
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      mat(0xffd27a, { emissive: 0xff9a4a, emissiveIntensity: 0.7 }),
    );
    lantern.position.set(0.28, 0.85, 0.12);
    const handle = limb(0.2, 0.02, 0x5c4033);
    handle.position.set(0.28, 1.0, 0.12);
    g.add(body, head, glasses, lantern, handle);
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });

  if (NPC_MODEL_URL[id]) {
    void loadNpcModel(id).then((model) => {
      if (!model || !g.parent) return;
      g.clear();
      g.add(deepCloneModel(model));
    });
  }

  return g;
}

export function makeQuestItem(kind: QuestItemId): THREE.Group {
  const g = new THREE.Group();
  if (kind === "compass") {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 10), mat(0xd4a84b, { emissive: 0x6a4a10, emissiveIntensity: 0.25 })));
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.16), mat(0x8b2e2e));
    needle.position.y = 0.04;
    g.add(needle);
  } else if (kind === "page") {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.28), mat(0xf2ebe0, { emissive: 0x88aacc, emissiveIntensity: 0.15 }));
    g.add(p);
  } else if (kind === "pouch") {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), mat(0x6a3a28, { emissive: 0x2d8a5a, emissiveIntensity: 0.12 })));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.08, 6), mat(0x8a5a3a));
    neck.position.y = 0.12;
    g.add(neck);
  } else if (kind === "token") {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8), mat(0xb0a090, { emissive: 0x6a5848, emissiveIntensity: 0.2 }));
    t.rotation.x = Math.PI / 2;
    g.add(t);
  } else {
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.2, 7), mat(0xd4a24a, { emissive: 0xc45c32, emissiveIntensity: 0.25 }));
    flask.position.y = 0.04;
    g.add(flask);
  }
  return g;
}

export function makeSigil(): THREE.Group {
  const g = new THREE.Group();
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 7), mat(0x4a4038));
  const rune = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    mat(0x3ecf9a, { emissive: 0x1a8a62, emissiveIntensity: 0.55 }),
  );
  rune.position.y = 0.16;
  g.add(stone, rune);
  return g;
}

export function makeLever(glyph: Glyph): THREE.Group {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.08), mat(0x5a4e42));
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.42, 6), mat(0x8a6a4a));
  handle.position.set(0, 0.08, 0.16);
  handle.rotation.x = -0.55;
  handle.name = "handle";
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 5),
    mat(glyph === "sun" ? 0xd4a84b : glyph === "moon" ? 0xa8c4d8 : 0xc45c32, {
      emissive: glyph === "sun" ? 0x6a4a10 : glyph === "moon" ? 0x446688 : 0x8b2e2e,
      emissiveIntensity: 0.35,
    }),
  );
  knob.position.set(0, 0.26, 0.28);
  knob.name = "knob";
  g.add(plate, handle, knob);
  g.userData.glyph = glyph;
  g.userData.label = glyphLabel(glyph);
  return g;
}

export function setLeverPulled(group: THREE.Group, pulled: boolean) {
  const handle = group.getObjectByName("handle");
  const knob = group.getObjectByName("knob");
  if (handle) handle.rotation.x = pulled ? 0.55 : -0.55;
  if (knob) knob.position.set(0, pulled ? -0.1 : 0.26, 0.28);
}

export function makePedestal(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.55, 8), mat(0x5c4e42));
  base.position.y = 0.28;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.08, 8), mat(0x7a6a55));
  top.position.y = 0.58;
  g.add(base, top);
  for (let i = 0; i < 3; i++) {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08, 0),
      mat(0x4a4038, { emissive: 0x1a8a62, emissiveIntensity: 0 }),
    );
    const a = (i / 3) * Math.PI * 2;
    crystal.position.set(Math.cos(a) * 0.16, 0.72, Math.sin(a) * 0.16);
    crystal.name = `crystal${i}`;
    g.add(crystal);
  }
  return g;
}

export function setPedestalLit(group: THREE.Group, lit: number, total: number) {
  for (let i = 0; i < 3; i++) {
    const c = group.getObjectByName(`crystal${i}`);
    if (!(c instanceof THREE.Mesh)) continue;
    const m = c.material as THREE.MeshLambertMaterial;
    const on = i < lit;
    m.color.setHex(on ? 0x3ecf9a : 0x4a4038);
    m.emissive.setHex(on ? 0x1a8a62 : 0x000000);
    m.emissiveIntensity = on ? 0.55 : 0;
    c.visible = i < Math.max(total, 1);
  }
}

export function boonTint(_id: BoonId): number {
  return 0xd4a84b;
}

export function wallOffset(yaw: number, inset = 0.12): { x: number; z: number } {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  // yaw 0 faces -Z (open neighbor north); lever sits on +Z wall when yaw=0? 
  // Maze lever yaw matches torch: wall at +X uses yaw -PI/2.
  // Position: toward the wall.
  const towardWallX = Math.sin(yaw);
  const towardWallZ = Math.cos(yaw);
  // For torch: rotY -PI/2 is wall at +X, holder at +X * (CELL*0.5 - 0.08)
  // torch dx=1 → rotY=-PI/2, x += CELL*0.5
  // So wall direction is (sin(-yaw)? Let's match torch faces:
  // dx+1, rotY=-PI/2 → wall +X, offset +X
  // yaw -PI/2: sin(-PI/2)=-1? Wait sin(-90)=-1, we want +X.
  // Use: offset = (sin(-yaw), cos(-yaw)) * dist? 
  // yaw=-PI/2 → we want +X: +1, 0
  // -sin(yaw) = -sin(-PI/2) = -(-1) = 1. -cos(-PI/2)=0. Yes.
  return { x: -towardWallX * (CELL * 0.5 - inset), z: -towardWallZ * (CELL * 0.5 - inset) };
}

void boonTint;
void wallOffset;
