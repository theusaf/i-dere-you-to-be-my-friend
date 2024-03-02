import { Application, Container } from "pixi.js";

class RenderLayer extends Container {
  worldWidth: number;
  worldHeight: number;

  constructor(pixiApp: Application, worldWidth: number, worldHeight?: number) {
    super();
    this.sortableChildren = true;
    this.worldWidth = worldWidth;
    if (worldHeight) {
      this.worldHeight = worldHeight;
      this.scale.set(
        pixiApp.view.width / worldWidth,
        pixiApp.view.height / worldHeight,
      );
    } else {
      this.worldHeight =
        pixiApp.view.height / (pixiApp.view.width / worldWidth);
      this.scale.set(pixiApp.view.width / worldWidth);
    }
  }
}

export default RenderLayer;
