import * as THREE from "three";
import { CELL, isWall, WALL_H, cellCenter } from "./maze";
import { mulberry32, randInt } from "./rng";
import type { MazeData, RelicKind } from "./types";
import {
  makeLever,
  makeNpc,
  makePedestal,
  makeQuestItem,
  makeSigil,
  setLeverPulled,
  setPedestalLit,
  wallOffset,
} from "./actors";
import type { Glyph, NpcId, QuestItemId } from "./content";

export interface RelicMesh {
  group: THREE.Group;
  kind: RelicKind;
  taken: boolean;
  bob: number;
  baseY: number;
}

export interface NpcMesh {
  id: NpcId;
  group: THREE.Group;
}

export interface QuestMesh {
  kind: QuestItemId;
  group: THREE.Group;
  taken: boolean;
  bob: number;
  baseY: number;
}

export interface SigilMesh {
  group: THREE.Group;
  taken: boolean;
  bob: number;
  baseY: number;
}

export interface LeverMesh {
  group: THREE.Group;
  glyph: Glyph;
  pulled: boolean;
}

export interface DungeonTextures {
  wall: THREE.Texture;
  floor: THREE.Texture;
  ceil: THREE.Texture;
}

export interface WorldHandle {
  scene: THREE.Scene;
  walls: THREE.InstancedMesh;
  floor: THREE.InstancedMesh;
  ceiling: THREE.InstancedMesh;
  relics: RelicMesh[];
  npc: NpcMesh | null;
  questItem: QuestMesh | null;
  sigils: SigilMesh[];
  levers: LeverMesh[];
  pedestal: THREE.Group;
  exitPos: THREE.Vector3;
  torches: THREE.Object3D[];
  torchLights: THREE.PointLight[];
  flameSprites: THREE.Sprite[];
  particles: THREE.Points;
  particleAges: Float32Array;
  particleVel: Float32Array;
  torchHand: THREE.Group;
  handLight: THREE.PointLight;
  setExitOpen: (open: boolean) => void;
  setPedestal: (lit: number, total: number) => void;
  setLever: (index: number, pulled: boolean) => void;
  dispose: () => void;
}

const WALL_COLORS = [0xf3e6d4, 0xe8d8c4, 0xdecdb8, 0xf0e2d0, 0xe4d4c0];
const FLOOR_A = 0xfff3e0;
const FLOOR_B = 0xf2e2cc;
const FLOOR_MOSS = 0xc5d4a8;
const CEIL = 0xb4a494;

function mat(
  color: number,
  opts?: {
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    map?: THREE.Texture;
  },
) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    ...(opts?.map ? { map: opts.map } : {}),
  });
}

export function loadDungeonTextures(): DungeonTextures {
  const loader = new THREE.TextureLoader();
  const prep = (url: string) => {
    const tex = loader.load(url, (ready) => {
      ready.anisotropy = 8;
      ready.needsUpdate = true;
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  };
  return {
    wall: prep("/textures/dungeon-wall.jpg"),
    floor: prep("/textures/dungeon-floor.jpg"),
    ceil: prep("/textures/dungeon-ceil.jpg"),
  };
}

export function disposeDungeonTextures(textures: DungeonTextures) {
  textures.wall.dispose();
  textures.floor.dispose();
  textures.ceil.dispose();
}

function flameTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 38, 2, 32, 32, 28);
  grd.addColorStop(0, "rgba(255, 240, 180, 1)");
  grd.addColorStop(0.35, "rgba(255, 140, 40, 0.9)");
  grd.addColorStop(0.7, "rgba(196, 92, 50, 0.35)");
  grd.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRelic(kind: RelicKind): THREE.Group {
  const g = new THREE.Group();
  if (kind === "coin") {
    const geo = new THREE.CylinderGeometry(0.16, 0.16, 0.045, 10);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat(0xd4a84b, { emissive: 0x6a4a10, emissiveIntensity: 0.25 }));
    g.add(m);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8), mat(0xb8892e));
    inner.rotation.x = Math.PI / 2;
    g.add(inner);
  } else if (kind === "gem") {
    const colors = [0xc23b22, 0x2d8a5a, 0x2a5f9e];
    const color = colors[Math.floor(Math.random() * colors.length)]!;
    const m = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      mat(color, { emissive: color, emissiveIntensity: 0.22 }),
    );
    g.add(m);
  } else if (kind === "d20") {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      mat(0xf2ebe0, { emissive: 0x8b2e2e, emissiveIntensity: 0.12 }),
    );
    g.add(m);
  } else {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.22, 8), mat(0x2d8a5a, { emissive: 0x14522e, emissiveIntensity: 0.2 }));
    body.position.y = 0.02;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8), mat(0xcbbfa6));
    neck.position.y = 0.16;
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8), mat(0x6a5a4c));
    cork.position.y = 0.21;
    g.add(body, neck, cork);
  }
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return g;
}

