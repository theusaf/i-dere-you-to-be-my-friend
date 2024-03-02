import { IDestroyOptions, Sprite, Texture, Ticker } from "pixi.js";

export interface AnimatedSpriteOptions {
  frames: Texture[];
  frameDuration: number;
  loop: boolean;
  onTextureChange?: (texture: Texture) => void;
}

export class AnimatedSprite extends Sprite {
  frames: any;
  currentFrameIndex: number;
  loop: boolean;
  frameDuration: number;
  isDestroyed: boolean;
  currentFrameDuration: number;
  loopFunc: () => Promise<void>;
  onTextureChange?: (texture: Texture) => void;

  constructor({
    frames,
    frameDuration,
    loop = true,
    onTextureChange,
  }: AnimatedSpriteOptions) {
    super(frames[0]);
    this.frames = frames;
    this.loop = loop;
    this.frameDuration = frameDuration;
    this.currentFrameDuration = 0;
    this.currentFrameIndex = 0;
    this.isDestroyed = false;
    this.loopFunc = this.executeFrameLoop.bind(this);
    this.onTextureChange = onTextureChange;
    Ticker.shared.add(this.loopFunc);
  }

  async executeFrameLoop() {
    const delta = Ticker.shared.deltaMS;
    if (this.isDestroyed) return;
    this.currentFrameDuration += delta;
    if (this.currentFrameDuration >= this.frameDuration) {
      this.currentFrameDuration = 0;
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.frames.length) {
        if (this.loop) this.currentFrameIndex = 0;
        else return this.removeFrameLoop();
      }
      this.texture = this.frames[this.currentFrameIndex];
      if (this.onTextureChange) this.onTextureChange(this.texture);
    }
  }

  removeFrameLoop() {
    Ticker.shared.remove(this.loopFunc);
  }

  destroy(options?: boolean | IDestroyOptions): void {
    super.destroy(options);
    this.isDestroyed = true;
    this.removeFrameLoop();
  }
}
