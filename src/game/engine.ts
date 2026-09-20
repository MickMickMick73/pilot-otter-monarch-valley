import * as THREE from "three";
import { GameAudio } from "./audio";
import { moveWithCollision } from "./collision";
import { Input } from "./input";
import { BOONS, NPCS, glyphLabel, rankIndex, type BoonId } from "./content";
import {
  floorSpec,
  generateMaze,
  nextKeepSeed,
  openNeighborYaw,
  PLAYER_EYE,
  PLAYER_RADIUS,
  cellCenter,
  worldToCell,
} from "./maze";
import { drawMinimap } from "./minimap";
import {
  addLifetimeRelic,
  addRenown,
  noteQuestComplete,
  readRecords,
  rankSummary,
  trophyViews,
  useGameHud,
  writeFloorClear,
  type DialogueView,
} from "./store";
import type { GamePhase, MazeData, PlayerState } from "./types";
import { buildWorld, disposeDungeonTextures, emitBurst, loadDungeonTextures, stepParticles, type WorldHandle } from "./world";

const FIXED = 1 / 60;
const SENS = 0.0022;
const WALK = 4.35;
const SPRINT = 6.55;
const ACCEL = 18;
const FRICTION = 9;
const PITCH_LIM = Math.PI / 2 - 0.04;

export interface Engine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: (seed?: number) => void;
  descend: () => void;
  leave: () => void;
  interact: () => void;
  choose: (id: string) => void;
  setMuted: (muted: boolean) => void;
  setMoveStick: (x: number, y: number) => void;
  addLook: (dx: number, dy: number) => void;
  requestLock: () => void;
  dispose: () => void;
}

function readSeed(): number {
  try {
    const q = new URLSearchParams(window.location.search).get("seed");
    if (q && /^\d+$/.test(q)) return Number(q) >>> 0;
  } catch {
    /* ignore */
  }
  return (Math.random() * 0xffffffff) >>> 0;
}

