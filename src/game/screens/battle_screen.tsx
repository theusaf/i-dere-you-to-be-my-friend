import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import RenderLayer from "../../engine/render_layer";
import { ColorScheme } from "../util/style";
import { GameAnimation, easeMethod } from "../util/animation";

const enum BattleScreenState {
  loadingIn,
  battle,
  loadingOut,
}

export class BattleScreen extends GameScreen {
  state: BattleScreenState = BattleScreenState.loadingIn;

  transitionGraphicsTop: PIXI.Graphics | null = null;
  transitionGraphicsBottom: PIXI.Graphics | null = null;
  transitionAnimation: GameAnimation<{
    distance: number;
  }> = new GameAnimation(
    { distance: 0 },
    { distance: 40 },
    2000,
    easeMethod.easeInQuart
  );

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager, new RenderLayer(app, 40));
    this.transitionGraphicsTop = new PIXI.Graphics()
      .beginFill(ColorScheme.dark)
      .drawPolygon(
        new PIXI.Polygon([
          { x: 0, y: 0 },
          { x: this.container!.worldWidth, y: this.container!.worldHeight },
          { x: this.container!.worldWidth, y: 0 },
          { x: 0, y: 0 },
        ])
      )
      .endFill();
    this.transitionGraphicsBottom = new PIXI.Graphics()
      .beginFill(ColorScheme.dark)
      .drawPolygon(
        new PIXI.Polygon([
          { x: 0, y: 0 },
          { x: 0, y: this.container!.worldHeight },
          { x: this.container!.worldWidth, y: this.container!.worldHeight },
          { x: 0, y: 0 },
        ])
      )
      .endFill();
    this.transitionAnimation.reset();

    // add all graphics to screen
    this.container!.addChild(this.transitionGraphicsTop);
    this.container!.addChild(this.transitionGraphicsBottom);
  }

  update(delta: number): void {
    switch (this.state) {
      case BattleScreenState.loadingIn: {
        const { distance } = this.transitionAnimation.update(delta);
        this.transitionGraphicsBottom!.x = -distance;
        this.transitionGraphicsTop!.x = distance;
        if (this.transitionAnimation.isDone) {
          this.container!.removeChild(this.transitionGraphicsTop!);
          this.container!.removeChild(this.transitionGraphicsBottom!);
          this.state = BattleScreenState.battle;
        }
      }
    }
  }
  getUI(): UIOutput | null {
    return null;
  }
}
