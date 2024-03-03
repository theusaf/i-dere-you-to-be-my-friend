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
export class GameAnimation<
  T extends AnimationValues = AnimationValues,
> extends EventTarget {
  /**
   * The current progress of the animation as a percentage (0-1)
   */
  progress: number = 0;
  currentTime: number = 0;

  startValues: T;
  endValues: T;
  currentValues: T;
  duration: number;
  easing: (t: number) => number = easeMethod.linear;

  /**
   * @param startValues The initial values for the animation
   * @param endValues The ending values for the animation
   * @param duration How long in milliseconds the animation should last
   * @param easing A custom easing function for the animation. The input represents the progress as a percent (0-1)
   */
  constructor(
    startValues: T,
    endValues: T,
    duration: number,
    easing?: (t: number) => number,
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
  update(delta: number): T {
    this.currentTime += delta;
    this.progress = Math.min(this.currentTime / this.duration, 1);
    const easedProgress = this.easing(this.progress);
    this.currentValues = {} as T;
    for (const key in this.startValues) {
      const startValue = this.startValues[key],
        endValue = this.endValues[key];
      this.currentValues[key] = (startValue +
        (endValue - startValue) * easedProgress) as T[Extract<keyof T, string>];
    }
    this.dispatchEvent(
      new CustomEvent(GameAnimationEvents.onUpdate, {
        detail: {
          progress: this.progress,
          values: this.currentValues,
        },
      }),
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
    this.currentTime = 0;
    this.dispatchEvent(new CustomEvent(GameAnimationEvents.onStart));
  }
}

// credits to https://easings.net/
export const easeMethod = {
  linear(x: number): number {
    return x;
  },
  easeInQuart(x: number): number {
    return x * x * x * x;
  },
  easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
  easeInBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  },
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
