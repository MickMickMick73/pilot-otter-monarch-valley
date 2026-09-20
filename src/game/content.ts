export type NpcId = "bramble" | "vellum" | "grik" | "calden" | "mothwick";
export type BoonId = "cartograph" | "hourglass" | "magnet" | "stride" | "beacon";
export type QuestItemId = "compass" | "page" | "pouch" | "token" | "oil";
export type PuzzleKind = "sigils" | "levers";
export type Glyph = "sun" | "moon" | "wyrm";

export interface NpcDef {
  id: NpcId;
  name: string;
  title: string;
  portrait: string;
  color: number;
  item: QuestItemId;
  itemName: string;
  boon: BoonId;
  greet: string;
  wait: string;
  thanks: string;
  done: string;
}

export interface BoonDef {
  id: BoonId;
  name: string;
  tag: string;
  blurb: string;
}

export interface RankDef {
  name: string;
  min: number;
  blurb: string;
}

export interface TrophyDef {
  id: string;
  name: string;
  blurb: string;
}

export const NPC_ORDER: NpcId[] = ["bramble", "vellum", "grik", "calden", "mothwick"];

export const NPCS: Record<NpcId, NpcDef> = {
  bramble: {
    id: "bramble",
    name: "Bramble Oakvein",
    title: "Dwarf scout",
    portrait: "/portraits/bramble.jpg",
    color: 0x4a7a48,
    item: "compass",
    itemName: "oak-brass compass",
    boon: "cartograph",
    greet:
      "Hold, torchbearer. These halls ate my compass — without it I'm walking in circles. Find it and I'll teach your parchment to remember more of the keep.",
    wait: "Still no north on this floor. The compass is brass with an oak inlay. Dead ends, most like.",
    thanks: "Ha! North is north again. Take this trick of the map — your minimap will drink more of the dark.",
    done: "I can smell the next stair from here. Don't dawdle; the keep likes dawdlers.",
  },
  vellum: {
    id: "vellum",
    name: "Sister Vellum",
    title: "Keep's ledger",
    portrait: "/portraits/vellum.jpg",
    color: 0xa8c4d8,
    item: "page",
    itemName: "ledger page",
    boon: "hourglass",
    greet:
      "A page tore free of me when I died in these stacks. Bring it home and I will weigh your deeds more kindly. Renown clings to those the ledger names.",
    wait: "Paper whispers when you pass it. Listen for a rustle in the side halls.",
    thanks: "The page settles. I have written you larger than you were. Renown from this keep will run richer.",
    done: "The stairs below are catalogued. You are not. Yet.",
  },
  grik: {
    id: "grik",
    name: "Grik",
    title: "Honest fence",
    portrait: "/portraits/grik.jpg",
    color: 0x6a8a3a,
    item: "pouch",
    itemName: "gem pouch",
    boon: "magnet",
    greet:
      "Listen. I dropped a pouch of — educational gems. Not stolen. Find it and I'll show you how to snatch relics from further off. Professional courtesy.",
    wait: "Small bag, jingling, very educational. Check corners. Don't open it. Or do. I'm not your mum.",
    thanks: "That's the one. Here — a pickpocket's reach. Relics will hop to your palm like they owe you money.",
    done: "If anyone asks, we never met. If they offer gold, we did.",
  },
  calden: {
    id: "calden",
    name: "Sir Calden",
    title: "Oath-sworn",
    portrait: "/portraits/calden.jpg",
    color: 0x8a8e98,
    item: "token",
    itemName: "oath-token",
    boon: "stride",
    greet:
      "My oath-token slipped its cord in a skirmish I no longer remember. Recover it, and I will bless your stride. The keep is long. Be longer.",
    wait: "Iron disc, a wyrm stamped on one face. It will be heavier than it looks.",
    thanks: "The oath remembers me. Go swift, torchbearer — Ember Stride is yours for the rest of this descent.",
    done: "I hold this landing. You take the next. That is the old way.",
  },
  mothwick: {
    id: "mothwick",
    name: "Mothwick",
    title: "Lantern-keeper",
    portrait: "/portraits/mothwick.jpg",
    color: 0xd4a24a,
    item: "oil",
    itemName: "lamp oil",
    boon: "beacon",
    greet:
      "My lantern drinks the last of its oil and the moths are getting ideas. Fetch a flask and I will teach your torch to throw farther than fear.",
    wait: "Glass flask, corked with twine. Warm to the touch, even in the dark.",
    thanks: "Ah. Light with a spine in it. Your torch will hold a wider circle now. Try not to waste it on the pretty mosaics.",
    done: "The dark below has a taste. Keep the wick trimmed.",
  },
};

