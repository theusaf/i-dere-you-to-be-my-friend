import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";

export class MapScreen extends GameScreen {
  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager);
  }
  update(_: number): void {}
  getUI(): UIOutput | null {
    return {
      main: <></>
    };
  }
}
