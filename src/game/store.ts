import { create } from "zustand";
import { RANKS, TROPHIES, rankFor, type BoonId } from "./content";
import type { GamePhase } from "./types";

const BEST_KEY = "wyrmwood-keep-best";
const RECORDS_KEY = "wyrmwood-keep-records";

export interface KeepRecords {
  bestTime: number | null;
  deepest: number;
  relics: number;
  floorsCleared: number;
  renown: number;
  quests: number;
  puzzles: number;
  trophies: string[];
}

export interface DialogueView {
  name: string;
  title: string;
  portrait: string;
  text: string;
  options: { id: string; label: string }[];
}

export interface ObjectiveView {
  label: string;
  done: boolean;
}

export interface BoonView {
  id: BoonId;
  name: string;
  tag: string;
}

export interface TrophyView {
  id: string;
  name: string;
  blurb: string;
  earned: boolean;
}

const EMPTY: KeepRecords = {
  bestTime: null,
  deepest: 0,
  relics: 0,
  floorsCleared: 0,
  renown: 0,
  quests: 0,
  puzzles: 0,
  trophies: [],
};

export function readBestTime(): number | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeBestTime(seconds: number) {
  try {
    const prev = readBestTime();
    if (prev === null || seconds < prev) localStorage.setItem(BEST_KEY, String(seconds));
  } catch {
    /* ignore quota */
  }
}

export function readRecords(): KeepRecords {
  const bestTime = readBestTime();
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return { ...EMPTY, bestTime };
    const parsed = JSON.parse(raw) as Partial<KeepRecords>;
    return {
      bestTime: typeof parsed.bestTime === "number" && parsed.bestTime > 0 ? parsed.bestTime : bestTime,
      deepest: num(parsed.deepest),
      relics: num(parsed.relics),
      floorsCleared: num(parsed.floorsCleared),
      renown: num(parsed.renown),
      quests: num(parsed.quests),
      puzzles: num(parsed.puzzles),
      trophies: Array.isArray(parsed.trophies) ? parsed.trophies.filter((t) => typeof t === "string") : [],
    };
  } catch {
    return { ...EMPTY, bestTime };
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

function writeRecords(next: KeepRecords) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
    if (next.bestTime !== null) writeBestTime(next.bestTime);
  } catch {
    /* ignore quota */
  }
}

function trophyIds(rec: KeepRecords): string[] {
  const have = new Set(rec.trophies);
  const earned: string[] = [];
  const mark = (id: string, ok: boolean) => {
    if (ok && !have.has(id)) earned.push(id);
  };
  mark("first-light", rec.floorsCleared >= 1);
  mark("kindred", rec.quests >= 1);
  mark("rune-wise", rec.puzzles >= 3);
  mark("deep-delver", rec.deepest >= 4);
  mark("patron", rec.quests >= 5);
  mark("keeps-heart", rec.deepest >= 7);
  mark("reliquary", rec.relics >= 50);
  mark("swift-shadow", rec.bestTime !== null && rec.bestTime > 0 && rec.bestTime < 45);
  return earned;
}

function applyTrophies(rec: KeepRecords): string[] {
  const fresh = trophyIds(rec);
  if (fresh.length) rec.trophies = [...rec.trophies, ...fresh];
  return fresh;
}

export function addLifetimeRelic(): KeepRecords {
  const rec = readRecords();
  rec.relics += 1;
  applyTrophies(rec);
  writeRecords(rec);
  return rec;
}

export function addRenown(amount: number): KeepRecords {
  const rec = readRecords();
  rec.renown += Math.max(0, amount);
  writeRecords(rec);
  return rec;
}

export function noteQuestComplete(): { rec: KeepRecords; newTrophies: string[] } {
  const rec = readRecords();
  rec.quests += 1;
  rec.renown += 25;
  const newTrophies = applyTrophies(rec);
  writeRecords(rec);
  return { rec, newTrophies };
}

export function writeFloorClear(
  floor: number,
  seconds: number,
  puzzleSolved: boolean,
  hourglass: boolean,
): KeepRecords & { newDeepest: boolean; newBest: boolean; newTrophies: string[]; renownGain: number } {
  const rec = readRecords();
  const newDeepest = floor > rec.deepest;
  const newBest = rec.bestTime === null || seconds < rec.bestTime;
  if (newDeepest) rec.deepest = floor;
  if (newBest) rec.bestTime = seconds;
  rec.floorsCleared += 1;
  if (puzzleSolved) rec.puzzles += 1;
  let renownGain = 15 + floor * 3;
  if (puzzleSolved) renownGain += 8;
  if (seconds < 60) renownGain += 10;
  if (hourglass) renownGain = Math.round(renownGain * 1.25);
  rec.renown += renownGain;
  const newTrophies = applyTrophies(rec);
  writeRecords(rec);
  writeBestTime(seconds);
  return { ...rec, newDeepest, newBest, newTrophies, renownGain };
}

export function trophyViews(earned: string[]): TrophyView[] {
  const have = new Set(earned);
  return TROPHIES.map((t) => ({ ...t, earned: have.has(t.id) }));
}

export interface GameHud {
  phase: GamePhase;
  elapsed: number;
  collected: number;
  total: number;
  locked: boolean;
  muted: boolean;
  seed: number;
  bestTime: number | null;
  coarse: boolean;
  floor: number;
  floorName: string;
  doorOpen: boolean;
  deepest: number;
  lifetimeRelics: number;
  newDeepest: boolean;
  newBest: boolean;
  notice: string;
  nextFloor: number;
  nextName: string;
  nextRelics: number;
  prompt: string;
  dialogue: DialogueView | null;
  objectives: ObjectiveView[];
  rankName: string;
  rankBlurb: string;
  renown: number;
  nextRankName: string | null;
  nextRankAt: number;
  boons: BoonView[];
  trophies: TrophyView[];
  newTrophies: string[];
  renownGain: number;
  setPhase: (phase: GamePhase) => void;
  patch: (partial: Partial<Omit<GameHud, "setPhase" | "patch">>) => void;
}

export const useGameHud = create<GameHud>((set) => ({
  phase: "title",
  elapsed: 0,
  collected: 0,
  total: 7,
  locked: false,
  muted: false,
  seed: 0,
  bestTime: null,
  coarse: false,
  floor: 1,
  floorName: "The Gate Halls",
  doorOpen: false,
  deepest: 0,
  lifetimeRelics: 0,
  newDeepest: false,
  newBest: false,
  notice: "",
  nextFloor: 2,
  nextName: "The Wyrmwood Vaults",
  nextRelics: 9,
  prompt: "",
  dialogue: null,
  objectives: [],
  rankName: RANKS[0]!.name,
  rankBlurb: RANKS[0]!.blurb,
  renown: 0,
  nextRankName: RANKS[1]?.name ?? null,
  nextRankAt: RANKS[1]?.min ?? 0,
  boons: [],
  trophies: trophyViews([]),
  newTrophies: [],
  renownGain: 0,
  setPhase: (phase) => set({ phase }),
  patch: (partial) => set(partial),
}));

export function rankSummary(renown: number) {
  const rank = rankFor(renown);
  const i = RANKS.findIndex((r) => r.name === rank.name);
  const next = RANKS[i + 1] ?? null;
  return { rank, next };
}