export const BOONS: Record<BoonId, BoonDef> = {
  cartograph: {
    id: "cartograph",
    name: "Cartograph",
    tag: "Map",
    blurb: "Minimap drinks more of the keep.",
  },
  hourglass: {
    id: "hourglass",
    name: "Named in the ledger",
    tag: "Renown",
    blurb: "Floor clears grant extra renown.",
  },
  magnet: {
    id: "magnet",
    name: "Keen pocket",
    tag: "Reach",
    blurb: "Relics and sigils gather from farther.",
  },
  stride: {
    id: "stride",
    name: "Ember stride",
    tag: "Swift",
    blurb: "Walk and sprint run hotter.",
  },
  beacon: {
    id: "beacon",
    name: "Far beacon",
    tag: "Light",
    blurb: "The handheld torch throws farther.",
  },
};

export const RANKS: RankDef[] = [
  { name: "Squire", min: 0, blurb: "A first torch in a long dark." },
  { name: "Adventurer", min: 40, blurb: "The keep has learned your step. Slightly swifter." },
  { name: "Pathfinder", min: 90, blurb: "Corridors yield more of themselves to your map." },
  { name: "Champion", min: 170, blurb: "Relics lean toward a proven hand." },
  { name: "Archmage", min: 280, blurb: "Flame obeys you a little farther." },
  { name: "Wyrmkeeper", min: 420, blurb: "The stairs know your name." },
];

export const TROPHIES: TrophyDef[] = [
  { id: "first-light", name: "First Light", blurb: "Clear a floor of the keep." },
  { id: "kindred", name: "Kindred", blurb: "Finish a side quest for a soul in the dark." },
  { id: "rune-wise", name: "Rune-wise", blurb: "Solve three floor puzzles." },
  { id: "deep-delver", name: "Deep Delver", blurb: "Reach the fourth floor in one descent." },
  { id: "patron", name: "Patron of the Lost", blurb: "Complete five side quests." },
  { id: "keeps-heart", name: "Keep's Heart", blurb: "Stand on the seventh stair." },
  { id: "reliquary", name: "Reliquary", blurb: "Recover fifty relics across all delves." },
  { id: "swift-shadow", name: "Swift Shadow", blurb: "Clear a floor in under forty-five seconds." },
];

export const GLYPHS: Glyph[] = ["sun", "moon", "wyrm"];

export function npcForFloor(floor: number): NpcDef {
  const id = NPC_ORDER[(Math.max(1, floor) - 1) % NPC_ORDER.length]!;
  return NPCS[id];
}

export function puzzleKindForFloor(floor: number): PuzzleKind {
  return floor % 2 === 1 ? "sigils" : "levers";
}

export function sigilCount(floor: number): number {
  return floor <= 1 ? 2 : 3;
}

export function leverCount(floor: number): number {
  return floor >= 6 ? 3 : 2;
}

export function rankFor(renown: number): RankDef {
  let best = RANKS[0]!;
  for (const r of RANKS) if (renown >= r.min) best = r;
  return best;
}

export function rankIndex(renown: number): number {
  return RANKS.findIndex((r) => r.name === rankFor(renown).name);
}

export function nextRank(renown: number): RankDef | null {
  const i = rankIndex(renown);
  return RANKS[i + 1] ?? null;
}

export function glyphLabel(g: Glyph): string {
  if (g === "sun") return "Sun";
  if (g === "moon") return "Moon";
  return "Wyrm";
}
