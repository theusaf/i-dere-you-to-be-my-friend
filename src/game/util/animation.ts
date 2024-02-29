export const enum GameAnimationEvents {
  /**
   * Dispatched when an animation starts
   */
  onStart = "start",
  /**
   * Dispacthed when an animation updates
   *
   * @param progress - The current progress of the animation as a percentage (0-1)
   * @param values - The current values of the animation
   */
  onUpdate = "update",
  /**
   * Dispatched when an animation ends
   */
  onEnd = "end",
}

type AnimationValues = Record<string, number>;

/**
 * A class for creating animations.
 */
export class GameAnimation<T extends AnimationValues> extends EventTarget {
  /**
   * The current progress of the animation as a percentage (0-1)
   */
  progress: number = 0;
  currentTime: number = 0;

  startValues: AnimationValues;
  endValues: AnimationValues;
  currentValues: AnimationValues;
  duration: number;
  easing: (t: number) => number = (n) => n;

  /**
   * @param startValues The initial values for the animation
   * @param endValues The ending values for the animation
   * @param duration How long in milliseconds the animation should last
   * @param easing A custom easing function for the animation. The input represents the progress as a percent (0-1)
   */
  constructor(
    startValues: T,
    endValues: Record<keyof typeof startValues, number>,
    duration: number,
    easing?: (t: number) => number
  ) {
    super();
    this.startValues = startValues;
    this.currentValues = startValues;
    this.endValues = endValues;
    this.duration = duration;
    if (easing) this.easing = easing;
  }

  get isDone(): boolean {
    return this.progress === 1;
  }

  /**
   * Updates the animation.
   *
   * @param delta - The time since the last frame in milliseconds
   */
  update(delta: number): AnimationValues {
    this.currentTime += delta;
    this.progress = Math.min(this.currentTime / this.duration, 1);
    const easedProgress = this.easing(this.progress);
    this.currentValues = {};
    for (const key in this.startValues) {
      const startValue = this.startValues[key],
        endValue = this.endValues[key];
      this.currentValues[key] =
        startValue + (endValue - startValue) * easedProgress;
    }
    this.dispatchEvent(
      new CustomEvent(GameAnimationEvents.onUpdate, {
        detail: {
          progress: this.progress,
          values: this.currentValues,
        },
      })
    );
    if (this.progress === 1) {
      this.dispatchEvent(new CustomEvent(GameAnimationEvents.onEnd));
    }
    return this.currentValues;
  }

  /**
   * Resets/starts the animation.
   */
  reset(): void {
    this.currentTime = Date.now();
    this.dispatchEvent(new CustomEvent(GameAnimationEvents.onStart));
  }
}
