import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Award, ChevronsDown, Clock, DoorOpen, Gem, Layers, Map, Volume2, VolumeX } from "lucide-react";
import { createEngine, type Engine } from "@/game/engine";
import { useGameHud, type DialogueView, type ObjectiveView, type TrophyView } from "@/game/store";
import type { GamePhase } from "@/game/types";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenth = Math.floor((s * 10) % 10);
  return `${m}:${secs.toString().padStart(2, "0")}.${tenth}`;
}

export function DungeonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const hud = useGameHud();

  useEffect(() => {
    const canvas = canvasRef.current;
    const mini = miniRef.current;
    if (!canvas || !mini) return;
    const engine = createEngine({ canvas, minimap: mini });
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
  const descend = () => engineRef.current?.descend();
  const leave = () => engineRef.current?.leave();
  const interact = () => engineRef.current?.interact();
  const choose = (id: string) => engineRef.current?.choose(id);
  const toggleMute = () => engineRef.current?.setMuted(!hud.muted);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink text-parchment touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onClick={() => {
          if (hud.phase === "playing" && !hud.dialogue) engineRef.current?.requestLock();
        }}
      />

      <HudChrome
        phase={hud.phase}
        elapsed={hud.elapsed}
        collected={hud.collected}
        total={hud.total}
        muted={hud.muted}
        locked={hud.locked}
        floor={hud.floor}
        doorOpen={hud.doorOpen}
        notice={hud.notice}
        prompt={hud.prompt}
        objectives={hud.objectives}
        rankName={hud.rankName}
        boons={hud.boons}
        miniRef={miniRef}
        onMute={toggleMute}
        onPause={pause}
      />

      {hud.phase === "title" && (
        <TitleOverlay
          onStart={start}
          bestTime={hud.bestTime}
          deepest={hud.deepest}
          lifetimeRelics={hud.lifetimeRelics}
          rankName={hud.rankName}
          rankBlurb={hud.rankBlurb}
          renown={hud.renown}
          nextRankName={hud.nextRankName}
          nextRankAt={hud.nextRankAt}
          trophies={hud.trophies}
        />
      )}
      {hud.phase === "paused" && <PauseOverlay onResume={resume} onRestart={restart} />}
      {hud.phase === "won" && (
        <WinOverlay
          elapsed={hud.elapsed}
          collected={hud.collected}
          total={hud.total}
          bestTime={hud.bestTime}
          seed={hud.seed}
          floor={hud.floor}
          floorName={hud.floorName}
          newDeepest={hud.newDeepest}
          newBest={hud.newBest}
          nextName={hud.nextName}
          nextFloor={hud.nextFloor}
          nextRelics={hud.nextRelics}
          rankName={hud.rankName}
          renownGain={hud.renownGain}
          newTrophies={hud.newTrophies}
          trophies={hud.trophies}
          boons={hud.boons}
          onDescend={descend}
          onLeave={leave}
        />
      )}
      {hud.dialogue && hud.phase === "talking" && (
        <DialogueOverlay dialogue={hud.dialogue} onChoose={choose} />
      )}
      {hud.phase === "playing" && !hud.locked && !hud.coarse && !hud.notice && !hud.prompt && <LookHint />}

      {hud.coarse && (hud.phase === "playing" || hud.phase === "talking") && (
        <TouchControls
          onStick={(x, y) => engineRef.current?.setMoveStick(x, y)}
          onLook={(dx, dy) => engineRef.current?.addLook(dx, dy)}
          onInteract={interact}
          showInteract={!!hud.prompt || hud.phase === "talking"}
          freeze={hud.phase === "talking"}
        />
      )}
    </div>
  );
}

