const GAME_CODES = new Set([
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
  "KeyR",
]);

export class Input {
  readonly keys = new Set<string>();
  private qaHeld = new Set<string>();
  lookX = 0;
  lookY = 0;
  stickX = 0;
  stickY = 0;
  pointerLocked = false;
  /** Accumulated mouse look this frame (consumed in poll). */
  private mx = 0;
  private my = 0;
  private canvas: HTMLCanvasElement | null = null;
  private dragging = false;
  private lastDragX = 0;
  private lastDragY = 0;
  private unbind: Array<() => void> = [];

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (GAME_CODES.has(e.code)) e.preventDefault();
        return;
      }
      this.keys.add(e.code);
      if (GAME_CODES.has(e.code)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => this.keys.clear();
    const onMouseMove = (e: MouseEvent) => {
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
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (this.pointerLocked) return;
      if (e.target !== canvas) return;
      this.dragging = true;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      this.dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const onLockChange = () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      if (!this.pointerLocked) this.dragging = false;
    };
    const onContext = (e: Event) => e.preventDefault();

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
      () => canvas.removeEventListener("contextmenu", onContext),
    ];
  }

  async requestLock() {
    const canvas = this.canvas;
    if (!canvas) return;
    try {
      const ret = canvas.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions);
      if (ret && typeof (ret as Promise<void>).then === "function") await ret;
    } catch {
      try {
        canvas.requestPointerLock();
      } catch {
        /* drag-to-look fallback */
      }
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  setKeys(codes: string[]) {
    this.qaHeld = new Set(codes);
  }

  down(code: string): boolean {
    return this.keys.has(code) || this.qaHeld.has(code);
  }

  poll(): { moveX: number; moveZ: number; lookX: number; lookY: number; sprint: boolean } {
    let moveX = this.stickX;
    let moveZ = this.stickY;
    if (this.down("KeyD") || this.down("ArrowRight")) moveX += 1;
    if (this.down("KeyA") || this.down("ArrowLeft")) moveX -= 1;
    if (this.down("KeyW") || this.down("ArrowUp")) moveZ += 1;
    if (this.down("KeyS") || this.down("ArrowDown")) moveZ -= 1;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
    if (pads) {
      for (const pad of pads) {
        if (!pad || pad.mapping !== "standard") continue;
        const lx = pad.axes[0] ?? 0;
        const ly = pad.axes[1] ?? 0;
        const mag = Math.hypot(lx, ly);
        const dz = 0.18;
        if (mag > dz) {
          const scale = ((mag - dz) / (1 - dz)) / mag;
          moveX += lx * scale;
          moveZ += -ly * scale;
        }
        const rx = pad.axes[2] ?? 0;
        const ry = pad.axes[3] ?? 0;
        const rmag = Math.hypot(rx, ry);
        if (rmag > 0.18) {
          this.mx += rx * 18;
          this.my += ry * 14;
        }
        if (pad.buttons[12]?.pressed) moveZ += 1;
        if (pad.buttons[13]?.pressed) moveZ -= 1;
        if (pad.buttons[14]?.pressed) moveX -= 1;
        if (pad.buttons[15]?.pressed) moveX += 1;
      }
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
    return { moveX, moveZ, lookX, lookY, sprint };
  }

  addLook(dx: number, dy: number) {
    this.mx += dx;
    this.my += dy;
  }

  dispose() {
    for (const fn of this.unbind) fn();
    this.unbind = [];
    this.keys.clear();
    this.qaHeld.clear();
  }
}
