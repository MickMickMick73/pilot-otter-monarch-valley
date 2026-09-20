import { CELL, isWall, worldToCell } from "./maze";
import type { MazeData } from "./types";

export function drawMinimap(
  canvas: HTMLCanvasElement,
  maze: MazeData,
  explored: Uint8Array,
  playerX: number,
  playerZ: number,
  yaw: number,
  collectedMask: boolean[],
  extra?: { questTaken: boolean; sigils: boolean[]; levers: boolean[] },
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const css = canvas.clientWidth || 148;
  const size = Math.floor(css * dpr);
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = css;
  ctx.clearRect(0, 0, w, w);

  ctx.fillStyle = "#14100c";
  ctx.beginPath();
  roundRect(ctx, 0, 0, w, w, 12);
  ctx.fill();

  const pad = 8;
  const inner = w - pad * 2;
  const cell = inner / Math.max(maze.width, maze.height);
  const ox = pad + (inner - maze.width * cell) / 2;
  const oy = pad + (inner - maze.height * cell) / 2;

  for (let z = 0; z < maze.height; z++) {
    for (let x = 0; x < maze.width; x++) {
      const i = z * maze.width + x;
      const known = explored[i] === 1;
      const wall = isWall(maze, x, z);
      if (!known) {
        ctx.fillStyle = "#1a1510";
        ctx.fillRect(ox + x * cell, oy + z * cell, cell + 0.4, cell + 0.4);
        continue;
      }
      ctx.fillStyle = wall ? "#3a322a" : "#cbbfa6";
      ctx.fillRect(ox + x * cell, oy + z * cell, cell + 0.4, cell + 0.4);
    }
  }

  const exitCx = (maze.exit.x + 0.5) * CELL;
  const exitCz = (maze.exit.z + 0.5) * CELL;
  if (explored[maze.exit.z * maze.width + maze.exit.x]) {
    ctx.fillStyle = "#c45c32";
    ctx.beginPath();
    ctx.arc(ox + (exitCx / CELL) * cell, oy + (exitCz / CELL) * cell, Math.max(2.4, cell * 0.28), 0, Math.PI * 2);
    ctx.fill();
  }

  maze.relics.forEach((r, i) => {
    if (collectedMask[i]) return;
    if (!explored[r.z * maze.width + r.x]) return;
    ctx.fillStyle = "#d4a84b";
    ctx.beginPath();
    ctx.arc(ox + (r.x + 0.5) * cell, oy + (r.z + 0.5) * cell, Math.max(1.6, cell * 0.18), 0, Math.PI * 2);
    ctx.fill();
  });

  const mark = (x: number, z: number, color: string, r = 0.22) => {
    if (!explored[z * maze.width + x]) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ox + (x + 0.5) * cell, oy + (z + 0.5) * cell, Math.max(1.7, cell * r), 0, Math.PI * 2);
    ctx.fill();
  };

  if (maze.npc) mark(maze.npc.x, maze.npc.z, "#6a9ad8", 0.28);
  if (maze.questItem && !extra?.questTaken) mark(maze.questItem.x, maze.questItem.z, "#e8d080", 0.2);
  maze.puzzle.sigils.forEach((s, i) => {
    if (extra?.sigils[i]) return;
    mark(s.x, s.z, "#3ecf9a", 0.2);
  });
  maze.puzzle.levers.forEach((l, i) => {
    if (extra?.levers[i]) return;
    mark(l.x, l.z, "#c45c32", 0.18);
  });

  const pc = worldToCell(playerX, playerZ);
  if (pc.x >= 0 && pc.z >= 0) {
    const px = ox + (playerX / CELL) * cell;
    const pz = oy + (playerZ / CELL) * cell;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(yaw);
    ctx.fillStyle = "#c45c32";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.2, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4.2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
