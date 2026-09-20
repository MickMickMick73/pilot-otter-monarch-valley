import type { BoonId, Glyph, NpcId, PuzzleKind, QuestItemId } from "./content";

export type RelicKind = "coin" | "gem" | "d20" | "potion";

export type GamePhase = "title" | "playing" | "paused" | "won" | "talking";

export interface CellPos {
  x: number;
  z: number;
}

export interface MazeNpc {
  id: NpcId;
  x: number;
  z: number;
  yaw: number;
}

export interface MazeQuestItem {
  kind: QuestItemId;
  x: number;
  z: number;
}

export interface MazeLever {
  x: number;
  z: number;
  yaw: number;
  glyph: Glyph;
}

export interface MazePuzzle {
  kind: PuzzleKind;
  sigils: CellPos[];
  levers: MazeLever[];
  order: Glyph[];
  pedestal: CellPos;
}

export interface MazeData {
  width: number;
  height: number;
  /** 1 = wall, 0 = floor. Index: z * width + x */
  cells: Uint8Array;
  start: CellPos;
  exit: CellPos;
  relics: { x: number; z: number; kind: RelicKind }[];
  deadEnds: CellPos[];
  seed: number;
  floor: number;
  npc: MazeNpc | null;
  questItem: MazeQuestItem | null;
  puzzle: MazePuzzle;
}

export interface PlayerState {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vz: number;
  eye: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  elapsed: number;
  collected: number;
  total: number;
  locked: boolean;
  muted: boolean;
  seed: number;
  bestTime: number | null;
}

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  getPosition: () => { x: number; z: number };
  setKeys: (codes: string[]) => void;
  setSteer?: (v: number) => void;
  getExit?: () => { x: number; z: number };
  getRelics?: () => { x: number; z: number }[];
  setPosition?: (x: number, z: number) => void;
  collectAll?: () => void;
  getFloor?: () => number;
  completePuzzle?: () => void;
  getNpc?: () => { x: number; z: number } | null;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}