export function createEngine(opts: {
  canvas: HTMLCanvasElement;
  minimap: HTMLCanvasElement;
}): Engine {
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let floor = 1;
  let spec = floorSpec(floor);
  let maze: MazeData = generateMaze(readSeed(), spec.size, spec.relicCount, floor);
  const textures = loadDungeonTextures();
  let world: WorldHandle = buildWorld(maze, textures);
  const input = new Input();
  input.attach(opts.canvas);
  const audio = new GameAudio();

  const renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setClearColor(0x14100c, 1);

  const camera = new THREE.PerspectiveCamera(78, 1, 0.08, 80);
  camera.add(world.torchHand);

  const player: PlayerState = {
    x: 0,
    z: 0,
    yaw: 0,
    pitch: 0,
    vx: 0,
    vz: 0,
    eye: PLAYER_EYE,
  };

  let phase: GamePhase = "title";
  let elapsed = 0;
  let collected = 0;
  let bob = 0;
  let footAcc = 0;
  let trauma = 0;
  let lastHud = 0;
  let acc = 0;
  let last = performance.now();
  let running = true;
  let muted = false;
  let explored = new Uint8Array(maze.width * maze.height);
  let pauseQueued = false;
  let startQueued = false;
  let restartQueued: number | null = null;
  let descendQueued = false;
  let leaveQueued = false;
  let doorDeniedAt = 0;
  let newDeepest = false;
  let newBest = false;
  let notice = "";
  let noticeUntil = 0;
  let boons: BoonId[] = [];
  let quest: "idle" | "accepted" | "carried" | "done" = "idle";
  let leverStep = 0;
  let unsealed = false;
  let interactQueued = false;
  let chooseQueued: string | null = null;
  let eHeld = false;
  let newTrophies: string[] = [];
  let renownGain = 0;
  let dialogue: DialogueView | null = null;

  const tmpFwd = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpShake = new THREE.Vector3();

  function spawnPlayer() {
    const c = cellCenter(maze.start.x, maze.start.z);
    player.yaw = openNeighborYaw(maze);
    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    player.x = c.x + fx * 0.85;
    player.z = c.z + fz * 0.85;
    player.vx = 0;
    player.vz = 0;
    player.pitch = -0.04;
    player.eye = PLAYER_EYE;
    bob = 0;
    markExplored(player.x, player.z);
  }

  function markExplored(x: number, z: number) {
    const c = worldToCell(x, z);
    const r = bonuses().reveal;
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dz * dz > r * r + 1) continue;
        const gx = c.x + dx;
        const gz = c.z + dz;
        if (gx < 0 || gz < 0 || gx >= maze.width || gz >= maze.height) continue;
        explored[gz * maze.width + gx] = 1;
      }
    }
  }

  function bonuses() {
    const rec = readRecords();
    const idx = rankIndex(rec.renown);
    return {
      speed: (idx >= 1 ? 1.04 : 1) * (boons.includes("stride") ? 1.12 : 1),
      reveal: 2 + (idx >= 2 ? 1 : 0) + (boons.includes("cartograph") ? 1 : 0),
      pickup: 1.25 + (idx >= 3 ? 0.25 : 0) + (boons.includes("magnet") ? 0.45 : 0),
      torch: (idx >= 4 ? 1.2 : 1) * (boons.includes("beacon") ? 1.35 : 1),
    };
  }

  function applyTorch() {
    const t = bonuses().torch;
    world.handLight.intensity = 2.4 * t;
    world.handLight.distance = 12 * Math.min(1.5, t);
  }

  function dist2(ax: number, az: number, bx: number, bz: number) {
    const dx = ax - bx;
    const dz = az - bz;
    return dx * dx + dz * dz;
  }

  function puzzleComplete() {
    if (maze.puzzle.kind === "sigils") return world.sigils.length > 0 && world.sigils.every((s) => s.taken);
    return maze.puzzle.order.length > 0 && leverStep >= maze.puzzle.order.length;
  }

  function floorReady() {
    return collected >= maze.relics.length && puzzleComplete();
  }

  function tryUnseal() {
    if (unsealed || !floorReady()) return;
    unsealed = true;
    world.setExitOpen(true);
    audio.unseal();
    flashNotice("The exit unseals.");
  }

  function nearNpc() {
    if (!world.npc) return false;
    return dist2(player.x, player.z, world.npc.group.position.x, world.npc.group.position.z) < 1.85 * 1.85;
  }

  function nearLeverIndex() {
    let best = -1;
    let bestD = 1.55 * 1.55;
    for (let i = 0; i < world.levers.length; i++) {
      const l = world.levers[i]!;
      const d = dist2(player.x, player.z, l.group.position.x, l.group.position.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function promptText() {
    if (phase !== "playing") return "";
    if (nearNpc()) {
      const def = maze.npc ? NPCS[maze.npc.id] : null;
      if (quest === "carried") return `E  Return to ${def?.name ?? "them"}`;
      if (quest === "done") return `E  Speak with ${def?.name ?? "them"}`;
      return `E  Talk to ${def?.name ?? "someone"}`;
    }
    const li = nearLeverIndex();
    if (li >= 0) {
      const l = world.levers[li]!;
      return l.pulled ? "" : `E  Pull the ${glyphLabel(l.glyph)} lever`;
    }
    return "";
  }

  function objectives() {
    const list: { label: string; done: boolean }[] = [
      { label: `Relics  ${collected}/${maze.relics.length}`, done: collected >= maze.relics.length },
    ];
    if (maze.puzzle.kind === "sigils") {
      const n = world.sigils.filter((s) => s.taken).length;
      list.push({ label: `Sigils  ${n}/${world.sigils.length}`, done: n >= world.sigils.length && world.sigils.length > 0 });
    } else if (maze.puzzle.order.length) {
      const seq = maze.puzzle.order.map(glyphLabel).join(" → ");
      list.push({
        label: `Levers  ${seq}  (${Math.min(leverStep, maze.puzzle.order.length)}/${maze.puzzle.order.length})`,
        done: puzzleComplete(),
      });
    }
    if (maze.npc) {
      const def = NPCS[maze.npc.id];
      if (quest === "done") list.push({ label: `${def.name} — repaid`, done: true });
      else if (quest === "carried") list.push({ label: `Return the ${def.itemName}`, done: false });
      else list.push({ label: `Find ${def.name}'s ${def.itemName}`, done: false });
    }
    return list;
  }

  function openTalk() {
    if (!maze.npc) return;
    const def = NPCS[maze.npc.id];
    audio.talk();
    phase = "talking";
    input.exitLock();
    if (quest === "done") {
      dialogue = {
        name: def.name,
        title: def.title,
        portrait: def.portrait,
        text: def.done,
        options: [{ id: "ok", label: "Onward" }],
      };
    } else if (quest === "carried") {
      dialogue = {
        name: def.name,
        title: def.title,
        portrait: def.portrait,
        text: def.thanks,
        options: [{ id: "complete", label: `Return the ${def.itemName}` }],
      };
    } else if (quest === "accepted") {
      dialogue = {
        name: def.name,
        title: def.title,
        portrait: def.portrait,
        text: def.wait,
        options: [{ id: "ok", label: "I'll keep looking" }],
      };
    } else {
      dialogue = {
        name: def.name,
        title: def.title,
        portrait: def.portrait,
        text: def.greet,
        options: [
          { id: "accept", label: "I'll find it" },
          { id: "later", label: "Not now" },
        ],
      };
    }
    pushHud(true);
  }

  function closeTalk() {
    dialogue = null;
    if (phase === "talking") phase = "playing";
    void input.requestLock();
    pushHud(true);
  }

  function grantQuest() {
    if (!maze.npc || quest === "done") return;
    const def = NPCS[maze.npc.id];
    quest = "done";
    if (!boons.includes(def.boon)) boons.push(def.boon);
    const { newTrophies: fresh } = noteQuestComplete();
    if (fresh.length) newTrophies = [...newTrophies, ...fresh];
    applyTorch();
    const boon = BOONS[def.boon];
    flashNotice(`${boon.name}. ${boon.blurb}`);
    audio.puzzle();
  }

  function pullLever(index: number) {
    const lever = world.levers[index];
    if (!lever || lever.pulled) return;
    const expected = maze.puzzle.order[leverStep];
    audio.lever();
    if (lever.glyph !== expected) {
      leverStep = 0;
      for (let i = 0; i < world.levers.length; i++) world.setLever(i, false);
      flashNotice(`Wrong glyph. Order is ${maze.puzzle.order.map(glyphLabel).join(" then ")}.`);
      audio.locked();
      return;
    }
    world.setLever(index, true);
    leverStep += 1;
    world.setPedestal(leverStep, maze.puzzle.order.length);
    if (puzzleComplete()) {
      audio.puzzle();
      flashNotice("The seal drinks the last glyph.");
      tryUnseal();
    }
  }

  function doInteract() {
    if (phase === "talking") {
      const first = dialogue?.options[0]?.id;
      if (first) applyChoice(first);
      return;
    }
    if (phase !== "playing") return;
    if (nearNpc()) {
      openTalk();
      return;
    }
    const li = nearLeverIndex();
    if (li >= 0) pullLever(li);
  }

  function applyChoice(id: string) {
    if (id === "accept") {
      if (quest === "idle") quest = "accepted";
      closeTalk();
      flashNotice("Side quest taken. Hunt the corridors.");
    } else if (id === "complete") {
      grantQuest();
      closeTalk();
    } else {
      closeTalk();
    }
  }

  function applyCamera(sway = false, t = 0) {
    let yaw = player.yaw;
    let pitch = player.pitch;
    if (sway && !reduceMotion) {
      yaw += Math.sin(t * 0.28) * 0.12;
      pitch += Math.sin(t * 0.19) * 0.03 - 0.04;
    }
    camera.position.set(player.x, player.eye, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    camera.rotation.z = 0;
    if (phase === "playing" && !reduceMotion) {
      const speed = Math.hypot(player.vx, player.vz);
      const bobAmt = Math.min(1, speed / WALK);
      camera.position.y += Math.sin(bob) * 0.042 * bobAmt;
      tmpRight.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      camera.position.addScaledVector(tmpRight, Math.cos(bob * 0.5) * 0.012 * bobAmt);
    }
    if (trauma > 0.001 && !reduceMotion) {
      const s = trauma * trauma;
      tmpShake.set((Math.random() - 0.5) * s * 0.08, (Math.random() - 0.5) * s * 0.06, 0);
      camera.position.add(tmpShake);
      camera.rotation.z += (Math.random() - 0.5) * s * 0.02;
    }
  }

  function nearestTorches() {
    const lights = world.torchLights;
    if (!lights.length) return;
    const scored = world.torches.map((t, i) => ({
      i,
      d:
        (t.position.x - player.x) * (t.position.x - player.x) +
        (t.position.z - player.z) * (t.position.z - player.z),
    }));
    scored.sort((a, b) => a.d - b.d);
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i]!;
      const src = scored[i] ? world.torches[scored[i]!.i] : null;
      if (!src) {
        light.intensity = 0;
        continue;
      }
      light.position.set(src.position.x, 2.05, src.position.z);
      light.intensity = 1.65 + Math.sin(performance.now() * 0.012 + i) * 0.22;
    }
  }

  function flashNotice(text: string, ms = 2600) {
    notice = text;
    noticeUntil = performance.now() + ms;
  }

  function pickupRelics() {
    const reach = bonuses().pickup;
    const reach2 = reach * reach;
    for (let i = 0; i < world.relics.length; i++) {
      const r = world.relics[i]!;
      if (r.taken) continue;
      if (dist2(r.group.position.x, r.group.position.z, player.x, player.z) > reach2) continue;
      r.taken = true;
      r.group.visible = false;
      collected += 1;
      audio.pickup();
      trauma = Math.min(1, trauma + 0.28);
      emitBurst(world, r.group.position.x, r.group.position.y, r.group.position.z);
      addLifetimeRelic();
      addRenown(2);
      tryUnseal();
    }
  }

  function pickupWorldItems() {
    const reach = bonuses().pickup;
    const reach2 = reach * reach;
    for (const s of world.sigils) {
      if (s.taken) continue;
      if (dist2(s.group.position.x, s.group.position.z, player.x, player.z) > reach2) continue;
      s.taken = true;
      s.group.visible = false;
      audio.pickup();
      trauma = Math.min(1, trauma + 0.2);
      emitBurst(world, s.group.position.x, s.group.position.y + 0.2, s.group.position.z);
      const n = world.sigils.filter((x) => x.taken).length;
      world.setPedestal(n, world.sigils.length);
      if (puzzleComplete()) {
        audio.puzzle();
        flashNotice("The seal drinks the last sigil.");
      }
      tryUnseal();
    }
    const q = world.questItem;
    if (q && !q.taken && dist2(q.group.position.x, q.group.position.z, player.x, player.z) <= reach2) {
      q.taken = true;
      q.group.visible = false;
      audio.pickup();
      emitBurst(world, q.group.position.x, q.group.position.y, q.group.position.z);
      if (quest !== "done") quest = "carried";
      const def = maze.npc ? NPCS[maze.npc.id] : null;
      flashNotice(def ? `You pocket the ${def.itemName}. Return it.` : "You pocket a lost thing.");
    }
  }

  function checkWin() {
    const dx = world.exitPos.x - player.x;
    const dz = world.exitPos.z - player.z;
    if (dx * dx + dz * dz >= 1.05 * 1.05) return;
    if (!floorReady()) {
      const now = performance.now();
      if (now - doorDeniedAt > 1400) {
        doorDeniedAt = now;
        audio.locked();
        const missing: string[] = [];
        if (collected < maze.relics.length) missing.push("relics");
        if (!puzzleComplete()) missing.push(maze.puzzle.kind === "sigils" ? "sigils" : "levers");
        flashNotice(`The arch is sealed. Still bound: ${missing.join(" and ")}.`);
      }
      return;
    }
    phase = "won";
    audio.win();
    const rec = writeFloorClear(floor, elapsed, puzzleComplete(), boons.includes("hourglass"));
    newDeepest = rec.newDeepest;
    newBest = rec.newBest;
    newTrophies = rec.newTrophies;
    renownGain = rec.renownGain;
    input.exitLock();
    pushHud(true);
  }

  function step(dt: number) {
    if (phase === "paused" || phase === "won") return;
    const poll = input.poll();
    const eDown = input.down("KeyE");
    if (eDown && !eHeld) interactQueued = true;
    eHeld = eDown;
    if (interactQueued) {
      interactQueued = false;
      doInteract();
    }
    if (chooseQueued) {
      const id = chooseQueued;
      chooseQueued = null;
      applyChoice(id);
    }

    if (phase === "playing") {
      player.yaw -= poll.lookX * SENS;
      player.pitch -= poll.lookY * SENS;
      if (player.pitch > PITCH_LIM) player.pitch = PITCH_LIM;
      if (player.pitch < -PITCH_LIM) player.pitch = -PITCH_LIM;

      tmpFwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      tmpRight.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      const wishX = tmpFwd.x * poll.moveZ + tmpRight.x * poll.moveX;
      const wishZ = tmpFwd.z * poll.moveZ + tmpRight.z * poll.moveX;
      const mul = bonuses().speed;
      const speed = (poll.sprint ? SPRINT : WALK) * mul;
      const wishLen = Math.hypot(wishX, wishZ);

      if (wishLen > 0.001) {
        const ax = (wishX / wishLen) * speed;
        const az = (wishZ / wishLen) * speed;
        player.vx += (ax - player.vx) * Math.min(1, ACCEL * dt);
        player.vz += (az - player.vz) * Math.min(1, ACCEL * dt);
      } else {
        const damp = Math.exp(-FRICTION * dt);
        player.vx *= damp;
        player.vz *= damp;
        if (Math.hypot(player.vx, player.vz) < 0.02) {
          player.vx = 0;
          player.vz = 0;
        }
      }

      const next = moveWithCollision(maze, player.x, player.z, player.vx * dt, player.vz * dt, PLAYER_RADIUS);
      // Kill velocity into walls so collision feels solid, not bouncy.
      if (Math.abs(next.x - (player.x + player.vx * dt)) > 0.0001) player.vx = 0;
      if (Math.abs(next.z - (player.z + player.vz * dt)) > 0.0001) player.vz = 0;
      player.x = next.x;
      player.z = next.z;

      const spd = Math.hypot(player.vx, player.vz);
      if (spd > 0.4) bob += spd * 1.85 * dt;
      footAcc += spd * dt;
      if (footAcc > 1.55) {
        footAcc = 0;
        audio.footstep();
      }

      elapsed += dt;
      markExplored(player.x, player.z);
      pickupRelics();
      pickupWorldItems();
      checkWin();
    }

    trauma = Math.max(0, trauma - dt * 1.8);

    for (const r of world.relics) {
      if (r.taken) continue;
      r.bob += dt;
      r.group.position.y = r.baseY + Math.sin(r.bob * 2.2) * 0.08;
      r.group.rotation.y += dt * 1.1;
    }
    if (world.questItem && !world.questItem.taken) {
      const q = world.questItem;
      q.bob += dt;
      q.group.position.y = q.baseY + Math.sin(q.bob * 2.4) * 0.07;
      q.group.rotation.y += dt * 1.3;
    }
    for (const s of world.sigils) {
      if (s.taken) continue;
      s.bob += dt;
      const rune = s.group.children[1];
      if (rune) {
        rune.rotation.y += dt * 1.6;
        rune.position.y = 0.16 + Math.sin(s.bob * 2.5) * 0.04;
      }
    }
    if (world.npc) {
      const n = world.npc.group;
      n.position.y = maze.npc?.id === "vellum" ? 0.12 + Math.sin(performance.now() * 0.002) * 0.06 : 0;
      const dx = player.x - n.position.x;
      const dz = player.z - n.position.z;
      if (dx * dx + dz * dz < 64) n.rotation.y = Math.atan2(player.x - n.position.x, player.z - n.position.z);
    }
    const t = performance.now() * 0.001;
    for (let i = 0; i < world.flameSprites.length; i++) {
      const s = world.flameSprites[i]!;
      const flicker = 0.85 + Math.sin(t * 14 + i * 1.7) * 0.12 + Math.sin(t * 23 + i) * 0.06;
      s.scale.set(0.22 * flicker, 0.34 * flicker, 1);
    }
    stepParticles(world, dt);
    nearestTorches();
  }

  function resize() {
    const parent = opts.canvas.parentElement ?? opts.canvas;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function pushHud(force = false) {
    const now = performance.now();
    if (!force && now - lastHud < 80) return;
    lastHud = now;
    const mask = world.relics.map((r) => r.taken);
    drawMinimap(opts.minimap, maze, explored, player.x, player.z, player.yaw, mask, {
      questTaken: world.questItem?.taken ?? true,
      sigils: world.sigils.map((s) => s.taken),
      levers: world.levers.map((l) => l.pulled),
    });
    const rec = readRecords();
    const next = floorSpec(floor + 1);
    if (notice && performance.now() > noticeUntil) notice = "";
    const { rank, next: nxt } = rankSummary(rec.renown);
    useGameHud.getState().patch({
      phase,
      elapsed,
      collected,
      total: maze.relics.length,
      locked: input.pointerLocked,
      muted,
      seed: maze.seed,
      bestTime: rec.bestTime,
      floor,
      floorName: spec.name,
      doorOpen: unsealed,
      deepest: rec.deepest,
      lifetimeRelics: rec.relics,
      newDeepest,
      newBest,
      notice,
      nextFloor: next.floor,
      nextName: next.name,
      nextRelics: next.relicCount,
      prompt: promptText(),
      dialogue,
      objectives: objectives(),
      rankName: rank.name,
      rankBlurb: rank.blurb,
      renown: rec.renown,
      nextRankName: nxt?.name ?? null,
      nextRankAt: nxt?.min ?? rec.renown,
      boons: boons.map((id) => ({ id, name: BOONS[id].name, tag: BOONS[id].tag })),
      trophies: trophyViews(rec.trophies),
      newTrophies,
      renownGain,
    });
  }

  function resetFloorState() {
    quest = "idle";
    leverStep = 0;
    unsealed = false;
    dialogue = null;
    collected = 0;
    elapsed = 0;
    trauma = 0;
    newDeepest = false;
    newBest = false;
    notice = "";
    newTrophies = [];
    renownGain = 0;
  }

  function rebuild(seed: number, nextFloor = 1, keepPlaying = true) {
    camera.remove(world.torchHand);
    world.dispose();
    floor = nextFloor;
    if (floor === 1) boons = [];
    spec = floorSpec(floor);
    maze = generateMaze(seed, spec.size, spec.relicCount, floor);
    world = buildWorld(maze, textures);
    camera.add(world.torchHand);
    explored = new Uint8Array(maze.width * maze.height);
    resetFloorState();
    world.setExitOpen(false);
    applyTorch();
    spawnPlayer();
    if (!keepPlaying) phase = "title";
  }

  spawnPlayer();
  applyTorch();
  resize();
  pushHud(true);

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.code === "Escape") {
      if (phase === "playing") {
        pauseQueued = true;
      } else if (phase === "paused") {
        startQueued = true;
      }
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (phase === "talking") {
        interactQueued = true;
      } else if (phase === "won") descendQueued = true;
      else if (phase === "title") startQueued = true;
    }
  };
  window.addEventListener("keydown", onKey);

  opts.canvas.addEventListener("click", () => {
    if (phase === "playing") void input.requestLock();
  });

  function frame(now: number) {
    if (!running) return;
    const raw = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (pauseQueued && phase === "playing") {
      phase = "paused";
      input.exitLock();
      pauseQueued = false;
      pushHud(true);
    }
    if (startQueued && (phase === "title" || phase === "paused")) {
      if (phase === "title") {
        audio.unlock();
        audio.startAmbience();
        audio.whoosh();
      }
      phase = "playing";
      startQueued = false;
      void input.requestLock();
      pushHud(true);
    }
    if (restartQueued !== null) {
      const seed = restartQueued;
      restartQueued = null;
      rebuild(seed, 1, true);
      phase = "playing";
      audio.unlock();
      audio.startAmbience();
      audio.whoosh();
      void input.requestLock();
      pushHud(true);
    }
    if (descendQueued) {
      descendQueued = false;
      if (phase === "won") {
        const nextFloor = floor + 1;
        rebuild(nextKeepSeed(maze.seed, nextFloor), nextFloor, true);
        phase = "playing";
        audio.unlock();
        audio.startAmbience();
        audio.whoosh();
        void input.requestLock();
        pushHud(true);
      }
    }
    if (leaveQueued) {
      leaveQueued = false;
      rebuild((Math.random() * 0xffffffff) >>> 0, 1, false);
      phase = "title";
      input.exitLock();
      pushHud(true);
    }

    acc += raw;
    let steps = 0;
    while (acc >= FIXED && steps < 8) {
      step(FIXED);
      acc -= FIXED;
      steps++;
    }

    applyCamera(phase === "title", now * 0.001);
    renderer.render(world.scene, camera);
    pushHud(false);
  }
  renderer.setAnimationLoop(frame);

  window.__controlsTest = {
    getYaw: () => player.yaw,
    getSpeed: () => Math.hypot(player.vx, player.vz),
    getPosition: () => ({ x: player.x, z: player.z }),
    setKeys: (codes) => {
      if (phase === "title" || phase === "paused") {
        phase = "playing";
        audio.unlock();
        audio.startAmbience();
      }
      input.setKeys(codes);
    },
    setSteer: () => {
      /* FPS uses strafe, not yaw steer */
    },
    getExit: () => ({ x: world.exitPos.x, z: world.exitPos.z }),
    getRelics: () =>
      world.relics
        .filter((r) => !r.taken)
        .map((r) => ({ x: r.group.position.x, z: r.group.position.z })),
    setPosition: (x: number, z: number) => {
      player.x = x;
      player.z = z;
      player.vx = 0;
      player.vz = 0;
    },
    collectAll: () => {
      for (const r of world.relics) {
        if (r.taken) continue;
        r.taken = true;
        r.group.visible = false;
        collected += 1;
        addLifetimeRelic();
      }
      for (const s of world.sigils) {
        s.taken = true;
        s.group.visible = false;
      }
      leverStep = maze.puzzle.order.length;
      for (let i = 0; i < world.levers.length; i++) world.setLever(i, true);
      world.setPedestal(
        maze.puzzle.kind === "sigils" ? world.sigils.length : maze.puzzle.order.length,
        maze.puzzle.kind === "sigils" ? world.sigils.length : maze.puzzle.order.length,
      );
      tryUnseal();
    },
    completePuzzle: () => {
      for (const s of world.sigils) {
        s.taken = true;
        s.group.visible = false;
      }
      leverStep = maze.puzzle.order.length;
      for (let i = 0; i < world.levers.length; i++) world.setLever(i, true);
      tryUnseal();
    },
    getNpc: () => (world.npc ? { x: world.npc.group.position.x, z: world.npc.group.position.z } : null),
    getFloor: () => floor,
  };

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const rec = readRecords();
  useGameHud.getState().patch({
    coarse,
    seed: maze.seed,
    bestTime: rec.bestTime,
    total: maze.relics.length,
    floor,
    floorName: spec.name,
    deepest: rec.deepest,
    lifetimeRelics: rec.relics,
  });

  return {
    start: () => {
      startQueued = true;
    },
    pause: () => {
      pauseQueued = true;
    },
    resume: () => {
      startQueued = true;
    },
    restart: (seed) => {
      restartQueued = seed ?? ((Math.random() * 0xffffffff) >>> 0);
    },
    descend: () => {
      descendQueued = true;
    },
    leave: () => {
      leaveQueued = true;
    },
    interact: () => {
      interactQueued = true;
    },
    choose: (id) => {
      chooseQueued = id;
    },
    setMuted: (next) => {
      muted = next;
      audio.setMuted(next);
      pushHud(true);
    },
    setMoveStick: (x, y) => {
      input.stickX = x;
      input.stickY = y;
    },
    addLook: (dx, dy) => input.addLook(dx, dy),
    requestLock: () => {
      void input.requestLock();
    },
    dispose: () => {
      running = false;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      input.dispose();
      audio.dispose();
      camera.remove(world.torchHand);
      world.dispose();
      disposeDungeonTextures(textures);
      renderer.dispose();
      if (window.__controlsTest) delete window.__controlsTest;
    },
  };
}
