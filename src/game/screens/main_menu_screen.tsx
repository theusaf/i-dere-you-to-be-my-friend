import * as PIXI from "pixi.js";
import { GameScreen, UIOutput } from "../../engine/screen";
import { GameManager } from "../../engine/game_manager";
import { ColorScheme } from "../util/style";
import { MainMenuContent } from "./ui/main_menu_content";

export class MainMenuScreen extends GameScreen {
  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(ColorScheme.background);
    graphics.drawRect(
      0,
      0,
      this.container.worldWidth,
      this.container.worldHeight,
    );
    graphics.endFill();
    this.container.addChild(graphics);
  }
  update(): void {}
  getUI(): UIOutput | null {
    return {
      main: <MainMenuContent gameManager={this.gameManager} />,
    };
  }
}
