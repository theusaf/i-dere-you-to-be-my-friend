import { Application, DisplayObject } from "pixi.js";
import { GameScreen } from "./screen";
import { GameData } from "../game/util/game_data";
import { CutsceneAction, CutsceneActionType } from "../game/util/map_types";
import { sleep } from "../game/util/sleep";
import { MapScreen, MapScreenEvents } from "../game/screens/map_screen";

/**
 * Manages game screens.
 */
export class GameManager {
  currentScreen: GameScreen | null = null;
  app: Application;
  onScreenChange: () => void;
  gameData: GameData;
  cutsceneData: CutsceneAction[];
  cutsceneIndex: number = 0;

  constructor(app: Application, onScreenChange: () => void) {
    this.app = app;
    this.onScreenChange = onScreenChange;
    this.gameData = new GameData();
    this.cutsceneData = [];
    app.ticker.add(this.executeGameLoop.bind(this));
  }

  applyCutsceneData(cutsceneData: CutsceneAction[], id: string): void {
    this.gameData.cutscenes.add(id);
    this.cutsceneData = cutsceneData;
    this.cutsceneIndex = 0;
    this.executeCutsceneLoop();
  }

  async executeCutsceneLoop(): Promise<void> {
    const cutsceneData = this.cutsceneData;
    let index = this.cutsceneIndex - 1;
    let cleanup: (() => void) | null = null; // run at the start of the next action
    for (const action of cutsceneData) {
      // data changed, stop this loop
      if (this.cutsceneData !== cutsceneData) {
        console.log("Cutscene data changed, stopping loop");
        return;
      }

      console.log("Waiting for cutscene index", index + 1);

      while (
        this.cutsceneIndex === index ||
        !(this.currentScreen instanceof MapScreen)
      ) {
        console.log("Waiting for cutscene index", index, this.cutsceneIndex);
        await sleep(500);
        continue;
      }
      if (cleanup) {
        cleanup = null;
      }

      console.log("Executing cutscene action", action);

      this.currentScreen.paused = true;
      index = this.cutsceneIndex;
      const [type, data] = action;
      switch (type) {
        case CutsceneActionType.blankScreen: {
          this.currentScreen.notify(MapScreenEvents.blankScreen, data);
          break;
        }
        case CutsceneActionType.animate: {
          this.currentScreen.notify(MapScreenEvents.animate, data);
          break;
        }
        case CutsceneActionType.dialog: {
          this.currentScreen.notify(MapScreenEvents.dialog, data);
          break;
        }
        case CutsceneActionType.battle: {
          this.currentScreen.notify(MapScreenEvents.battleStart, data);
          break;
        }
        case CutsceneActionType.contract: {
          this.currentScreen.notify(MapScreenEvents.contract, data);
          break;
        }
      }
    }
    if (this.currentScreen instanceof MapScreen) {
      this.currentScreen.paused = false;
    }
    this.cutsceneData = [];
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
