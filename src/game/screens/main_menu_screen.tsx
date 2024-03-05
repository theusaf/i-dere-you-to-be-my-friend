import * as PIXI from "pixi.js";
import { GameScreen, UIOutput } from "../../engine/screen";
import { GameManager } from "../../engine/game_manager";
import { ColorScheme } from "../util/style";
import { MainMenuContent, MainMenuPageState } from "./ui/main_menu_content";

export class MainMenuScreen extends GameScreen {
  screenState!: MainMenuPageState;
  characterBg!: PIXI.Graphics;
  characterBgMain!: PIXI.Graphics;

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    super.initialize(app, gameManager);
    this.screenState = MainMenuPageState.index;
    const { worldWidth, worldHeight } = this.container;

    const bgGraphics = new PIXI.Graphics()
      .beginFill(ColorScheme.background)
      .drawRect(0, 0, this.container.worldWidth, this.container.worldHeight)
      .endFill();

    this.characterBg = new PIXI.Graphics()
      .beginFill(0xd97706)
      .drawRect(
        worldWidth / 5,
        worldHeight / 7 - 20,
        (worldWidth * 3) / 5,
        (worldHeight * 7) / 8 + 20,
      )
      .endFill();
    this.characterBg.visible = false;

    this.characterBgMain = new PIXI.Graphics()
      .beginFill(0x92400e)
      .drawRect(
        worldWidth / 3,
        worldHeight / 7,
        worldWidth / 3,
        (worldHeight * 7) / 8,
      )
      .endFill();
    this.characterBgMain.visible = false;

    this.container.addChild(bgGraphics);
    this.container.addChild(this.characterBg);
    this.container.addChild(this.characterBgMain);
  }

  update(): void {
    if (this.screenState === MainMenuPageState.newSave) {
      this.characterBg.visible = true;
      this.characterBgMain.visible = true;
    } else {
      this.characterBg.visible = false;
      this.characterBgMain.visible = false;
    }
  }

  getUI(): UIOutput | null {
    return {
      main: (
        <MainMenuContent
          gameManager={this.gameManager}
          setScreenState={(state: MainMenuPageState) =>
            (this.screenState = state)
          }
        />
      ),
    };
  }
}
