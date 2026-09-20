import { CELL, isWall } from "./maze";
import type { MazeData } from "./types";

/**
 * Circle (XZ) vs nearby wall AABBs. Resolves in place and returns the
 * corrected position. Separate-axis-ish: iterate nearby cells, push out along
 * the minimum translation so walls feel solid and you slide along them.
 */
export function resolvePlayer(
  maze: MazeData,
  x: number,
  z: number,
  radius: number,
): { x: number; z: number } {
  const cx = Math.floor(x / CELL);
  const cz = Math.floor(z / CELL);
  let px = x;
  let pz = z;

  for (let iter = 0; iter < 3; iter++) {
    let hit = false;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cx + dx;
        const gz = cz + dz;
        if (!isWall(maze, gx, gz)) continue;
        const minX = gx * CELL;
        const maxX = minX + CELL;
        const minZ = gz * CELL;
        const maxZ = minZ + CELL;
        const next = circleAabb(px, pz, radius, minX, maxX, minZ, maxZ);
        if (next.x !== px || next.z !== pz) {
          px = next.x;
          pz = next.z;
          hit = true;
        }
      }
    }
    if (!hit) break;
  }
  return { x: px, z: pz };
}

function circleAabb(
  x: number,
  z: number,
  radius: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): { x: number; z: number } {
  const inside = x > minX && x < maxX && z > minZ && z < maxZ;
  if (inside) {
    const left = x - minX;
    const right = maxX - x;
    const up = z - minZ;
    const down = maxZ - z;
    const m = Math.min(left, right, up, down);
    if (m === left) return { x: minX - radius, z };
    if (m === right) return { x: maxX + radius, z };
    if (m === up) return { x, z: minZ - radius };
    return { x, z: maxZ + radius };
  }

  const closestX = Math.max(minX, Math.min(x, maxX));
  const closestZ = Math.max(minZ, Math.min(z, maxZ));
  const dx = x - closestX;
  const dz = z - closestZ;
  const d2 = dx * dx + dz * dz;
  if (d2 >= radius * radius) return { x, z };
  if (d2 < 1e-8) return { x, z };
  const d = Math.sqrt(d2);
  const push = radius - d;
  return { x: x + (dx / d) * push, z: z + (dz / d) * push };
}

/** Move X then Z so sliding along walls stays smooth. */
export function moveWithCollision(
  maze: MazeData,
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
): { x: number; z: number } {
  const maxStep = 0.18;
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / maxStep));
  let px = x;
  let pz = z;
  const sx = dx / steps;
  const sz = dz / steps;
  for (let i = 0; i < steps; i++) {
    const afterX = resolvePlayer(maze, px + sx, pz, radius);
    px = afterX.x;
    pz = afterX.z;
    const afterZ = resolvePlayer(maze, px, pz + sz, radius);
    px = afterZ.x;
    pz = afterZ.z;
  }
  return { x: px, z: pz };
}
