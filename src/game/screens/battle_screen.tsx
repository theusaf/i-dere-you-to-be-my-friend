import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import RenderLayer from "../../engine/render_layer";

const enum BattleScreenState {
  loadingIn,
  battle,
  loadingOut,
}

class BattleScreen extends GameScreen {
  state: BattleScreenState = BattleScreenState.loadingIn;

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager, new RenderLayer(app, 40));
  }

  update(delta: number): void {}
  getUI(): UIOutput | null {
    return null;
  }
}
