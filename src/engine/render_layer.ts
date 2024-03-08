import { Application, Container } from "pixi.js";

class RenderLayer extends Container {
  worldWidth!: number;
  worldHeight!: number;
  app: Application;

  constructor(pixiApp: Application, worldWidth: number, worldHeight?: number) {
    super();
    this.app = pixiApp;
    this.sortableChildren = true;
    this.setWorldSize(worldWidth, worldHeight);
  }

  setWorldSize(width: number, height?: number): void {
    this.worldWidth = width;
    if (height) {
      this.worldHeight = height;
      this.scale.set(
        this.app.view.width / width,
        this.app.view.height / height,
      );
    } else {
      this.worldHeight = this.app.view.height / (this.app.view.width / width);
      this.scale.set(this.app.view.width / width);
    }
  }
}

export default RenderLayer;
