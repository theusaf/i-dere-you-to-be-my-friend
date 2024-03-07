import * as PIXI from "pixi.js";
import { GameScreen, UIOutput } from "../../engine/screen";
import { GameManager } from "../../engine/game_manager";
import { ColorScheme, CreateMainColors, CreateSkinColors } from "../util/style";
import { MainMenuContent } from "./ui/main_menu_content";
import RenderLayer from "../../engine/render_layer";
import { CharacterSprite } from "../../engine/character_sprite";
import { MainMenuPageState } from "../util/enums";
export class MainMenuScreen extends GameScreen {
  screenState!: MainMenuPageState;
  characterBg!: PIXI.Graphics;
  characterBgMain!: PIXI.Graphics;
  spriteRenderLayer!: RenderLayer;
  sprite?: CharacterSprite;

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
    this.characterBg.zIndex = 1;
    this.characterBg.visible = false;

    this.characterBgMain = new PIXI.Graphics()
      .beginFill(0xfcba03)
      .drawRect(
        worldWidth / 3,
        worldHeight / 7,
        worldWidth / 3,
        (worldHeight * 7) / 8,
      )
      .endFill();
    this.characterBgMain.zIndex = 2;
    this.characterBgMain.visible = false;

    this.spriteRenderLayer = new RenderLayer(this.app, 10);
    this.spriteRenderLayer.zIndex = 3;
    this.spriteRenderLayer.visible = false;

    this.initSprite();

    this.container.addChild(bgGraphics);
    this.container.addChild(this.characterBg);
    this.container.addChild(this.characterBgMain);
    this.container.addChild(this.spriteRenderLayer);
  }

  async initSprite(): Promise<void> {
    const sprite = new CharacterSprite({
      skinColor: CreateSkinColors.dark,
      headColor: CreateMainColors.red,
      headId: "1",
      bodyColor: CreateMainColors.red,
      bodyId: "1",
      legColor: CreateMainColors.red,
      legId: "1",
    });
    await sprite.initSprite();
    sprite.setWidth(2);
    sprite.x = 5;
    sprite.y = 5;
    this.sprite = sprite;
    this.spriteRenderLayer.addChild(sprite.getView());
  }

  update(delta: number): void {
    this.sprite?.update(delta);
    if (this.screenState === MainMenuPageState.newSave) {
      this.characterBg.visible = true;
      this.characterBgMain.visible = true;
      this.spriteRenderLayer.visible = true;
    } else {
      this.characterBg.visible = false;
      this.characterBgMain.visible = false;
      this.spriteRenderLayer.visible = false;
    }
  }

  renderSprite(): void {}

  getUI(): UIOutput | null {
    return {
      main: (
        <MainMenuContent
          gameManager={this.gameManager}
          screen={this}
          setScreenState={(state: MainMenuPageState) =>
            (this.screenState = state)
          }
        />
      ),
    };
  }
}