function HudChrome(props: {
  phase: GamePhase;
  elapsed: number;
  collected: number;
  total: number;
  muted: boolean;
  locked: boolean;
  floor: number;
  doorOpen: boolean;
  notice: string;
  prompt: string;
  objectives: ObjectiveView[];
  rankName: string;
  boons: { id: string; name: string; tag: string }[];
  miniRef: RefObject<HTMLCanvasElement | null>;
  onMute: () => void;
  onPause: () => void;
}) {
  const live = props.phase === "playing" || props.phase === "paused" || props.phase === "won" || props.phase === "talking";
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          {live && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Chip>
                  <Layers className="size-3.5" strokeWidth={1.75} />
                  <span className="tabular">Floor {props.floor}</span>
                </Chip>
                <Chip>
                  <Award className="size-3.5" strokeWidth={1.75} />
                  <span>{props.rankName}</span>
                </Chip>
                <Chip>
                  <Clock className="size-3.5" strokeWidth={1.75} />
                  <span className="tabular">{formatTime(props.elapsed)}</span>
                </Chip>
                <Chip>
                  <Gem className="size-3.5" strokeWidth={1.75} />
                  <span className="tabular">
                    {props.collected}/{props.total}
                  </span>
                </Chip>
                {props.doorOpen && (
                  <Chip>
                    <DoorOpen className="size-3.5 text-ember" strokeWidth={1.75} />
                    <span className="text-ember">Exit open</span>
                  </Chip>
                )}
              </div>
              {props.objectives.length > 0 && props.phase !== "title" && (
                <ul className="max-w-xs rounded-xl border border-border bg-oak/80 px-3 py-2 font-serif text-xs text-parchment-dim">
                  {props.objectives.map((o) => (
                    <li key={o.label} className={o.done ? "text-gold line-through decoration-gold/50" : ""}>
                      {o.done ? "✓ " : "• "}
                      {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {props.boons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {props.boons.map((b) => (
                    <span
                      key={b.id}
                      className="rounded-md border border-gold/40 bg-gold/15 px-2 py-0.5 font-display text-[10px] tracking-wide text-gold uppercase"
                    >
                      {b.tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <IconBtn label={props.muted ? "Unmute" : "Mute"} onClick={props.onMute}>
            {props.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          {props.phase === "playing" && (
            <IconBtn label="Pause" onClick={props.onPause}>
              <span className="font-display text-xs tracking-wide">Esc</span>
            </IconBtn>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-parchment/80 shadow-[0_0_8px_rgba(232,220,196,0.5)]" />

      <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4">
        <div className="relative">
          <canvas
            ref={props.miniRef}
            className="block size-28 rounded-xl sm:size-36"
            width={148}
            height={148}
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 text-parchment-dim">
            <Map className="size-3" strokeWidth={1.75} />
            <span className="font-display text-[10px] tracking-[0.14em] uppercase">Keep</span>
          </div>
        </div>
      </div>

      {props.notice && props.phase === "playing" && (
        <div className="absolute top-16 left-3 max-w-sm sm:top-20 sm:left-4">
          <p className="rounded-lg border border-border bg-oak/90 px-3 py-2 font-serif text-sm text-parchment shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            {props.notice}
          </p>
        </div>
      )}
      {props.prompt && props.phase === "playing" && (
        <div className="absolute inset-x-0 bottom-24 flex justify-center px-4 sm:bottom-10">
          <p className="rounded-lg border border-gold/50 bg-oak/90 px-3 py-2 font-display text-xs tracking-wide text-gold uppercase shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            {props.prompt}
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-oak/80 px-2.5 py-1.5 font-display text-xs tracking-wide text-parchment">
      {children}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-lg border border-border bg-oak/85 text-parchment transition-colors duration-150 hover:border-border-strong hover:bg-panel"
    >
      {children}
    </button>
  );
}

function TitleOverlay({
  onStart,
  bestTime,
  deepest,
  lifetimeRelics,
  rankName,
  rankBlurb,
  renown,
  nextRankName,
  nextRankAt,
  trophies,
}: {
  onStart: () => void;
  bestTime: number | null;
  deepest: number;
  lifetimeRelics: number;
  rankName: string;
  rankBlurb: string;
  renown: number;
  nextRankName: string | null;
  nextRankAt: number;
  trophies: TrophyView[];
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-ink/80 via-ink/25 to-transparent p-4 pb-8 sm:items-center sm:pb-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-oak/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="font-display text-[11px] tracking-[0.28em] text-ember uppercase">Forgotten dungeon</p>
        <h1 className="mt-2 font-display text-3xl leading-none font-semibold tracking-tight text-parchment sm:text-5xl">
          Wyrmwood Keep
        </h1>
        <p className="mt-3 max-w-sm font-serif text-sm leading-relaxed text-parchment-dim sm:text-base">
          Relics and sigils unseal each arch. Souls in the dark offer boons. Rank climbs with every descent.
        </p>
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2">
          <p className="font-display text-[11px] tracking-[0.18em] text-gold uppercase">
            {rankName} · {renown} renown
          </p>
          <p className="mt-1 font-serif text-xs text-parchment-dim">{rankBlurb}</p>
          {nextRankName && (
            <p className="mt-1 font-serif text-[11px] text-parchment-dim">
              {nextRankName} at {nextRankAt}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 w-full rounded-xl bg-parchment px-5 py-3.5 font-display text-sm font-semibold tracking-wide text-ink transition-transform duration-150 hover:bg-parchment-dim active:scale-[0.98]"
        >
          Enter the Keep
        </button>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 font-serif text-xs text-parchment-dim">
          <li>WASD to walk</li>
          <li>Mouse to look</li>
          <li>E to talk / pull</li>
          <li>Shift to sprint</li>
        </ul>
        <TrophyShelf trophies={trophies} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-display text-[11px] tracking-wide text-gold uppercase">
          {deepest > 0 && <p>Deepest floor {deepest}</p>}
          {lifetimeRelics > 0 && <p>{lifetimeRelics} relics recovered</p>}
          {bestTime !== null && bestTime > 0 && <p>Best floor {formatTime(bestTime)}</p>}
        </div>
      </div>
    </div>
  );
}

function TrophyShelf({ trophies }: { trophies: TrophyView[] }) {
  return (
    <div className="mt-4">
      <p className="font-display text-[10px] tracking-[0.18em] text-parchment-dim uppercase">Trophies</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {trophies.map((t) => (
          <div
            key={t.id}
            title={`${t.name}: ${t.blurb}`}
            className={`rounded-lg border px-1.5 py-2 text-center ${
              t.earned ? "border-gold/50 bg-gold/15 text-gold" : "border-border bg-panel text-parchment-dim/50"
            }`}
          >
            <Award className="mx-auto size-3.5" strokeWidth={1.75} />
            <p className="mt-1 font-display text-[8px] leading-tight tracking-wide uppercase">{t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PauseOverlay({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink/55 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-oak p-6 sm:p-7">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Paused</h2>
        <p className="mt-2 font-serif text-sm text-parchment-dim">The keep waits. Torchlight holds.</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="rounded-xl bg-parchment px-5 py-3 font-display text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl border border-border bg-panel px-5 py-3 font-display text-sm text-parchment transition-colors duration-150 hover:border-border-strong"
          >
            New keep
          </button>
        </div>
      </div>
    </div>
  );
}

function WinOverlay(props: {
  elapsed: number;
  collected: number;
  total: number;
  bestTime: number | null;
  seed: number;
  floor: number;
  floorName: string;
  newDeepest: boolean;
  newBest: boolean;
  nextName: string;
  nextFloor: number;
  nextRelics: number;
  rankName: string;
  renownGain: number;
  newTrophies: string[];
  trophies: TrophyView[];
  boons: { id: string; name: string; tag: string }[];
  onDescend: () => void;
  onLeave: () => void;
}) {
  const blurb =
    props.floor === 1
      ? "A stairwell yawns beneath the arch. The keep was never one floor."
      : "The stairs keep going. Torchlight does not reach the bottom.";
  const unlocked = props.trophies.filter((t) => props.newTrophies.includes(t.id));
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink/60 p-4">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-border bg-oak p-6 sm:p-8">
        <p className="font-display text-[11px] tracking-[0.28em] text-ember uppercase">Floor {props.floor} cleared</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{props.floorName}</h2>
        <p className="mt-2 font-serif text-sm text-parchment-dim">{blurb}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Time" value={formatTime(props.elapsed)} />
          <Stat label="Relics" value={`${props.collected}/${props.total}`} icon={<Gem className="size-3.5" />} />
          <Stat label="Renown" value={`+${props.renownGain}`} icon={<Award className="size-3.5" />} />
          <Stat label="Rank" value={props.rankName} />
        </dl>
        {props.boons.length > 0 && (
          <p className="mt-3 font-serif text-xs text-gold">
            Boons carried: {props.boons.map((b) => b.name).join(", ")}
          </p>
        )}
        {unlocked.length > 0 && (
          <p className="mt-2 font-display text-[11px] tracking-wide text-gold uppercase">
            Trophy: {unlocked.map((t) => t.name).join(", ")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-display text-[11px] tracking-wide text-gold uppercase">
          {props.newDeepest && <p>New depth</p>}
          {props.newBest && <p>Best floor time</p>}
        </div>
        <button
          type="button"
          onClick={props.onDescend}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-parchment px-5 py-3.5 font-display text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]"
        >
          <ChevronsDown className="size-4" strokeWidth={2} />
          Descend to {props.nextName}
        </button>
        <p className="mt-2 text-center font-serif text-[11px] text-parchment-dim">
          {props.nextRelics} relics wait on floor {props.nextFloor} · Enter
        </p>
        <button
          type="button"
          onClick={props.onLeave}
          className="mt-3 w-full rounded-xl border border-border bg-panel px-5 py-2.5 font-display text-sm text-parchment transition-colors duration-150 hover:border-border-strong"
        >
          Leave the keep
        </button>
        <p className="mt-3 flex items-center gap-1.5 font-serif text-[11px] text-parchment-dim">
          <DoorOpen className="size-3" />
          Seed {props.seed}
        </p>
      </div>
    </div>
  );
}

function DialogueOverlay({ dialogue, onChoose }: { dialogue: DialogueView; onChoose: (id: string) => void }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-end bg-ink/40 p-4 pb-8 sm:place-items-center sm:pb-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-oak p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="flex gap-4">
          <img
            src={dialogue.portrait}
            alt=""
            width={96}
            height={96}
            className="size-20 shrink-0 rounded-2xl border border-border object-cover sm:size-24"
          />
          <div className="min-w-0">
            <p className="font-display text-[11px] tracking-[0.2em] text-ember uppercase">{dialogue.title}</p>
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{dialogue.name}</h2>
            <p className="mt-2 font-serif text-sm leading-relaxed text-parchment-dim">{dialogue.text}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {dialogue.options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChoose(opt.id)}
              className={
                i === 0
                  ? "rounded-xl bg-parchment px-4 py-3 text-left font-display text-sm font-semibold text-ink"
                  : "rounded-xl border border-border bg-panel px-4 py-3 text-left font-display text-sm text-parchment"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-3 font-serif text-[11px] text-parchment-dim">E or Enter to choose</p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-3">
      <dt className="flex items-center gap-1 font-display text-[10px] tracking-[0.16em] text-parchment-dim uppercase">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-display text-xl tabular text-parchment">{value}</dd>
    </div>
  );
}

function LookHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4 sm:bottom-8">
      <p className="rounded-lg border border-border bg-oak/80 px-3 py-2 font-serif text-xs text-parchment-dim">
        Click the dungeon to look around
      </p>
    </div>
  );
}

function TouchControls({
  onStick,
  onLook,
  onInteract,
  showInteract,
  freeze,
}: {
  onStick: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onInteract: () => void;
  showInteract: boolean;
  freeze: boolean;
}) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const lookId = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });
  const stickRef = useRef(onStick);
  stickRef.current = onStick;

  useEffect(() => () => stickRef.current(0, 0), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {!freeze && (
        <div
          className="pointer-events-auto absolute bottom-6 left-5 size-28"
        onPointerDown={(e) => {
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!origin.current || origin.current.id !== e.pointerId) return;
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const max = 42;
          const mag = Math.hypot(dx, dy);
          const s = mag > max ? max / mag : 1;
          const nx = (dx * s) / max;
          const ny = -(dy * s) / max;
          setKnob({ x: dx * s, y: dy * s });
          onStick(nx, ny);
        }}
        onPointerUp={(e) => {
          origin.current = null;
          setKnob({ x: 0, y: 0 });
          onStick(0, 0);
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <div className="absolute inset-0 rounded-full border border-border bg-oak/50" />
        <div
          className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-panel"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      )}
      {!freeze && (
      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-1/2"
        onPointerDown={(e) => {
          lookId.current = e.pointerId;
          lastLook.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (lookId.current !== e.pointerId) return;
          onLook(e.clientX - lastLook.current.x, e.clientY - lastLook.current.y);
          lastLook.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          lookId.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      />
      )}
      {showInteract && (
        <button
          type="button"
          aria-label="Interact"
          className="pointer-events-auto absolute right-6 bottom-8 grid size-16 place-items-center rounded-full border border-gold/50 bg-oak/90 font-display text-sm tracking-wide text-gold"
          onPointerDown={(e) => {
            e.preventDefault();
            onInteract();
          }}
        >
          E
        </button>
      )}
    </div>
  );
}

export function Splash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="font-display text-[11px] tracking-[0.28em] text-ember uppercase">Forgotten dungeon</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-parchment">Wyrmwood Keep</h1>
      <p className="mt-3 max-w-sm font-serif text-sm text-parchment-dim">Lighting the first torch…</p>
    </div>
  );
}
