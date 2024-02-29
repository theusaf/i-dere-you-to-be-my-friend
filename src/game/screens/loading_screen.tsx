import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import RenderLayer from "../../engine/render_layer";

export class LoadingScreen extends GameScreen {
  container: RenderLayer | null = null;

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager);
    this.container = new RenderLayer(app, 1920, 1080);
    app.stage.addChild(this.container);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x344ceb);
    graphics.drawRect(0, 0, 1920, 1080);
    graphics.endFill();
    this.container.addChild(graphics);
  }

  dispose(): void {
    this.app?.stage.removeChild(this.container!);
  }

  update(_: number): void {
    // TODO: render stuff?
  }

  getUI(): UIOutput | null {
    return {
      main: (
        <div className="pointer-events-auto h-full flex flex-col items-center">
          <div className="m-auto flex-1 flex flex-row items-center">
            <span className="text-white text-center text-6xl">Loading...</span>
          </div>
        </div>
      ),
    };
  }
}
