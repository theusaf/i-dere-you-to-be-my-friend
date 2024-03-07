import { Application, DisplayObject } from "pixi.js";
import { GameScreen } from "./screen";
import { GameData } from "../game/util/game_data";
import { Cutscene, CutsceneAction } from "../game/util/map_types";
import { sleep } from "../game/util/sleep";
import { MapScreen } from "../game/screens/map_screen";

/**
 * Manages game screens.
 */
export class GameManager {
  currentScreen: GameScreen | null = null;
  app: Application;
  onScreenChange: () => void;
  gameData: GameData;
  cutsceneData: Cutscene[];
  cutsceneIndex: number = 0;

  constructor(app: Application, onScreenChange: () => void) {
    this.app = app;
    this.onScreenChange = onScreenChange;
    this.gameData = new GameData();
    this.cutsceneData = [];
    app.ticker.add(this.executeGameLoop.bind(this));
  }

  applyCutsceneData(cutsceneData: Cutscene[], id: string): void {
    this.gameData.cutscenes.add(id);
    this.cutsceneData = cutsceneData;
    this.cutsceneIndex = 0;
    this.executeCutsceneLoop();
  }

  async executeCutsceneLoop(): Promise<void> {
    const cutsceneData = this.cutsceneData;
    let index = this.cutsceneIndex;
    for (const action of cutsceneData) {
      // data changed, stop this loop
      if (this.cutsceneData !== cutsceneData) return;
      // waiting for cutscene actions to finish
      if (index === this.cutsceneIndex) {
        await sleep(250);
        continue;
      }
      if (!(this.currentScreen instanceof MapScreen)) {
        await sleep(500);
        continue;
      }
      index = this.cutsceneIndex;
      const [type, data] = action;
      switch (type) {
        case CutsceneAction.blankScreen: {
          break;
        }
        case CutsceneAction.animate: {
          break;
        }
        case CutsceneAction.dialog: {
          break;
        }
        case CutsceneAction.battle: {
          break;
        }
        case CutsceneAction.contract: {
          break;
        }
      }
    }
  }

  executeGameLoop(delta: number): void {
    this.currentScreen?.update(this.app.ticker.deltaMS, delta);
  }

  /**
   * Changes the screen, and disposes the old one.
   *
   * @param screen - The screen to change to
   */
  changeScreen(screen: GameScreen): void {
    this.currentScreen?.dispose();
    this.currentScreen = screen;
    this.currentScreen.initialize(this.app, this);
    this.onScreenChange();
  }

  convertSpriteToImage(sprite: DisplayObject): Promise<Blob> {
    return this.app.renderer.extract.canvas(sprite).convertToBlob!();
  }
}
