import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { ColorScheme } from "../util/style";

export class LoadingScreen extends GameScreen {
  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(ColorScheme.background);
    graphics.drawRect(
      0,
      0,
      this.container!.worldWidth,
      this.container!.worldHeight
    );
    graphics.endFill();
    this.container!.addChild(graphics);
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
