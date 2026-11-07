/**
 * Virtual-clock scheduler. Time only moves when `advance` is called, so the
 * caller controls pause and playback speed by scaling the `dt` it passes in.
 *
 * Tracks run in order of start time. Instant tracks fire once; tweens receive
 * progress in [0, 1] on every advance and always get a final call with 1.
 */
interface TimelineTrack {
  start: number;
  end: number;
  run: (progress: number) => void;
}

export class Timeline {
  private queue: TimelineTrack[] = [];
  private queueIndex = 0;
  private active: TimelineTrack[] = [];
  private elapsed = 0;
  private dirty = false;

  /** Tracks scheduled after `duration` never fire. */
  duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  get time(): number {
    return this.elapsed;
  }

  at(time: number, run: () => void): this {
    this.queue.push({ start: time, end: time, run: () => run() });
    this.dirty = true;
    return this;
  }

  tween(start: number, end: number, run: (progress: number) => void): this {
    this.queue.push({ start, end, run });
    this.dirty = true;
    return this;
  }

  /** Moves the clock forward by `dt` ms. Returns true once `duration` is reached. */
  advance(dt: number): boolean {
    if (this.dirty) {
      // Array.prototype.sort is stable, so tracks with equal start keep insertion order.
      this.queue.sort((a, b) => a.start - b.start);
      this.dirty = false;
    }

    this.elapsed = Math.min(this.elapsed + dt, this.duration);

    while (this.queueIndex < this.queue.length && this.queue[this.queueIndex].start <= this.elapsed) {
      this.active.push(this.queue[this.queueIndex]);
      this.queueIndex += 1;
    }

    const stillActive: TimelineTrack[] = [];
    for (const track of this.active) {
      const span = track.end - track.start;
      const progress = span <= 0 ? 1 : Math.min(1, (this.elapsed - track.start) / span);
      track.run(progress);
      if (progress < 1) stillActive.push(track);
    }
    this.active = stillActive;

    return this.elapsed >= this.duration;
  }
}
