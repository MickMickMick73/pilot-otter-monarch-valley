import { mulberry32, pick, randInt, shuffle } from "./rng";
import {
  GLYPHS,
  leverCount,
  npcForFloor,
  puzzleKindForFloor,
  sigilCount,
  type Glyph,
} from "./content";
import type { MazeData, MazeLever, MazeNpc, MazePuzzle, RelicKind } from "./types";

export const CELL = 3.4;
export const WALL_H = 3.2;
export const PLAYER_RADIUS = 0.38;
export const PLAYER_EYE = 1.52;

const DIRS: [number, number][] = [
  [0, -2],
  [2, 0],
  [0, 2],
  [-2, 0],
];

function idx(width: number, x: number, z: number): number {
  return z * width + x;
}

function inBounds(width: number, height: number, x: number, z: number): boolean {
  return x > 0 && z > 0 && x < width - 1 && z < height - 1;
}

function floodCount(cells: Uint8Array, width: number, height: number, sx: number, sz: number): number {
  const seen = new Uint8Array(cells.length);
  const stack = [idx(width, sx, sz)];
  seen[idx(width, sx, sz)] = 1;
  let n = 0;
  while (stack.length) {
    const i = stack.pop()!;
    n++;
    const x = i % width;
    const z = (i / width) | 0;
    const nbs: [number, number][] = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ];
    for (const [nx, nz] of nbs) {
      if (!inBounds(width, height, nx, nz) && (nx < 0 || nz < 0 || nx >= width || nz >= height)) continue;
      if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
      const j = idx(width, nx, nz);
      if (seen[j] || cells[j] === 1) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  return n;
}

function farthestCell(
  cells: Uint8Array,
  width: number,
  height: number,
  sx: number,
  sz: number,
): { x: number; z: number; dist: number } {
  const dist = new Int16Array(cells.length).fill(-1);
  const q: number[] = [idx(width, sx, sz)];
  dist[idx(width, sx, sz)] = 0;
  let best = q[0]!;
  let bestD = 0;
  let head = 0;
  while (head < q.length) {
    const i = q[head++]!;
    const d = dist[i]!;
    if (d > bestD) {
      bestD = d;
      best = i;
    }
    const x = i % width;
    const z = (i / width) | 0;
    const nbs: [number, number][] = [
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ];
    for (const [nx, nz] of nbs) {
      if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
      const j = idx(width, nx, nz);
      if (cells[j] === 1 || dist[j] >= 0) continue;
      dist[j] = d + 1;
      q.push(j);
    }
  }
  return { x: best % width, z: (best / width) | 0, dist: bestD };
}

function floorNeighbors(cells: Uint8Array, width: number, height: number, x: number, z: number): number {
  let n = 0;
  if (x + 1 < width && cells[idx(width, x + 1, z)] === 0) n++;
  if (x - 1 >= 0 && cells[idx(width, x - 1, z)] === 0) n++;
  if (z + 1 < height && cells[idx(width, x, z + 1)] === 0) n++;
  if (z - 1 >= 0 && cells[idx(width, x, z - 1)] === 0) n++;
  return n;
}

const KINDS: RelicKind[] = [
  "coin",
  "gem",
  "d20",
  "potion",
  "coin",
  "gem",
  "potion",
  "coin",
  "gem",
  "d20",
  "potion",
  "gem",
  "coin",
];

const FLOOR_NAMES = [
  "The Gate Halls",
  "The Wyrmwood Vaults",
  "The Ashen Galleries",
  "The Silent Cloisters",
  "The Ember Crypts",
  "The Rooted Dark",
  "The Last Hearth",
];

export interface FloorSpec {
  floor: number;
  size: number;
  relicCount: number;
  name: string;
}

export function floorName(floor: number): string {
  const n = Math.max(1, floor | 0);
  return FLOOR_NAMES[n - 1] ?? `The Deep · ${n}`;
}

export function floorSpec(floor: number): FloorSpec {
  const n = Math.max(1, floor | 0);
  const size = Math.min(23, 13 + n * 2) | 1;
  const relicCount = Math.min(13, 5 + n * 2);
  return { floor: n, size, relicCount, name: floorName(n) };
}

export function nextKeepSeed(seed: number, floor: number): number {
  return (Math.imul(seed ^ (floor * 0x9e3779b9), 0x85ebca6b) >>> 0);
}

export function generateMaze(seed: number, size = 17, relicCount = 9, floor = 1): MazeData {
  const width = size | 1;
  const height = size | 1;
  const rng = mulberry32(seed);
  const cells = new Uint8Array(width * height).fill(1);

  const carve = (x: number, z: number) => {
    cells[idx(width, x, z)] = 0;
  };

  const startX = 1;
  const startZ = 1;
  carve(startX, startZ);

  const stack: [number, number][] = [[startX, startZ]];
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1]!;
    const options = shuffle(
      rng,
      DIRS.filter(([dx, dz]) => {
        const nx = cx + dx;
        const nz = cz + dz;
        return inBounds(width, height, nx, nz) && cells[idx(width, nx, nz)] === 1;
      }),
    );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [dx, dz] = options[0]!;
    const nx = cx + dx;
    const nz = cz + dz;
    carve(cx + dx / 2, cz + dz / 2);
    carve(nx, nz);
    stack.push([nx, nz]);
  }

  // Knock extra loops so the keep feels like a dungeon, not a single corridor.
  const loopTries = Math.floor(width * 0.7);
  for (let i = 0; i < loopTries; i++) {
    const x = randInt(rng, 1, width - 2);
    const z = randInt(rng, 1, height - 2);
    if (cells[idx(width, x, z)] === 0) continue;
    const floors = floorNeighbors(cells, width, height, x, z);
    if (floors >= 2) cells[idx(width, x, z)] = 0;
  }

  const floors: { x: number; z: number }[] = [];
  const deadEnds: { x: number; z: number }[] = [];
  for (let z = 1; z < height - 1; z++) {
    for (let x = 1; x < width - 1; x++) {
      if (cells[idx(width, x, z)] !== 0) continue;
      floors.push({ x, z });
      if (floorNeighbors(cells, width, height, x, z) === 1 && !(x === startX && z === startZ)) {
        deadEnds.push({ x, z });
      }
    }
  }

  const far = farthestCell(cells, width, height, startX, startZ);
  const exit = { x: far.x, z: far.z };

  const reachable = floodCount(cells, width, height, startX, startZ);
  if (reachable < floors.length) {
    // Should not happen; regenerate with a derived seed if it does.
    return generateMaze((seed ^ 0x9e3779b9) >>> 0, size, relicCount, floor);
  }

  const relicCells = shuffle(
    rng,
    floors.filter((c) => {
      const dStart = Math.abs(c.x - startX) + Math.abs(c.z - startZ);
      const dExit = Math.abs(c.x - exit.x) + Math.abs(c.z - exit.z);
      return dStart >= 3 && dExit >= 2;
    }),
  ).slice(0, Math.max(1, relicCount));

  const relics = relicCells.map((c, i) => ({
    x: c.x,
    z: c.z,
    kind: KINDS[i % KINDS.length] ?? pick(rng, KINDS),
  }));

  const used = new Set<string>();
  const mark = (x: number, z: number) => used.add(`${x},${z}`);
  const taken = (x: number, z: number) => used.has(`${x},${z}`);
  mark(startX, startZ);
  mark(exit.x, exit.z);
  for (const r of relics) mark(r.x, r.z);

  const take = (pool: { x: number; z: number }[], minFrom?: { x: number; z: number }, minDist = 0) => {
    const opts = shuffle(
      rng,
      pool.filter((c) => {
        if (taken(c.x, c.z)) return false;
        if (!minFrom) return true;
        return Math.abs(c.x - minFrom.x) + Math.abs(c.z - minFrom.z) >= minDist;
      }),
    );
    const hit = opts[0] ?? shuffle(
      rng,
      pool.filter((c) => !taken(c.x, c.z)),
    )[0];
    if (!hit) return null;
    mark(hit.x, hit.z);
    return hit;
  };

  const npcDef = npcForFloor(floor);
  const npcCell = take(deadEnds.length ? deadEnds : floors, { x: startX, z: startZ }, 4);
  let npc: MazeNpc | null = null;
  if (npcCell) {
    let yaw = 0;
    if (cells[idx(width, npcCell.x, npcCell.z - 1)] === 0) yaw = 0;
    else if (cells[idx(width, npcCell.x + 1, npcCell.z)] === 0) yaw = -Math.PI / 2;
    else if (cells[idx(width, npcCell.x, npcCell.z + 1)] === 0) yaw = Math.PI;
    else yaw = Math.PI / 2;
    npc = { id: npcDef.id, x: npcCell.x, z: npcCell.z, yaw };
  }

  const questCell = npc ? take(floors, npcCell!, 5) : null;
  const questItem = questCell ? { kind: npcDef.item, x: questCell.x, z: questCell.z } : null;

  const pKind = puzzleKindForFloor(floor);
  const sigils: { x: number; z: number }[] = [];
  const levers: MazeLever[] = [];
  let order: Glyph[] = [];

  if (pKind === "sigils") {
    const n = sigilCount(floor);
    for (let i = 0; i < n; i++) {
      const c = take(floors, { x: startX, z: startZ }, 3);
      if (c) sigils.push(c);
    }
  } else {
    const n = leverCount(floor);
    order = shuffle(rng, GLYPHS.slice(0, n));
    const wallFaces = (x: number, z: number) => {
      const faces: { yaw: number }[] = [];
      if (x + 1 < width && cells[idx(width, x + 1, z)] === 1) faces.push({ yaw: -Math.PI / 2 });
      if (x - 1 >= 0 && cells[idx(width, x - 1, z)] === 1) faces.push({ yaw: Math.PI / 2 });
      if (z + 1 < height && cells[idx(width, x, z + 1)] === 1) faces.push({ yaw: Math.PI });
      if (z - 1 >= 0 && cells[idx(width, x, z - 1)] === 1) faces.push({ yaw: 0 });
      return faces;
    };
    for (let i = 0; i < n; i++) {
      const c = take(
        floors.filter((f) => wallFaces(f.x, f.z).length > 0 && !(f.x === exit.x && f.z === exit.z)),
        { x: startX, z: startZ },
        3,
      );
      if (!c) continue;
      const faces = wallFaces(c.x, c.z);
      const f = faces[randInt(rng, 0, faces.length - 1)] ?? { yaw: 0 };
      levers.push({ x: c.x, z: c.z, yaw: f.yaw, glyph: order[i] ?? "sun" });
    }
    order = levers.map((l) => l.glyph);
    // Posted order is a shuffle of the lever glyphs — player must pull in this sequence.
    order = shuffle(rng, order.slice());
  }

  let pedestal = { x: exit.x, z: exit.z };
  const adj: { x: number; z: number }[] = [
    { x: exit.x + 1, z: exit.z },
    { x: exit.x - 1, z: exit.z },
    { x: exit.x, z: exit.z + 1 },
    { x: exit.x, z: exit.z - 1 },
  ];
  const ped = adj.find((c) => c.x >= 0 && c.z >= 0 && c.x < width && c.z < height && cells[idx(width, c.x, c.z)] === 0);
  if (ped) pedestal = ped;

  const puzzle: MazePuzzle = { kind: pKind, sigils, levers, order, pedestal };

  return {
    width,
    height,
    cells,
    start: { x: startX, z: startZ },
    exit,
    relics,
    deadEnds,
    seed,
    floor,
    npc,
    questItem,
    puzzle,
  };
}

export function isWall(maze: MazeData, x: number, z: number): boolean {
  if (x < 0 || z < 0 || x >= maze.width || z >= maze.height) return true;
  return maze.cells[z * maze.width + x] === 1;
}

export function cellCenter(x: number, z: number): { x: number; z: number } {
  return { x: (x + 0.5) * CELL, z: (z + 0.5) * CELL };
}

export function worldToCell(x: number, z: number): { x: number; z: number } {
  return { x: Math.floor(x / CELL), z: Math.floor(z / CELL) };
}

export function openNeighborYaw(maze: MazeData): number {
  const { x, z } = maze.start;
  // yaw=0 faces −Z; −π/2 faces +X; π faces +Z; π/2 faces −X
  if (!isWall(maze, x + 1, z)) return -Math.PI / 2;
  if (!isWall(maze, x, z + 1)) return Math.PI;
  if (!isWall(maze, x - 1, z)) return Math.PI / 2;
  return 0;
}
