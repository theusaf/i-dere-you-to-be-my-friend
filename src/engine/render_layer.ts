import { Application, Container } from "pixi.js";

class RenderLayer extends Container {

  constructor(pixiApp: Application, worldWidth: number, worldHeight?: number) {
    super();
    if (worldHeight) {
      this.scale.set(pixiApp.view.width / worldWidth, pixiApp.view.height / worldHeight);
    } else {
      this.scale.set(pixiApp.view.width / worldWidth);
    }
  }

}

export default RenderLayer;
