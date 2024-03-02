import * as PIXI from "pixi.js";
import { GameScreen, UIOutput } from "../../engine/screen";
import { GameManager } from "../../engine/game_manager";
import RenderLayer from "../../engine/render_layer";
import { ColorScheme } from "../util/style";
import { GameAnimation, easeMethod } from "../util/animation";
import { BattleScreenContent } from "./ui/battle_screen_content";

export const enum BattleScreenState {
  loadingIn,
  battle,
  loadingOut,
}

export class BattleScreen extends GameScreen {
  state: BattleScreenState = BattleScreenState.loadingIn;

  transitionGraphicsTop!: PIXI.Graphics;
  transitionGraphicsBottom!: PIXI.Graphics;
  transitionAnimation: GameAnimation<{
    distance: number;
  }> = new GameAnimation(
    { distance: 0 },
    { distance: 40 },
    2000,
    easeMethod.easeInQuart,
  );
  battleGraphicsCharacterShadow!: PIXI.Graphics;
  battleGraphicsEnemyShadow!: PIXI.Graphics;

  private initializeTransitionGraphics() {
    this.transitionGraphicsTop = new PIXI.Graphics()
      .beginFill(ColorScheme.dark)
      .drawPolygon(
        new PIXI.Polygon([
          { x: 0, y: 0 },
          { x: this.container.worldWidth, y: this.container.worldHeight },
          { x: this.container.worldWidth, y: 0 },
          { x: 0, y: 0 },
        ]),
      )
      .endFill();
    this.transitionGraphicsBottom = new PIXI.Graphics()
      .beginFill(ColorScheme.dark)
      .drawPolygon(
        new PIXI.Polygon([
          { x: 0, y: 0 },
          { x: 0, y: this.container.worldHeight },
          { x: this.container.worldWidth, y: this.container.worldHeight },
          { x: 0, y: 0 },
        ]),
      )
      .endFill();
    this.transitionAnimation.reset();

    // add all graphics to screen
    this.container.addChild(this.transitionGraphicsTop);
    this.container.addChild(this.transitionGraphicsBottom);
  }

  private initializeBattleGraphics() {
    const ellipse = new PIXI.Ellipse(0, 0, 6, 2);
    this.battleGraphicsCharacterShadow = new PIXI.Graphics()
      .beginFill(ColorScheme.dark, 0.3)
      .drawShape(ellipse)
      .endFill();
    this.battleGraphicsEnemyShadow = new PIXI.Graphics()
      .beginFill(ColorScheme.dark, 0.3)
      .drawShape(ellipse)
      .endFill();
    this.battleGraphicsCharacterShadow.x = 12;
    this.battleGraphicsCharacterShadow.y = 17;
    this.battleGraphicsCharacterShadow.scale.set(1.5);
    this.battleGraphicsEnemyShadow.x = 30;
    this.battleGraphicsEnemyShadow.y = 9;

    // add to screen
    this.container.addChild(this.battleGraphicsCharacterShadow);
    this.container.addChild(this.battleGraphicsEnemyShadow);
  }

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager, new RenderLayer(app, 40));
    this.initializeTransitionGraphics();
    this.initializeBattleGraphics();
  }

  update(delta: number): void {
    switch (this.state) {
      case BattleScreenState.loadingIn: {
        const { distance } = this.transitionAnimation.update(delta);
        this.transitionGraphicsBottom.x = -distance;
        this.transitionGraphicsTop.x = distance;
        if (this.transitionAnimation.isDone) {
          this.container.removeChild(this.transitionGraphicsTop);
          this.container.removeChild(this.transitionGraphicsBottom);
          this.state = BattleScreenState.battle;
        }
      }
    }
  }
  getUI(): UIOutput | null {
    return {
      main: <BattleScreenContent state={this} />,
    };
  }
}