function addTorch(parent: THREE.Object3D, x: number, y: number, z: number, rotY: number, flameTex: THREE.Texture, flames: THREE.Sprite[]) {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = rotY;
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mat(0x3a322a));
  bracket.position.set(0, 0, 0.12);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.34, 6), mat(0x5c4033));
  stick.position.set(0, 0.12, 0.22);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.06, 6), mat(0x6a5a4c));
  bowl.position.set(0, 0.3, 0.22);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, color: 0xffc070 }),
  );
  sprite.position.set(0, 0.42, 0.22);
  sprite.scale.set(0.28, 0.42, 1);
  holder.add(bracket, stick, bowl, sprite);
  parent.add(holder);
  flames.push(sprite);
  return holder;
}

export function buildWorld(maze: MazeData, textures: DungeonTextures): WorldHandle {
  const rng = mulberry32(maze.seed ^ 0x51ed);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x221a14);
  scene.fog = new THREE.FogExp2(0x221a14, 0.028);

  const hemi = new THREE.HemisphereLight(0xe4c9a2, 0x3a2c22, 1.05);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x6a5848, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffd2a8, 0.55);
  sun.position.set(4, 10, -6);
  scene.add(sun);

  const disposables: Array<{ dispose: () => void }> = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const trackMat = <T extends THREE.Material>(m: T) => {
    materials.push(m);
    return m;
  };
  const trackGeo = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };

  const wallMat = trackMat(mat(0xffffff, { map: textures.wall }));
  const floorMat = trackMat(mat(0xffffff, { map: textures.floor }));
  const ceilMat = trackMat(mat(0x9a8c7e, { map: textures.ceil }));

  let wallCount = 0;
  let floorCount = 0;
  for (let z = 0; z < maze.height; z++) {
    for (let x = 0; x < maze.width; x++) {
      if (isWall(maze, x, z)) wallCount++;
      else floorCount++;
    }
  }

  const wallGeo = trackGeo(new THREE.BoxGeometry(CELL, WALL_H, CELL));
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
  walls.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  walls.frustumCulled = false;
  walls.receiveShadow = true;

  const floorGeo = trackGeo(new THREE.BoxGeometry(CELL, 0.14, CELL));
  const floor = new THREE.InstancedMesh(floorGeo, floorMat, floorCount);
  floor.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  floor.frustumCulled = false;
  floor.receiveShadow = true;

  const ceilGeo = trackGeo(new THREE.BoxGeometry(CELL, 0.16, CELL));
  const ceiling = new THREE.InstancedMesh(ceilGeo, ceilMat, floorCount);
  ceiling.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  ceiling.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let wi = 0;
  let fi = 0;
  const torchSpots: { x: number; z: number; rotY: number }[] = [];

  for (let z = 0; z < maze.height; z++) {
    for (let x = 0; x < maze.width; x++) {
      const wx = (x + 0.5) * CELL;
      const wz = (z + 0.5) * CELL;
      if (isWall(maze, x, z)) {
        dummy.position.set(wx, WALL_H / 2, wz);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        walls.setMatrixAt(wi, dummy.matrix);
        color.setHex(WALL_COLORS[randInt(rng, 0, WALL_COLORS.length - 1)]!);
        walls.setColorAt(wi, color);
        wi++;
        continue;
      }
      dummy.position.set(wx, -0.07, wz);
      dummy.updateMatrix();
      floor.setMatrixAt(fi, dummy.matrix);
      const moss = rng() < 0.08;
      color.setHex(moss ? FLOOR_MOSS : (x + z) % 2 === 0 ? FLOOR_A : FLOOR_B);
      floor.setColorAt(fi, color);

      dummy.position.set(wx, WALL_H + 0.08, wz);
      dummy.updateMatrix();
      ceiling.setMatrixAt(fi, dummy.matrix);
      color.setHex(CEIL);
      ceiling.setColorAt(fi, color);
      fi++;

      // Torch on a neighboring wall face, sparse.
      if (rng() < 0.16) {
        const faces: { dx: number; dz: number; rotY: number }[] = [];
        if (isWall(maze, x + 1, z)) faces.push({ dx: 1, dz: 0, rotY: -Math.PI / 2 });
        if (isWall(maze, x - 1, z)) faces.push({ dx: -1, dz: 0, rotY: Math.PI / 2 });
        if (isWall(maze, x, z + 1)) faces.push({ dx: 0, dz: 1, rotY: Math.PI });
        if (isWall(maze, x, z - 1)) faces.push({ dx: 0, dz: -1, rotY: 0 });
        if (faces.length) {
          const f = faces[randInt(rng, 0, faces.length - 1)]!;
          torchSpots.push({
            x: wx + f.dx * (CELL * 0.5 - 0.08),
            z: wz + f.dz * (CELL * 0.5 - 0.08),
            rotY: f.rotY,
          });
        }
      }
    }
  }
  if (walls.instanceColor) walls.instanceColor.needsUpdate = true;
  if (floor.instanceColor) floor.instanceColor.needsUpdate = true;
  if (ceiling.instanceColor) ceiling.instanceColor.needsUpdate = true;
  walls.instanceMatrix.needsUpdate = true;
  floor.instanceMatrix.needsUpdate = true;
  ceiling.instanceMatrix.needsUpdate = true;
  scene.add(walls, floor, ceiling);

  const flameTex = flameTexture();
  disposables.push(flameTex);
  const flameSprites: THREE.Sprite[] = [];
  const torches: THREE.Object3D[] = [];
  for (const t of torchSpots) {
    torches.push(addTorch(scene, t.x, 1.55, t.z, t.rotY, flameTex, flameSprites));
  }

  const torchLights: THREE.PointLight[] = [];
  for (let i = 0; i < 5; i++) {
    const light = new THREE.PointLight(0xff9a4a, 0, 14, 1.35);
    light.position.set(0, 2, 0);
    scene.add(light);
    torchLights.push(light);
  }

  // Banners
  const bannerMatA = trackMat(mat(0x8b2e2e));
  const bannerMatB = trackMat(mat(0x2e4a3a));
  const bannerGeo = trackGeo(new THREE.BoxGeometry(0.7, 1.1, 0.04));
  let banners = 0;
  for (let z = 1; z < maze.height - 1 && banners < 14; z++) {
    for (let x = 1; x < maze.width - 1 && banners < 14; x++) {
      if (isWall(maze, x, z)) continue;
      if (rng() > 0.08) continue;
      const faces: { px: number; pz: number; rotY: number }[] = [];
      if (isWall(maze, x, z - 1)) faces.push({ px: 0, pz: -CELL * 0.5 + 0.06, rotY: 0 });
      if (isWall(maze, x, z + 1)) faces.push({ px: 0, pz: CELL * 0.5 - 0.06, rotY: 0 });
      if (isWall(maze, x - 1, z)) faces.push({ px: -CELL * 0.5 + 0.06, pz: 0, rotY: Math.PI / 2 });
      if (isWall(maze, x + 1, z)) faces.push({ px: CELL * 0.5 - 0.06, pz: 0, rotY: Math.PI / 2 });
      if (!faces.length) continue;
      const f = faces[randInt(rng, 0, faces.length - 1)]!;
      const mesh = new THREE.Mesh(bannerGeo, rng() < 0.5 ? bannerMatA : bannerMatB);
      const c = cellCenter(x, z);
      mesh.position.set(c.x + f.px, 1.7, c.z + f.pz);
      mesh.rotation.y = f.rotY;
      scene.add(mesh);
      banners++;
    }
  }

  // Barrels at dead ends
  const barrelMat = trackMat(mat(0x6a4e32));
  const barrelGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.3, 0.52, 8));
  const lidGeo = trackGeo(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 8));
  const lidMat = trackMat(mat(0x4a3828));
  for (const d of maze.deadEnds.slice(0, 8)) {
    if (d.x === maze.exit.x && d.z === maze.exit.z) continue;
    if (rng() < 0.35) continue;
    const c = cellCenter(d.x, d.z);
    const b = new THREE.Mesh(barrelGeo, barrelMat);
    b.position.set(c.x + (rng() - 0.5) * 0.6, 0.26, c.z + (rng() - 0.5) * 0.6);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.copy(b.position);
    lid.position.y = 0.54;
    scene.add(b, lid);
  }

  // Ceiling beams
  const beamMat = trackMat(mat(0x3a2a1c));
  const beamGeo = trackGeo(new THREE.BoxGeometry(CELL * 0.95, 0.1, 0.12));
  for (let z = 1; z < maze.height - 1; z += 2) {
    for (let x = 1; x < maze.width - 1; x += 2) {
      if (isWall(maze, x, z)) continue;
      if (rng() > 0.45) continue;
      const c = cellCenter(x, z);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(c.x, WALL_H - 0.12, c.z);
      beam.rotation.y = rng() < 0.5 ? 0 : Math.PI / 2;
      scene.add(beam);
    }
  }

  // Relics
  const relics: RelicMesh[] = maze.relics.map((r, i) => {
    const group = makeRelic(r.kind);
    const c = cellCenter(r.x, r.z);
    group.position.set(c.x, 0.55, c.z);
    scene.add(group);
    return { group, kind: r.kind, taken: false, bob: i * 0.7, baseY: 0.55 };
  });

  let npc: NpcMesh | null = null;
  if (maze.npc) {
    const group = makeNpc(maze.npc.id);
    const c = cellCenter(maze.npc.x, maze.npc.z);
    group.position.set(c.x, 0, c.z);
    group.rotation.y = maze.npc.yaw;
    scene.add(group);
    npc = { id: maze.npc.id, group };
  }

  let questItem: QuestMesh | null = null;
  if (maze.questItem) {
    const group = makeQuestItem(maze.questItem.kind);
    const c = cellCenter(maze.questItem.x, maze.questItem.z);
    group.position.set(c.x, 0.45, c.z);
    scene.add(group);
    questItem = { kind: maze.questItem.kind, group, taken: false, bob: 0.4, baseY: 0.45 };
  }

  const sigils: SigilMesh[] = maze.puzzle.sigils.map((s, i) => {
    const group = makeSigil();
    const c = cellCenter(s.x, s.z);
    group.position.set(c.x, 0.02, c.z);
    scene.add(group);
    return { group, taken: false, bob: i * 0.9, baseY: 0.02 };
  });

  const levers: LeverMesh[] = maze.puzzle.levers.map((l) => {
    const group = makeLever(l.glyph);
    const c = cellCenter(l.x, l.z);
    const off = wallOffset(l.yaw, 0.1);
    group.position.set(c.x + off.x, 1.15, c.z + off.z);
    group.rotation.y = l.yaw;
    scene.add(group);
    return { group, glyph: l.glyph, pulled: false };
  });

  const pedestal = makePedestal();
  {
    const c = cellCenter(maze.puzzle.pedestal.x, maze.puzzle.pedestal.z);
    pedestal.position.set(c.x, 0, c.z);
    scene.add(pedestal);
    setPedestalLit(pedestal, 0, maze.puzzle.kind === "sigils" ? maze.puzzle.sigils.length : maze.puzzle.levers.length);
  }

  // Exit arch
  const exitC = cellCenter(maze.exit.x, maze.exit.z);
  const exitGroup = new THREE.Group();
  exitGroup.position.set(exitC.x, 0, exitC.z);
  const pillarGeo = trackGeo(new THREE.BoxGeometry(0.32, 2.4, 0.32));
  const stoneMat = trackMat(mat(0x7a6a55, { emissive: 0xc45c32, emissiveIntensity: 0.08 }));
  const p1 = new THREE.Mesh(pillarGeo, stoneMat);
  p1.position.set(-0.7, 1.2, 0);
  const p2 = new THREE.Mesh(pillarGeo, stoneMat);
  p2.position.set(0.7, 1.2, 0);
  const lintel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.85, 0.28, 0.38)), stoneMat);
  lintel.position.set(0, 2.42, 0);
  const portalMat = trackMat(mat(0x5a4034, { emissive: 0xc45c32, emissiveIntensity: 0.12, transparent: true, opacity: 0.22 }));
  const portal = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.2, 2.1)), portalMat);
  portal.position.set(0, 1.15, 0);
  const exitLight = new THREE.PointLight(0xffb060, 0.35, 8, 1.4);
  exitLight.position.set(0, 1.6, 0);
  exitGroup.add(p1, p2, lintel, portal, exitLight);
  // Face the arch toward an open neighbor
  let exitYaw = 0;
  if (!isWall(maze, maze.exit.x, maze.exit.z - 1)) exitYaw = 0;
  else if (!isWall(maze, maze.exit.x, maze.exit.z + 1)) exitYaw = Math.PI;
  else if (!isWall(maze, maze.exit.x + 1, maze.exit.z)) exitYaw = -Math.PI / 2;
  else exitYaw = Math.PI / 2;
  exitGroup.rotation.y = exitYaw;
  scene.add(exitGroup);

  // Particles
  const pCount = 64;
  const pGeo = trackGeo(new THREE.BufferGeometry());
  const pPos = new Float32Array(pCount * 3);
  pPos.fill(0);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = trackMat(
    new THREE.PointsMaterial({
      color: 0xffd27a,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);
  const particleAges = new Float32Array(pCount).fill(99);
  const particleVel = new Float32Array(pCount * 3);

  // Handheld torch (parented later to camera)
  const torchHand = new THREE.Group();
  const handStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6), mat(0x5c4033));
  handStick.rotation.x = 0.5;
  handStick.position.set(0, -0.05, 0);
  const handBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.05, 6), mat(0x6a5a4c));
  handBowl.position.set(0, 0.16, -0.08);
  const handFlame = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false }),
  );
  handFlame.position.set(0, 0.28, -0.1);
  handFlame.scale.set(0.22, 0.32, 1);
  flameSprites.push(handFlame);
  const handLight = new THREE.PointLight(0xffb060, 2.4, 12, 1.25);
  handLight.position.set(0.05, 0.25, 0);
  torchHand.add(handStick, handBowl, handFlame, handLight);
  torchHand.position.set(0.28, -0.28, -0.48);

  const setExitOpen = (open: boolean) => {
    portalMat.color.setHex(open ? 0xc45c32 : 0x5a4034);
    portalMat.emissive.setHex(open ? 0xff9a4a : 0xc45c32);
    portalMat.emissiveIntensity = open ? 0.65 : 0.12;
    portalMat.opacity = open ? 0.55 : 0.22;
    exitLight.intensity = open ? 1.6 : 0.35;
  };

  const setPedestal = (lit: number, total: number) => setPedestalLit(pedestal, lit, total);
  const setLever = (index: number, pulled: boolean) => {
    const l = levers[index];
    if (!l) return;
    l.pulled = pulled;
    setLeverPulled(l.group, pulled);
  };

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else m?.dispose();
      }
      if (obj instanceof THREE.Sprite) {
        obj.material.dispose();
      }
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const d of disposables) d.dispose();
  };

  return {
    scene,
    walls,
    floor,
    ceiling,
    relics,
    npc,
    questItem,
    sigils,
    levers,
    pedestal,
    exitPos: new THREE.Vector3(exitC.x, 0, exitC.z),
    torches,
    torchLights,
    flameSprites,
    particles,
    particleAges,
    particleVel,
    torchHand,
    handLight,
    setExitOpen,
    setPedestal,
    setLever,
    dispose,
  };
}

