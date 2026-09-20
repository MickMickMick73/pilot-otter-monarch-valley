import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Gem, i as Map, n as Volume2, o as DoorOpen, s as Clock, t as VolumeX } from "../_libs/lucide-react.mjs";
import { C as PointsMaterial, D as SpriteMaterial, E as Sprite, O as StaticDrawUsage, S as Points, T as Scene, _ as Object3D, a as BufferGeometry, b as PlaneGeometry, c as CylinderGeometry, d as Group, f as HemisphereLight, g as MeshLambertMaterial, h as Mesh, i as BufferAttribute, k as Vector3, l as DirectionalLight, m as InstancedMesh, n as AmbientLight, o as CanvasTexture, p as IcosahedronGeometry, r as BoxGeometry, s as Color, t as WebGLRenderer, u as FogExp2, v as OctahedronGeometry, w as SRGBColorSpace, x as PointLight, y as PerspectiveCamera } from "../_libs/three.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BIKdLAey.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Procedural dungeon SFX. Unlocked on the first user gesture. */
var GameAudio = class {
	ctx = null;
	master = null;
	sfx = null;
	music = null;
	drone = null;
	drone2 = null;
	muted = false;
	started = false;
	unlock() {
		if (!this.ctx) {
			const Ctor = window.AudioContext || window.webkitAudioContext;
			this.ctx = new Ctor({ latencyHint: "interactive" });
			this.master = this.ctx.createGain();
			this.sfx = this.ctx.createGain();
			this.music = this.ctx.createGain();
			this.master.gain.value = .7;
			this.sfx.gain.value = .9;
			this.music.gain.value = .14;
			this.sfx.connect(this.master);
			this.music.connect(this.master);
			this.master.connect(this.ctx.destination);
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(next) {
		this.muted = next;
		if (this.master && this.ctx) this.master.gain.setTargetAtTime(next ? 0 : .7, this.ctx.currentTime, .04);
	}
	startAmbience() {
		this.unlock();
		const ctx = this.ctx;
		const music = this.music;
		if (!ctx || !music || this.started) return;
		this.started = true;
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = 73;
		const g = ctx.createGain();
		g.gain.value = .22;
		const filt = ctx.createBiquadFilter();
		filt.type = "lowpass";
		filt.frequency.value = 280;
		osc.connect(g);
		g.connect(filt);
		filt.connect(music);
		osc.start();
		this.drone = osc;
		const osc2 = ctx.createOscillator();
		osc2.type = "triangle";
		osc2.frequency.value = 110;
		const g2 = ctx.createGain();
		g2.gain.value = .08;
		osc2.connect(g2);
		g2.connect(music);
		osc2.start();
		this.drone2 = osc2;
	}
	stopAmbience() {
		try {
			this.drone?.stop();
			this.drone2?.stop();
		} catch {}
		this.drone = null;
		this.drone2 = null;
		this.started = false;
	}
	pickup() {
		this.unlock();
		const ctx = this.ctx;
		const sfx = this.sfx;
		if (!ctx || !sfx) return;
		const now = ctx.currentTime;
		[
			523.25,
			659.25,
			783.99
		].forEach((f, i) => {
			const osc = ctx.createOscillator();
			osc.type = "triangle";
			osc.frequency.value = f * (.98 + Math.random() * .04);
			const g = ctx.createGain();
			g.gain.setValueAtTime(1e-4, now);
			g.gain.exponentialRampToValueAtTime(.18, now + .02 + i * .04);
			g.gain.exponentialRampToValueAtTime(1e-4, now + .28 + i * .05);
			osc.connect(g);
			g.connect(sfx);
			osc.start(now + i * .04);
			osc.stop(now + .4 + i * .05);
		});
	}
	footstep() {
		this.unlock();
		const ctx = this.ctx;
		const sfx = this.sfx;
		if (!ctx || !sfx) return;
		const now = ctx.currentTime;
		const dur = .07;
		const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.playbackRate.value = .7 + Math.random() * .3;
		const filt = ctx.createBiquadFilter();
		filt.type = "lowpass";
		filt.frequency.value = 420 + Math.random() * 180;
		const g = ctx.createGain();
		g.gain.setValueAtTime(.16, now);
		g.gain.exponentialRampToValueAtTime(1e-4, now + dur);
		src.connect(filt);
		filt.connect(g);
		g.connect(sfx);
		src.start(now);
	}
	win() {
		this.unlock();
		const ctx = this.ctx;
		const sfx = this.sfx;
		if (!ctx || !sfx) return;
		const now = ctx.currentTime;
		[
			261.63,
			329.63,
			392,
			523.25,
			659.25
		].forEach((f, i) => {
			const osc = ctx.createOscillator();
			osc.type = i % 2 ? "triangle" : "sine";
			osc.frequency.value = f;
			const g = ctx.createGain();
			const t = now + i * .11;
			g.gain.setValueAtTime(1e-4, t);
			g.gain.exponentialRampToValueAtTime(.2, t + .03);
			g.gain.exponentialRampToValueAtTime(1e-4, t + .55);
			osc.connect(g);
			g.connect(sfx);
			osc.start(t);
			osc.stop(t + .6);
		});
	}
	whoosh() {
		this.unlock();
		const ctx = this.ctx;
		const sfx = this.sfx;
		if (!ctx || !sfx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(180, now);
		osc.frequency.exponentialRampToValueAtTime(60, now + .35);
		const g = ctx.createGain();
		g.gain.setValueAtTime(1e-4, now);
		g.gain.exponentialRampToValueAtTime(.08, now + .04);
		g.gain.exponentialRampToValueAtTime(1e-4, now + .4);
		const filt = ctx.createBiquadFilter();
		filt.type = "lowpass";
		filt.frequency.value = 640;
		osc.connect(filt);
		filt.connect(g);
		g.connect(sfx);
		osc.start(now);
		osc.stop(now + .42);
	}
	dispose() {
		this.stopAmbience();
		this.ctx?.close();
		this.ctx = null;
		this.master = null;
		this.sfx = null;
		this.music = null;
	}
};
/** mulberry32 — seeded PRNG, same seed → identical sequence. */
function mulberry32(seed) {
	let s = seed | 0;
	return () => {
		s |= 0;
		s = s + 1831565813 | 0;
		let t = Math.imul(s ^ s >>> 15, 1 | s);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function randInt(rng, min, max) {
	return min + Math.floor(rng() * (max - min + 1));
}
function pick(rng, items) {
	return items[Math.floor(rng() * items.length)];
}
function shuffle(rng, items) {
	const out = items.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}
var CELL = 3.4;
var WALL_H = 3.2;
var PLAYER_RADIUS = .38;
var PLAYER_EYE = 1.52;
var DIRS = [
	[0, -2],
	[2, 0],
	[0, 2],
	[-2, 0]
];
function idx(width, x, z) {
	return z * width + x;
}
function inBounds(width, height, x, z) {
	return x > 0 && z > 0 && x < width - 1 && z < height - 1;
}
function floodCount(cells, width, height, sx, sz) {
	const seen = new Uint8Array(cells.length);
	const stack = [idx(width, sx, sz)];
	seen[idx(width, sx, sz)] = 1;
	let n = 0;
	while (stack.length) {
		const i = stack.pop();
		n++;
		const x = i % width;
		const z = i / width | 0;
		const nbs = [
			[x + 1, z],
			[x - 1, z],
			[x, z + 1],
			[x, z - 1]
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
function farthestCell(cells, width, height, sx, sz) {
	const dist = new Int16Array(cells.length).fill(-1);
	const q = [idx(width, sx, sz)];
	dist[idx(width, sx, sz)] = 0;
	let best = q[0];
	let bestD = 0;
	let head = 0;
	while (head < q.length) {
		const i = q[head++];
		const d = dist[i];
		if (d > bestD) {
			bestD = d;
			best = i;
		}
		const x = i % width;
		const z = i / width | 0;
		const nbs = [
			[x + 1, z],
			[x - 1, z],
			[x, z + 1],
			[x, z - 1]
		];
		for (const [nx, nz] of nbs) {
			if (nx < 0 || nz < 0 || nx >= width || nz >= height) continue;
			const j = idx(width, nx, nz);
			if (cells[j] === 1 || dist[j] >= 0) continue;
			dist[j] = d + 1;
			q.push(j);
		}
	}
	return {
		x: best % width,
		z: best / width | 0,
		dist: bestD
	};
}
function floorNeighbors(cells, width, height, x, z) {
	let n = 0;
	if (x + 1 < width && cells[idx(width, x + 1, z)] === 0) n++;
	if (x - 1 >= 0 && cells[idx(width, x - 1, z)] === 0) n++;
	if (z + 1 < height && cells[idx(width, x, z + 1)] === 0) n++;
	if (z - 1 >= 0 && cells[idx(width, x, z - 1)] === 0) n++;
	return n;
}
var KINDS = [
	"coin",
	"coin",
	"gem",
	"gem",
	"gem",
	"d20",
	"potion",
	"coin",
	"potion"
];
function generateMaze(seed, size = 17) {
	const width = size | 1;
	const height = size | 1;
	const rng = mulberry32(seed);
	const cells = new Uint8Array(width * height).fill(1);
	const carve = (x, z) => {
		cells[idx(width, x, z)] = 0;
	};
	const startX = 1;
	const startZ = 1;
	carve(startX, startZ);
	const stack = [[startX, startZ]];
	while (stack.length) {
		const [cx, cz] = stack[stack.length - 1];
		const options = shuffle(rng, DIRS.filter(([dx, dz]) => {
			const nx = cx + dx;
			const nz = cz + dz;
			return inBounds(width, height, nx, nz) && cells[idx(width, nx, nz)] === 1;
		}));
		if (!options.length) {
			stack.pop();
			continue;
		}
		const [dx, dz] = options[0];
		const nx = cx + dx;
		const nz = cz + dz;
		carve(cx + dx / 2, cz + dz / 2);
		carve(nx, nz);
		stack.push([nx, nz]);
	}
	const loopTries = Math.floor(width * .7);
	for (let i = 0; i < loopTries; i++) {
		const x = randInt(rng, 1, width - 2);
		const z = randInt(rng, 1, height - 2);
		if (cells[idx(width, x, z)] === 0) continue;
		if (floorNeighbors(cells, width, height, x, z) >= 2) cells[idx(width, x, z)] = 0;
	}
	const floors = [];
	const deadEnds = [];
	for (let z = 1; z < height - 1; z++) for (let x = 1; x < width - 1; x++) {
		if (cells[idx(width, x, z)] !== 0) continue;
		floors.push({
			x,
			z
		});
		if (floorNeighbors(cells, width, height, x, z) === 1 && !(x === startX && z === startZ)) deadEnds.push({
			x,
			z
		});
	}
	const far = farthestCell(cells, width, height, startX, startZ);
	const exit = {
		x: far.x,
		z: far.z
	};
	if (floodCount(cells, width, height, startX, startZ) < floors.length) return generateMaze((seed ^ 2654435769) >>> 0, size);
	const relics = shuffle(rng, floors.filter((c) => {
		const dStart = Math.abs(c.x - startX) + Math.abs(c.z - startZ);
		const dExit = Math.abs(c.x - exit.x) + Math.abs(c.z - exit.z);
		return dStart >= 3 && dExit >= 2;
	})).slice(0, 9).map((c, i) => ({
		x: c.x,
		z: c.z,
		kind: KINDS[i % KINDS.length] ?? pick(rng, KINDS)
	}));
	return {
		width,
		height,
		cells,
		start: {
			x: startX,
			z: startZ
		},
		exit,
		relics,
		deadEnds,
		seed
	};
}
function isWall(maze, x, z) {
	if (x < 0 || z < 0 || x >= maze.width || z >= maze.height) return true;
	return maze.cells[z * maze.width + x] === 1;
}
function cellCenter(x, z) {
	return {
		x: (x + .5) * CELL,
		z: (z + .5) * CELL
	};
}
function worldToCell(x, z) {
	return {
		x: Math.floor(x / CELL),
		z: Math.floor(z / CELL)
	};
}
function openNeighborYaw(maze) {
	const { x, z } = maze.start;
	if (!isWall(maze, x + 1, z)) return -Math.PI / 2;
	if (!isWall(maze, x, z + 1)) return Math.PI;
	if (!isWall(maze, x - 1, z)) return Math.PI / 2;
	return 0;
}
/**
* Circle (XZ) vs nearby wall AABBs. Resolves in place and returns the
* corrected position. Separate-axis-ish: iterate nearby cells, push out along
* the minimum translation so walls feel solid and you slide along them.
*/
function resolvePlayer(maze, x, z, radius) {
	const cx = Math.floor(x / CELL);
	const cz = Math.floor(z / CELL);
	let px = x;
	let pz = z;
	for (let iter = 0; iter < 3; iter++) {
		let hit = false;
		for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
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
		if (!hit) break;
	}
	return {
		x: px,
		z: pz
	};
}
function circleAabb(x, z, radius, minX, maxX, minZ, maxZ) {
	if (x > minX && x < maxX && z > minZ && z < maxZ) {
		const left = x - minX;
		const right = maxX - x;
		const up = z - minZ;
		const down = maxZ - z;
		const m = Math.min(left, right, up, down);
		if (m === left) return {
			x: minX - radius,
			z
		};
		if (m === right) return {
			x: maxX + radius,
			z
		};
		if (m === up) return {
			x,
			z: minZ - radius
		};
		return {
			x,
			z: maxZ + radius
		};
	}
	const closestX = Math.max(minX, Math.min(x, maxX));
	const closestZ = Math.max(minZ, Math.min(z, maxZ));
	const dx = x - closestX;
	const dz = z - closestZ;
	const d2 = dx * dx + dz * dz;
	if (d2 >= radius * radius) return {
		x,
		z
	};
	if (d2 < 1e-8) return {
		x,
		z
	};
	const d = Math.sqrt(d2);
	const push = radius - d;
	return {
		x: x + dx / d * push,
		z: z + dz / d * push
	};
}
/** Move X then Z so sliding along walls stays smooth. */
function moveWithCollision(maze, x, z, dx, dz, radius) {
	const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .18));
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
	return {
		x: px,
		z: pz
	};
}
var GAME_CODES = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ShiftLeft",
	"ShiftRight",
	"KeyE",
	"Space",
	"KeyM",
	"KeyR"
]);
var Input = class {
	keys = /* @__PURE__ */ new Set();
	qaHeld = /* @__PURE__ */ new Set();
	lookX = 0;
	lookY = 0;
	stickX = 0;
	stickY = 0;
	pointerLocked = false;
	/** Accumulated mouse look this frame (consumed in poll). */
	mx = 0;
	my = 0;
	canvas = null;
	dragging = false;
	lastDragX = 0;
	lastDragY = 0;
	unbind = [];
	attach(canvas) {
		this.canvas = canvas;
		const onKeyDown = (e) => {
			if (e.repeat) {
				if (GAME_CODES.has(e.code)) e.preventDefault();
				return;
			}
			this.keys.add(e.code);
			if (GAME_CODES.has(e.code)) e.preventDefault();
		};
		const onKeyUp = (e) => {
			this.keys.delete(e.code);
		};
		const clear = () => this.keys.clear();
		const onMouseMove = (e) => {
			if (this.pointerLocked) {
				this.mx += e.movementX;
				this.my += e.movementY;
			} else if (this.dragging) {
				this.mx += e.clientX - this.lastDragX;
				this.my += e.clientY - this.lastDragY;
				this.lastDragX = e.clientX;
				this.lastDragY = e.clientY;
			}
		};
		const onPointerDown = (e) => {
			if (e.button !== 0) return;
			if (this.pointerLocked) return;
			if (e.target !== canvas) return;
			this.dragging = true;
			this.lastDragX = e.clientX;
			this.lastDragY = e.clientY;
			canvas.setPointerCapture(e.pointerId);
		};
		const onPointerUp = (e) => {
			this.dragging = false;
			if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
		};
		const onLockChange = () => {
			this.pointerLocked = document.pointerLockElement === canvas;
			if (!this.pointerLocked) this.dragging = false;
		};
		const onContext = (e) => e.preventDefault();
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("blur", clear);
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) clear();
		});
		window.addEventListener("mousemove", onMouseMove);
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointercancel", onPointerUp);
		document.addEventListener("pointerlockchange", onLockChange);
		canvas.addEventListener("contextmenu", onContext);
		this.unbind = [
			() => window.removeEventListener("keydown", onKeyDown),
			() => window.removeEventListener("keyup", onKeyUp),
			() => window.removeEventListener("blur", clear),
			() => window.removeEventListener("mousemove", onMouseMove),
			() => canvas.removeEventListener("pointerdown", onPointerDown),
			() => canvas.removeEventListener("pointerup", onPointerUp),
			() => canvas.removeEventListener("pointercancel", onPointerUp),
			() => document.removeEventListener("pointerlockchange", onLockChange),
			() => canvas.removeEventListener("contextmenu", onContext)
		];
	}
	async requestLock() {
		const canvas = this.canvas;
		if (!canvas) return;
		try {
			const ret = canvas.requestPointerLock({ unadjustedMovement: true });
			if (ret && typeof ret.then === "function") await ret;
		} catch {
			try {
				canvas.requestPointerLock();
			} catch {}
		}
	}
	exitLock() {
		if (document.pointerLockElement) document.exitPointerLock();
	}
	setKeys(codes) {
		this.qaHeld = new Set(codes);
	}
	down(code) {
		return this.keys.has(code) || this.qaHeld.has(code);
	}
	poll() {
		let moveX = this.stickX;
		let moveZ = this.stickY;
		if (this.down("KeyD") || this.down("ArrowRight")) moveX += 1;
		if (this.down("KeyA") || this.down("ArrowLeft")) moveX -= 1;
		if (this.down("KeyW") || this.down("ArrowUp")) moveZ += 1;
		if (this.down("KeyS") || this.down("ArrowDown")) moveZ -= 1;
		const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
		if (pads) for (const pad of pads) {
			if (!pad || pad.mapping !== "standard") continue;
			const lx = pad.axes[0] ?? 0;
			const ly = pad.axes[1] ?? 0;
			const mag = Math.hypot(lx, ly);
			const dz = .18;
			if (mag > dz) {
				const scale = (mag - dz) / .8200000000000001 / mag;
				moveX += lx * scale;
				moveZ += -ly * scale;
			}
			const rx = pad.axes[2] ?? 0;
			const ry = pad.axes[3] ?? 0;
			if (Math.hypot(rx, ry) > .18) {
				this.mx += rx * 18;
				this.my += ry * 14;
			}
			if (pad.buttons[12]?.pressed) moveZ += 1;
			if (pad.buttons[13]?.pressed) moveZ -= 1;
			if (pad.buttons[14]?.pressed) moveX -= 1;
			if (pad.buttons[15]?.pressed) moveX += 1;
		}
		const len = Math.hypot(moveX, moveZ);
		if (len > 1) {
			moveX /= len;
			moveZ /= len;
		}
		const lookX = this.mx;
		const lookY = this.my;
		this.mx = 0;
		this.my = 0;
		const sprint = this.down("ShiftLeft") || this.down("ShiftRight");
		return {
			moveX,
			moveZ,
			lookX,
			lookY,
			sprint
		};
	}
	addLook(dx, dy) {
		this.mx += dx;
		this.my += dy;
	}
	dispose() {
		for (const fn of this.unbind) fn();
		this.unbind = [];
		this.keys.clear();
		this.qaHeld.clear();
	}
};
function drawMinimap(canvas, maze, explored, playerX, playerZ, yaw, collectedMask) {
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
	const inner = w - 16;
	const cell = inner / Math.max(maze.width, maze.height);
	const ox = pad + (inner - maze.width * cell) / 2;
	const oy = pad + (inner - maze.height * cell) / 2;
	for (let z = 0; z < maze.height; z++) for (let x = 0; x < maze.width; x++) {
		const known = explored[z * maze.width + x] === 1;
		const wall = isWall(maze, x, z);
		if (!known) {
			ctx.fillStyle = "#1a1510";
			ctx.fillRect(ox + x * cell, oy + z * cell, cell + .4, cell + .4);
			continue;
		}
		ctx.fillStyle = wall ? "#3a322a" : "#cbbfa6";
		ctx.fillRect(ox + x * cell, oy + z * cell, cell + .4, cell + .4);
	}
	const exitCx = (maze.exit.x + .5) * CELL;
	const exitCz = (maze.exit.z + .5) * CELL;
	if (explored[maze.exit.z * maze.width + maze.exit.x]) {
		ctx.fillStyle = "#c45c32";
		ctx.beginPath();
		ctx.arc(ox + exitCx / CELL * cell, oy + exitCz / CELL * cell, Math.max(2.4, cell * .28), 0, Math.PI * 2);
		ctx.fill();
	}
	maze.relics.forEach((r, i) => {
		if (collectedMask[i]) return;
		if (!explored[r.z * maze.width + r.x]) return;
		ctx.fillStyle = "#d4a84b";
		ctx.beginPath();
		ctx.arc(ox + (r.x + .5) * cell, oy + (r.z + .5) * cell, Math.max(1.6, cell * .18), 0, Math.PI * 2);
		ctx.fill();
	});
	const pc = worldToCell(playerX, playerZ);
	if (pc.x >= 0 && pc.z >= 0) {
		const px = ox + playerX / CELL * cell;
		const pz = oy + playerZ / CELL * cell;
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
function roundRect(ctx, x, y, w, h, r) {
	const rr = Math.min(r, w / 2, h / 2);
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
}
var BEST_KEY = "wyrmwood-keep-best";
function readBestTime() {
	try {
		const raw = localStorage.getItem(BEST_KEY);
		if (!raw) return null;
		const n = Number(raw);
		return Number.isFinite(n) && n > 0 ? n : null;
	} catch {
		return null;
	}
}
function writeBestTime(seconds) {
	try {
		const prev = readBestTime();
		if (prev === null || seconds < prev) localStorage.setItem(BEST_KEY, String(seconds));
	} catch {}
}
var useGameHud = create((set) => ({
	phase: "title",
	elapsed: 0,
	collected: 0,
	total: 9,
	locked: false,
	muted: false,
	seed: 0,
	bestTime: null,
	coarse: false,
	setPhase: (phase) => set({ phase }),
	patch: (partial) => set(partial)
}));
var WALL_COLORS = [
	8022620,
	9074278,
	7233104,
	8548447,
	7627862
];
var FLOOR_A = 11835e3;
var FLOOR_B = 10519144;
var FLOOR_MOSS = 6982232;
var CEIL = 4866104;
function mat(color, opts) {
	return new MeshLambertMaterial({
		color,
		flatShading: true,
		emissive: opts?.emissive ?? 0,
		emissiveIntensity: opts?.emissiveIntensity ?? 0,
		transparent: opts?.transparent ?? false,
		opacity: opts?.opacity ?? 1
	});
}
function flameTexture() {
	const c = document.createElement("canvas");
	c.width = 64;
	c.height = 64;
	const g = c.getContext("2d");
	const grd = g.createRadialGradient(32, 38, 2, 32, 32, 28);
	grd.addColorStop(0, "rgba(255, 240, 180, 1)");
	grd.addColorStop(.35, "rgba(255, 140, 40, 0.9)");
	grd.addColorStop(.7, "rgba(196, 92, 50, 0.35)");
	grd.addColorStop(1, "rgba(0, 0, 0, 0)");
	g.fillStyle = grd;
	g.fillRect(0, 0, 64, 64);
	const tex = new CanvasTexture(c);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}
function makeRelic(kind) {
	const g = new Group();
	if (kind === "coin") {
		const geo = new CylinderGeometry(.16, .16, .045, 10);
		geo.rotateX(Math.PI / 2);
		const m = new Mesh(geo, mat(13936715, {
			emissive: 6965776,
			emissiveIntensity: .25
		}));
		g.add(m);
		const inner = new Mesh(new CylinderGeometry(.08, .08, .05, 8), mat(12093742));
		inner.rotation.x = Math.PI / 2;
		g.add(inner);
	} else if (kind === "gem") {
		const colors = [
			12729122,
			2984538,
			2776990
		];
		const color = colors[Math.floor(Math.random() * colors.length)];
		const m = new Mesh(new OctahedronGeometry(.18, 0), mat(color, {
			emissive: color,
			emissiveIntensity: .22
		}));
		g.add(m);
	} else if (kind === "d20") {
		const m = new Mesh(new IcosahedronGeometry(.2, 0), mat(15920096, {
			emissive: 9121326,
			emissiveIntensity: .12
		}));
		g.add(m);
	} else {
		const body = new Mesh(new CylinderGeometry(.09, .12, .22, 8), mat(2984538, {
			emissive: 1331758,
			emissiveIntensity: .2
		}));
		body.position.y = .02;
		const neck = new Mesh(new CylinderGeometry(.04, .05, .08, 8), mat(13352870));
		neck.position.y = .16;
		const cork = new Mesh(new CylinderGeometry(.035, .035, .04, 8), mat(6969932));
		cork.position.y = .21;
		g.add(body, neck, cork);
	}
	g.traverse((o) => {
		if (o instanceof Mesh) {
			o.castShadow = false;
			o.receiveShadow = false;
		}
	});
	return g;
}
function addTorch(parent, x, y, z, rotY, flameTex, flames) {
	const holder = new Group();
	holder.position.set(x, y, z);
	holder.rotation.y = rotY;
	const bracket = new Mesh(new BoxGeometry(.08, .18, .08), mat(3813930));
	bracket.position.set(0, 0, .12);
	const stick = new Mesh(new CylinderGeometry(.03, .035, .34, 6), mat(6045747));
	stick.position.set(0, .12, .22);
	const bowl = new Mesh(new CylinderGeometry(.05, .03, .06, 6), mat(6969932));
	bowl.position.set(0, .3, .22);
	const sprite = new Sprite(new SpriteMaterial({
		map: flameTex,
		transparent: true,
		depthWrite: false,
		color: 16760944
	}));
	sprite.position.set(0, .42, .22);
	sprite.scale.set(.28, .42, 1);
	holder.add(bracket, stick, bowl, sprite);
	parent.add(holder);
	flames.push(sprite);
	return holder;
}
function buildWorld(maze) {
	const rng = mulberry32(maze.seed ^ 20973);
	const scene = new Scene();
	scene.background = new Color(2234900);
	scene.fog = new FogExp2(2234900, .028);
	const hemi = new HemisphereLight(14993826, 3812386, 1.05);
	scene.add(hemi);
	const ambient = new AmbientLight(6969416, .55);
	scene.add(ambient);
	const sun = new DirectionalLight(16765608, .55);
	sun.position.set(4, 10, -6);
	scene.add(sun);
	const disposables = [];
	const materials = [];
	const geometries = [];
	const trackMat = (m) => {
		materials.push(m);
		return m;
	};
	const trackGeo = (g) => {
		geometries.push(g);
		return g;
	};
	const wallMat = trackMat(mat(6049346));
	const floorMat = trackMat(mat(9073760));
	const ceilMat = trackMat(mat(CEIL));
	let wallCount = 0;
	let floorCount = 0;
	for (let z = 0; z < maze.height; z++) for (let x = 0; x < maze.width; x++) if (isWall(maze, x, z)) wallCount++;
	else floorCount++;
	const wallGeo = trackGeo(new BoxGeometry(CELL, WALL_H, CELL));
	const walls = new InstancedMesh(wallGeo, wallMat, wallCount);
	walls.instanceMatrix.setUsage(StaticDrawUsage);
	walls.frustumCulled = false;
	walls.receiveShadow = true;
	const floorGeo = trackGeo(new BoxGeometry(CELL, .14, CELL));
	const floor = new InstancedMesh(floorGeo, floorMat, floorCount);
	floor.instanceMatrix.setUsage(StaticDrawUsage);
	floor.frustumCulled = false;
	floor.receiveShadow = true;
	const ceilGeo = trackGeo(new BoxGeometry(CELL, .16, CELL));
	const ceiling = new InstancedMesh(ceilGeo, ceilMat, floorCount);
	ceiling.instanceMatrix.setUsage(StaticDrawUsage);
	ceiling.frustumCulled = false;
	const dummy = new Object3D();
	const color = new Color();
	let wi = 0;
	let fi = 0;
	const torchSpots = [];
	for (let z = 0; z < maze.height; z++) for (let x = 0; x < maze.width; x++) {
		const wx = (x + .5) * CELL;
		const wz = (z + .5) * CELL;
		if (isWall(maze, x, z)) {
			dummy.position.set(wx, WALL_H / 2, wz);
			dummy.rotation.set(0, 0, 0);
			dummy.updateMatrix();
			walls.setMatrixAt(wi, dummy.matrix);
			color.setHex(WALL_COLORS[randInt(rng, 0, WALL_COLORS.length - 1)]);
			walls.setColorAt(wi, color);
			wi++;
			continue;
		}
		dummy.position.set(wx, -.07, wz);
		dummy.updateMatrix();
		floor.setMatrixAt(fi, dummy.matrix);
		const moss = rng() < .08;
		color.setHex(moss ? FLOOR_MOSS : (x + z) % 2 === 0 ? FLOOR_A : FLOOR_B);
		floor.setColorAt(fi, color);
		dummy.position.set(wx, WALL_H + .08, wz);
		dummy.updateMatrix();
		ceiling.setMatrixAt(fi, dummy.matrix);
		color.setHex(CEIL);
		ceiling.setColorAt(fi, color);
		fi++;
		if (rng() < .16) {
			const faces = [];
			if (isWall(maze, x + 1, z)) faces.push({
				dx: 1,
				dz: 0,
				rotY: -Math.PI / 2
			});
			if (isWall(maze, x - 1, z)) faces.push({
				dx: -1,
				dz: 0,
				rotY: Math.PI / 2
			});
			if (isWall(maze, x, z + 1)) faces.push({
				dx: 0,
				dz: 1,
				rotY: Math.PI
			});
			if (isWall(maze, x, z - 1)) faces.push({
				dx: 0,
				dz: -1,
				rotY: 0
			});
			if (faces.length) {
				const f = faces[randInt(rng, 0, faces.length - 1)];
				torchSpots.push({
					x: wx + f.dx * (CELL * .5 - .08),
					z: wz + f.dz * (CELL * .5 - .08),
					rotY: f.rotY
				});
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
	const flameSprites = [];
	const torches = [];
	for (const t of torchSpots) torches.push(addTorch(scene, t.x, 1.55, t.z, t.rotY, flameTex, flameSprites));
	const torchLights = [];
	for (let i = 0; i < 5; i++) {
		const light = new PointLight(16751178, 0, 14, 1.35);
		light.position.set(0, 2, 0);
		scene.add(light);
		torchLights.push(light);
	}
	const bannerMatA = trackMat(mat(9121326));
	const bannerMatB = trackMat(mat(3033658));
	const bannerGeo = trackGeo(new BoxGeometry(.7, 1.1, .04));
	let banners = 0;
	for (let z = 1; z < maze.height - 1 && banners < 14; z++) for (let x = 1; x < maze.width - 1 && banners < 14; x++) {
		if (isWall(maze, x, z)) continue;
		if (rng() > .08) continue;
		const faces = [];
		if (isWall(maze, x, z - 1)) faces.push({
			px: 0,
			pz: -CELL * .5 + .06,
			rotY: 0
		});
		if (isWall(maze, x, z + 1)) faces.push({
			px: 0,
			pz: CELL * .5 - .06,
			rotY: 0
		});
		if (isWall(maze, x - 1, z)) faces.push({
			px: -CELL * .5 + .06,
			pz: 0,
			rotY: Math.PI / 2
		});
		if (isWall(maze, x + 1, z)) faces.push({
			px: CELL * .5 - .06,
			pz: 0,
			rotY: Math.PI / 2
		});
		if (!faces.length) continue;
		const f = faces[randInt(rng, 0, faces.length - 1)];
		const mesh = new Mesh(bannerGeo, rng() < .5 ? bannerMatA : bannerMatB);
		const c = cellCenter(x, z);
		mesh.position.set(c.x + f.px, 1.7, c.z + f.pz);
		mesh.rotation.y = f.rotY;
		scene.add(mesh);
		banners++;
	}
	const barrelMat = trackMat(mat(6966834));
	const barrelGeo = trackGeo(new CylinderGeometry(.28, .3, .52, 8));
	const lidGeo = trackGeo(new CylinderGeometry(.26, .26, .05, 8));
	const lidMat = trackMat(mat(4864040));
	for (const d of maze.deadEnds.slice(0, 8)) {
		if (d.x === maze.exit.x && d.z === maze.exit.z) continue;
		if (rng() < .35) continue;
		const c = cellCenter(d.x, d.z);
		const b = new Mesh(barrelGeo, barrelMat);
		b.position.set(c.x + (rng() - .5) * .6, .26, c.z + (rng() - .5) * .6);
		const lid = new Mesh(lidGeo, lidMat);
		lid.position.copy(b.position);
		lid.position.y = .54;
		scene.add(b, lid);
	}
	const beamMat = trackMat(mat(3811868));
	const beamGeo = trackGeo(new BoxGeometry(CELL * .95, .1, .12));
	for (let z = 1; z < maze.height - 1; z += 2) for (let x = 1; x < maze.width - 1; x += 2) {
		if (isWall(maze, x, z)) continue;
		if (rng() > .45) continue;
		const c = cellCenter(x, z);
		const beam = new Mesh(beamGeo, beamMat);
		beam.position.set(c.x, WALL_H - .12, c.z);
		beam.rotation.y = rng() < .5 ? 0 : Math.PI / 2;
		scene.add(beam);
	}
	const relics = maze.relics.map((r, i) => {
		const group = makeRelic(r.kind);
		const c = cellCenter(r.x, r.z);
		group.position.set(c.x, .55, c.z);
		scene.add(group);
		return {
			group,
			kind: r.kind,
			taken: false,
			bob: i * .7,
			baseY: .55
		};
	});
	const exitC = cellCenter(maze.exit.x, maze.exit.z);
	const exitGroup = new Group();
	exitGroup.position.set(exitC.x, 0, exitC.z);
	const pillarGeo = trackGeo(new BoxGeometry(.32, 2.4, .32));
	const stoneMat = trackMat(mat(8022613, {
		emissive: 12868658,
		emissiveIntensity: .08
	}));
	const p1 = new Mesh(pillarGeo, stoneMat);
	p1.position.set(-.7, 1.2, 0);
	const p2 = new Mesh(pillarGeo, stoneMat);
	p2.position.set(.7, 1.2, 0);
	const lintel = new Mesh(trackGeo(new BoxGeometry(1.85, .28, .38)), stoneMat);
	lintel.position.set(0, 2.42, 0);
	const portal = new Mesh(trackGeo(new PlaneGeometry(1.2, 2.1)), trackMat(mat(12868658, {
		emissive: 16751178,
		emissiveIntensity: .65,
		transparent: true,
		opacity: .55
	})));
	portal.position.set(0, 1.15, 0);
	const exitLight = new PointLight(16756832, 1.6, 8, 1.4);
	exitLight.position.set(0, 1.6, 0);
	exitGroup.add(p1, p2, lintel, portal, exitLight);
	let exitYaw = 0;
	if (!isWall(maze, maze.exit.x, maze.exit.z - 1)) exitYaw = 0;
	else if (!isWall(maze, maze.exit.x, maze.exit.z + 1)) exitYaw = Math.PI;
	else if (!isWall(maze, maze.exit.x + 1, maze.exit.z)) exitYaw = -Math.PI / 2;
	else exitYaw = Math.PI / 2;
	exitGroup.rotation.y = exitYaw;
	scene.add(exitGroup);
	const pCount = 64;
	const pGeo = trackGeo(new BufferGeometry());
	const pPos = /* @__PURE__ */ new Float32Array(192);
	pPos.fill(0);
	pGeo.setAttribute("position", new BufferAttribute(pPos, 3));
	const pMat = trackMat(new PointsMaterial({
		color: 16765562,
		size: .08,
		transparent: true,
		opacity: .9,
		depthWrite: false,
		sizeAttenuation: true
	}));
	const particles = new Points(pGeo, pMat);
	scene.add(particles);
	const particleAges = new Float32Array(pCount).fill(99);
	const particleVel = /* @__PURE__ */ new Float32Array(192);
	const torchHand = new Group();
	const handStick = new Mesh(new CylinderGeometry(.025, .03, .42, 6), mat(6045747));
	handStick.rotation.x = .5;
	handStick.position.set(0, -.05, 0);
	const handBowl = new Mesh(new CylinderGeometry(.04, .03, .05, 6), mat(6969932));
	handBowl.position.set(0, .16, -.08);
	const handFlame = new Sprite(new SpriteMaterial({
		map: flameTex,
		transparent: true,
		depthWrite: false
	}));
	handFlame.position.set(0, .28, -.1);
	handFlame.scale.set(.22, .32, 1);
	flameSprites.push(handFlame);
	const handLight = new PointLight(16756832, 2.4, 12, 1.25);
	handLight.position.set(.05, .25, 0);
	torchHand.add(handStick, handBowl, handFlame, handLight);
	torchHand.position.set(.28, -.28, -.48);
	const dispose = () => {
		scene.traverse((obj) => {
			if (obj instanceof Mesh || obj instanceof InstancedMesh || obj instanceof Points) {
				obj.geometry?.dispose();
				const m = obj.material;
				if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
				else m?.dispose();
			}
			if (obj instanceof Sprite) obj.material.dispose();
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
		exitPos: new Vector3(exitC.x, 0, exitC.z),
		torches,
		torchLights,
		flameSprites,
		particles,
		particleAges,
		particleVel,
		torchHand,
		dispose
	};
}
function emitBurst(world, x, y, z, count = 14) {
	const pos = world.particles.geometry.getAttribute("position");
	let spawned = 0;
	for (let i = 0; i < world.particleAges.length && spawned < count; i++) {
		if (world.particleAges[i] < .6) continue;
		world.particleAges[i] = 0;
		pos.setXYZ(i, x, y, z);
		world.particleVel[i * 3] = (Math.random() - .5) * 2.2;
		world.particleVel[i * 3 + 1] = 1.2 + Math.random() * 1.8;
		world.particleVel[i * 3 + 2] = (Math.random() - .5) * 2.2;
		spawned++;
	}
	pos.needsUpdate = true;
}
function stepParticles(world, dt) {
	const pos = world.particles.geometry.getAttribute("position");
	for (let i = 0; i < world.particleAges.length; i++) {
		world.particleAges[i] += dt;
		if (world.particleAges[i] > .7) {
			pos.setXYZ(i, 0, -10, 0);
			continue;
		}
		const vx = world.particleVel[i * 3];
		const vy = world.particleVel[i * 3 + 1];
		const vz = world.particleVel[i * 3 + 2];
		pos.setXYZ(i, pos.getX(i) + vx * dt, pos.getY(i) + vy * dt, pos.getZ(i) + vz * dt);
		world.particleVel[i * 3 + 1] = vy - 4.5 * dt;
	}
	pos.needsUpdate = true;
}
var FIXED = 1 / 60;
var SENS = .0022;
var WALK = 4.35;
var SPRINT = 6.55;
var ACCEL = 18;
var PITCH_LIM = Math.PI / 2 - .04;
function readSeed() {
	try {
		const q = new URLSearchParams(window.location.search).get("seed");
		if (q && /^\d+$/.test(q)) return Number(q) >>> 0;
	} catch {}
	return Math.random() * 4294967295 >>> 0;
}
function createEngine(opts) {
	const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let maze = generateMaze(readSeed());
	let world = buildWorld(maze);
	const input = new Input();
	input.attach(opts.canvas);
	const audio = new GameAudio();
	const renderer = new WebGLRenderer({
		canvas: opts.canvas,
		antialias: true,
		alpha: false,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.35;
	renderer.setClearColor(1314828, 1);
	const camera = new PerspectiveCamera(78, 1, .08, 80);
	camera.add(world.torchHand);
	const player = {
		x: 0,
		z: 0,
		yaw: 0,
		pitch: 0,
		vx: 0,
		vz: 0,
		eye: PLAYER_EYE
	};
	let phase = "title";
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
	const explored = new Uint8Array(maze.width * maze.height);
	let pauseQueued = false;
	let startQueued = false;
	let restartQueued = null;
	const tmpFwd = new Vector3();
	const tmpRight = new Vector3();
	const tmpShake = new Vector3();
	function spawnPlayer() {
		const c = cellCenter(maze.start.x, maze.start.z);
		player.yaw = openNeighborYaw(maze);
		const fx = -Math.sin(player.yaw);
		const fz = -Math.cos(player.yaw);
		player.x = c.x + fx * .85;
		player.z = c.z + fz * .85;
		player.vx = 0;
		player.vz = 0;
		player.pitch = -.04;
		player.eye = PLAYER_EYE;
		bob = 0;
		markExplored(player.x, player.z);
	}
	function markExplored(x, z) {
		const c = worldToCell(x, z);
		const r = 2;
		for (let dz = -2; dz <= r; dz++) for (let dx = -2; dx <= r; dx++) {
			if (dx * dx + dz * dz > 5) continue;
			const gx = c.x + dx;
			const gz = c.z + dz;
			if (gx < 0 || gz < 0 || gx >= maze.width || gz >= maze.height) continue;
			explored[gz * maze.width + gx] = 1;
		}
	}
	function applyCamera(sway = false, t = 0) {
		let yaw = player.yaw;
		let pitch = player.pitch;
		if (sway && !reduceMotion) {
			yaw += Math.sin(t * .28) * .12;
			pitch += Math.sin(t * .19) * .03 - .04;
		}
		camera.position.set(player.x, player.eye, player.z);
		camera.rotation.order = "YXZ";
		camera.rotation.y = yaw;
		camera.rotation.x = pitch;
		camera.rotation.z = 0;
		if (phase === "playing" && !reduceMotion) {
			const speed = Math.hypot(player.vx, player.vz);
			const bobAmt = Math.min(1, speed / WALK);
			camera.position.y += Math.sin(bob) * .042 * bobAmt;
			tmpRight.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
			camera.position.addScaledVector(tmpRight, Math.cos(bob * .5) * .012 * bobAmt);
		}
		if (trauma > .001 && !reduceMotion) {
			const s = trauma * trauma;
			tmpShake.set((Math.random() - .5) * s * .08, (Math.random() - .5) * s * .06, 0);
			camera.position.add(tmpShake);
			camera.rotation.z += (Math.random() - .5) * s * .02;
		}
	}
	function nearestTorches() {
		const lights = world.torchLights;
		if (!lights.length) return;
		const scored = world.torches.map((t, i) => ({
			i,
			d: (t.position.x - player.x) * (t.position.x - player.x) + (t.position.z - player.z) * (t.position.z - player.z)
		}));
		scored.sort((a, b) => a.d - b.d);
		for (let i = 0; i < lights.length; i++) {
			const light = lights[i];
			const src = scored[i] ? world.torches[scored[i].i] : null;
			if (!src) {
				light.intensity = 0;
				continue;
			}
			light.position.set(src.position.x, 2.05, src.position.z);
			light.intensity = 1.65 + Math.sin(performance.now() * .012 + i) * .22;
		}
	}
	function pickupRelics() {
		for (let i = 0; i < world.relics.length; i++) {
			const r = world.relics[i];
			if (r.taken) continue;
			const dx = r.group.position.x - player.x;
			const dz = r.group.position.z - player.z;
			if (dx * dx + dz * dz > 1.5625) continue;
			r.taken = true;
			r.group.visible = false;
			collected += 1;
			audio.pickup();
			trauma = Math.min(1, trauma + .28);
			emitBurst(world, r.group.position.x, r.group.position.y, r.group.position.z);
		}
	}
	function checkWin() {
		const dx = world.exitPos.x - player.x;
		const dz = world.exitPos.z - player.z;
		if (dx * dx + dz * dz < 1.1025) {
			phase = "won";
			audio.win();
			writeBestTime(elapsed);
			input.exitLock();
			pushHud(true);
		}
	}
	function step(dt) {
		if (phase === "paused" || phase === "won") return;
		const poll = input.poll();
		if (phase === "playing") {
			player.yaw -= poll.lookX * SENS;
			player.pitch -= poll.lookY * SENS;
			if (player.pitch > PITCH_LIM) player.pitch = PITCH_LIM;
			if (player.pitch < -PITCH_LIM) player.pitch = -PITCH_LIM;
			tmpFwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
			tmpRight.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
			const wishX = tmpFwd.x * poll.moveZ + tmpRight.x * poll.moveX;
			const wishZ = tmpFwd.z * poll.moveZ + tmpRight.z * poll.moveX;
			const speed = poll.sprint ? SPRINT : WALK;
			const wishLen = Math.hypot(wishX, wishZ);
			if (wishLen > .001) {
				const ax = wishX / wishLen * speed;
				const az = wishZ / wishLen * speed;
				player.vx += (ax - player.vx) * Math.min(1, ACCEL * dt);
				player.vz += (az - player.vz) * Math.min(1, ACCEL * dt);
			} else {
				const damp = Math.exp(-9 * dt);
				player.vx *= damp;
				player.vz *= damp;
				if (Math.hypot(player.vx, player.vz) < .02) {
					player.vx = 0;
					player.vz = 0;
				}
			}
			const next = moveWithCollision(maze, player.x, player.z, player.vx * dt, player.vz * dt, PLAYER_RADIUS);
			if (Math.abs(next.x - (player.x + player.vx * dt)) > 1e-4) player.vx = 0;
			if (Math.abs(next.z - (player.z + player.vz * dt)) > 1e-4) player.vz = 0;
			player.x = next.x;
			player.z = next.z;
			const spd = Math.hypot(player.vx, player.vz);
			if (spd > .4) bob += spd * 1.85 * dt;
			footAcc += spd * dt;
			if (footAcc > 1.55) {
				footAcc = 0;
				audio.footstep();
			}
			elapsed += dt;
			markExplored(player.x, player.z);
			pickupRelics();
			checkWin();
		}
		trauma = Math.max(0, trauma - dt * 1.8);
		for (const r of world.relics) {
			if (r.taken) continue;
			r.bob += dt;
			r.group.position.y = r.baseY + Math.sin(r.bob * 2.2) * .08;
			r.group.rotation.y += dt * 1.1;
		}
		const t = performance.now() * .001;
		for (let i = 0; i < world.flameSprites.length; i++) {
			const s = world.flameSprites[i];
			const flicker = .85 + Math.sin(t * 14 + i * 1.7) * .12 + Math.sin(t * 23 + i) * .06;
			s.scale.set(.22 * flicker, .34 * flicker, 1);
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
		drawMinimap(opts.minimap, maze, explored, player.x, player.z, player.yaw, mask);
		useGameHud.getState().patch({
			phase,
			elapsed,
			collected,
			total: maze.relics.length,
			locked: input.pointerLocked,
			muted,
			seed: maze.seed,
			bestTime: readBestTime()
		});
	}
	function rebuild(seed) {
		camera.remove(world.torchHand);
		world.dispose();
		maze = generateMaze(seed);
		world = buildWorld(maze);
		camera.add(world.torchHand);
		explored.fill(0);
		collected = 0;
		elapsed = 0;
		trauma = 0;
		spawnPlayer();
	}
	spawnPlayer();
	resize();
	pushHud(true);
	const onResize = () => resize();
	window.addEventListener("resize", onResize);
	const onKey = (e) => {
		if (e.repeat) return;
		if (e.code === "Escape") {
			if (phase === "playing") pauseQueued = true;
			else if (phase === "paused") startQueued = true;
		}
	};
	window.addEventListener("keydown", onKey);
	opts.canvas.addEventListener("click", () => {
		if (phase === "playing") input.requestLock();
	});
	function frame(now) {
		if (!running) return;
		const raw = Math.min((now - last) / 1e3, .1);
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
			input.requestLock();
			pushHud(true);
		}
		if (restartQueued !== null) {
			const seed = restartQueued;
			restartQueued = null;
			rebuild(seed);
			phase = "playing";
			audio.unlock();
			audio.startAmbience();
			audio.whoosh();
			input.requestLock();
			pushHud(true);
		}
		acc += raw;
		let steps = 0;
		while (acc >= FIXED && steps < 8) {
			step(FIXED);
			acc -= FIXED;
			steps++;
		}
		applyCamera(phase === "title", now * .001);
		renderer.render(world.scene, camera);
		pushHud(false);
	}
	renderer.setAnimationLoop(frame);
	window.__controlsTest = {
		getYaw: () => player.yaw,
		getSpeed: () => Math.hypot(player.vx, player.vz),
		getPosition: () => ({
			x: player.x,
			z: player.z
		}),
		setKeys: (codes) => {
			if (phase === "title" || phase === "paused") {
				phase = "playing";
				audio.unlock();
				audio.startAmbience();
			}
			input.setKeys(codes);
		},
		setSteer: () => {},
		getExit: () => ({
			x: world.exitPos.x,
			z: world.exitPos.z
		}),
		getRelics: () => world.relics.filter((r) => !r.taken).map((r) => ({
			x: r.group.position.x,
			z: r.group.position.z
		})),
		setPosition: (x, z) => {
			player.x = x;
			player.z = z;
			player.vx = 0;
			player.vz = 0;
		}
	};
	const coarse = window.matchMedia("(pointer: coarse)").matches;
	useGameHud.getState().patch({
		coarse,
		seed: maze.seed,
		bestTime: readBestTime(),
		total: maze.relics.length
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
			restartQueued = seed ?? Math.random() * 4294967295 >>> 0;
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
			input.requestLock();
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
			renderer.dispose();
			if (window.__controlsTest) delete window.__controlsTest;
		}
	};
}
function formatTime(s) {
	const m = Math.floor(s / 60);
	const secs = Math.floor(s % 60);
	const tenth = Math.floor(s * 10 % 10);
	return `${m}:${secs.toString().padStart(2, "0")}.${tenth}`;
}
function DungeonGame() {
	const canvasRef = (0, import_react.useRef)(null);
	const miniRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const hud = useGameHud();
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const mini = miniRef.current;
		if (!canvas || !mini) return;
		const engine = createEngine({
			canvas,
			minimap: mini
		});
		engineRef.current = engine;
		return () => {
			engine.dispose();
			engineRef.current = null;
		};
	}, []);
	const start = () => engineRef.current?.start();
	const resume = () => engineRef.current?.resume();
	const pause = () => engineRef.current?.pause();
	const restart = () => engineRef.current?.restart();
	const toggleMute = () => engineRef.current?.setMuted(!hud.muted);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-ink text-parchment touch-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full",
				onClick: () => {
					if (hud.phase === "playing") engineRef.current?.requestLock();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudChrome, {
				phase: hud.phase,
				elapsed: hud.elapsed,
				collected: hud.collected,
				total: hud.total,
				muted: hud.muted,
				locked: hud.locked,
				miniRef,
				onMute: toggleMute,
				onPause: pause
			}),
			hud.phase === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleOverlay, {
				onStart: start,
				bestTime: hud.bestTime
			}),
			hud.phase === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseOverlay, {
				onResume: resume,
				onRestart: restart
			}),
			hud.phase === "won" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinOverlay, {
				elapsed: hud.elapsed,
				collected: hud.collected,
				total: hud.total,
				bestTime: hud.bestTime,
				seed: hud.seed,
				onAgain: restart
			}),
			hud.phase === "playing" && !hud.locked && !hud.coarse && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookHint, {}),
			hud.coarse && hud.phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {
				onStick: (x, y) => engineRef.current?.setMoveStick(x, y),
				onLook: (dx, dy) => engineRef.current?.addLook(dx, dy)
			})
		]
	});
}
function HudChrome(props) {
	const live = props.phase === "playing" || props.phase === "paused" || props.phase === "won";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 p-3 sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-2",
					children: live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
							className: "size-3.5",
							strokeWidth: 1.75
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular",
							children: formatTime(props.elapsed)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, {
							className: "size-3.5",
							strokeWidth: 1.75
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular",
							children: [
								props.collected,
								"/",
								props.total
							]
						})] })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
						label: props.muted ? "Unmute" : "Mute",
						onClick: props.onMute,
						children: props.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
					}), props.phase === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
						label: "Pause",
						onClick: props.onPause,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-xs tracking-wide",
							children: "Esc"
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute top-1/2 left-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-parchment/80 shadow-[0_0_8px_rgba(232,220,196,0.5)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-3 bottom-3 sm:right-4 sm:bottom-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: props.miniRef,
						className: "block size-28 rounded-xl sm:size-36",
						width: 148,
						height: 148
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-2 left-2 flex items-center gap-1 text-parchment-dim",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, {
							className: "size-3",
							strokeWidth: 1.75
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-[10px] tracking-[0.14em] uppercase",
							children: "Keep"
						})]
					})]
				})
			})
		]
	});
}
function Chip({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-1.5 rounded-lg border border-border bg-oak/80 px-2.5 py-1.5 font-display text-xs tracking-wide text-parchment",
		children
	});
}
function IconBtn({ children, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: "grid size-11 place-items-center rounded-lg border border-border bg-oak/85 text-parchment transition-colors duration-150 hover:border-border-strong hover:bg-panel",
		children
	});
}
function TitleOverlay({ onStart, bestTime }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-ink/80 via-ink/25 to-transparent p-4 pb-8 sm:items-center sm:pb-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-3xl border border-border bg-oak/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[11px] tracking-[0.28em] text-ember uppercase",
					children: "Forgotten dungeon"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-3xl leading-none font-semibold tracking-tight text-parchment sm:text-5xl",
					children: "Wyrmwood Keep"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm font-serif text-sm leading-relaxed text-parchment-dim sm:text-base",
					children: "Relics still gleam in the dark. Map the corridors, gather what the last party left behind, and find the sealed exit."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onStart,
					className: "mt-6 w-full rounded-xl bg-parchment px-5 py-3.5 font-display text-sm font-semibold tracking-wide text-ink transition-transform duration-150 hover:bg-parchment-dim active:scale-[0.98]",
					children: "Enter the Keep"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 font-serif text-xs text-parchment-dim",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "WASD to walk" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Mouse to look" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Shift to sprint" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Esc to pause" })
					]
				}),
				bestTime !== null && bestTime > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 font-display text-[11px] tracking-wide text-gold uppercase",
					children: ["Best delve ", formatTime(bestTime)]
				})
			]
		})
	});
}
function PauseOverlay({ onResume, onRestart }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 grid place-items-center bg-ink/55 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-3xl border border-border bg-oak p-6 sm:p-7",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-semibold tracking-tight",
					children: "Paused"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-serif text-sm text-parchment-dim",
					children: "The keep waits. Torchlight holds."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onResume,
						className: "rounded-xl bg-parchment px-5 py-3 font-display text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]",
						children: "Resume"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onRestart,
						className: "rounded-xl border border-border bg-panel px-5 py-3 font-display text-sm text-parchment transition-colors duration-150 hover:border-border-strong",
						children: "New delve"
					})]
				})
			]
		})
	});
}
function WinOverlay(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 grid place-items-center bg-ink/60 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-3xl border border-border bg-oak p-6 sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[11px] tracking-[0.28em] text-ember uppercase",
					children: "Exit found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl font-semibold tracking-tight",
					children: "The keep yields"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-serif text-sm text-parchment-dim",
					children: "Daylight, of a sort. Count the spoils."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-5 grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Time",
						value: formatTime(props.elapsed)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Relics",
						value: `${props.collected}/${props.total}`,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, { className: "size-3.5" })
					})]
				}),
				props.bestTime !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 font-display text-[11px] tracking-wide text-gold uppercase",
					children: ["Best ", formatTime(props.bestTime)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: props.onAgain,
					className: "mt-6 w-full rounded-xl bg-parchment px-5 py-3.5 font-display text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]",
					children: "Delve again"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 flex items-center gap-1.5 font-serif text-[11px] text-parchment-dim",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoorOpen, { className: "size-3" }),
						"Seed ",
						props.seed
					]
				})
			]
		})
	});
}
function Stat({ label, value, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-panel p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
			className: "flex items-center gap-1 font-display text-[10px] tracking-[0.16em] text-parchment-dim uppercase",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-display text-xl tabular text-parchment",
			children: value
		})]
	});
}
function LookHint() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4 sm:bottom-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-lg border border-border bg-oak/80 px-3 py-2 font-serif text-xs text-parchment-dim",
			children: "Click the dungeon to look around"
		})
	});
}
function TouchControls({ onStick, onLook }) {
	const [knob, setKnob] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const origin = (0, import_react.useRef)(null);
	const lookId = (0, import_react.useRef)(null);
	const lastLook = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const stickRef = (0, import_react.useRef)(onStick);
	stickRef.current = onStick;
	(0, import_react.useEffect)(() => () => stickRef.current(0, 0), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-30",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto absolute bottom-6 left-5 size-28",
			onPointerDown: (e) => {
				origin.current = {
					x: e.clientX,
					y: e.clientY,
					id: e.pointerId
				};
				e.currentTarget.setPointerCapture(e.pointerId);
			},
			onPointerMove: (e) => {
				if (!origin.current || origin.current.id !== e.pointerId) return;
				const dx = e.clientX - origin.current.x;
				const dy = e.clientY - origin.current.y;
				const max = 42;
				const mag = Math.hypot(dx, dy);
				const s = mag > max ? max / mag : 1;
				const nx = dx * s / max;
				const ny = -(dy * s) / max;
				setKnob({
					x: dx * s,
					y: dy * s
				});
				onStick(nx, ny);
			},
			onPointerUp: (e) => {
				origin.current = null;
				setKnob({
					x: 0,
					y: 0
				});
				onStick(0, 0);
				if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 rounded-full border border-border bg-oak/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-panel",
				style: { transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-auto absolute inset-y-0 right-0 w-1/2",
			onPointerDown: (e) => {
				lookId.current = e.pointerId;
				lastLook.current = {
					x: e.clientX,
					y: e.clientY
				};
				e.currentTarget.setPointerCapture(e.pointerId);
			},
			onPointerMove: (e) => {
				if (lookId.current !== e.pointerId) return;
				onLook(e.clientX - lastLook.current.x, e.clientY - lastLook.current.y);
				lastLook.current = {
					x: e.clientX,
					y: e.clientY
				};
			},
			onPointerUp: (e) => {
				lookId.current = null;
				if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
			}
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DungeonGame, {});
}
//#endregion
export { Home as component };