export function emitBurst(
  world: WorldHandle,
  x: number,
  y: number,
  z: number,
  count = 14,
) {
  const pos = world.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
  let spawned = 0;
  for (let i = 0; i < world.particleAges.length && spawned < count; i++) {
    if (world.particleAges[i]! < 0.6) continue;
    world.particleAges[i] = 0;
    pos.setXYZ(i, x, y, z);
    world.particleVel[i * 3] = (Math.random() - 0.5) * 2.2;
    world.particleVel[i * 3 + 1] = 1.2 + Math.random() * 1.8;
    world.particleVel[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    spawned++;
  }
  pos.needsUpdate = true;
}

export function stepParticles(world: WorldHandle, dt: number) {
  const pos = world.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < world.particleAges.length; i++) {
    world.particleAges[i]! += dt;
    if (world.particleAges[i]! > 0.7) {
      pos.setXYZ(i, 0, -10, 0);
      continue;
    }
    const vx = world.particleVel[i * 3]!;
    const vy = world.particleVel[i * 3 + 1]!;
    const vz = world.particleVel[i * 3 + 2]!;
    pos.setXYZ(i, pos.getX(i) + vx * dt, pos.getY(i) + vy * dt, pos.getZ(i) + vz * dt);
    world.particleVel[i * 3 + 1] = vy - 4.5 * dt;
  }
  pos.needsUpdate = true;
}
