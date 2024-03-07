import { Application, DisplayObject } from "pixi.js";
import { GameScreen } from "./screen";
import { GameData } from "../game/util/game_data";

/**
 * Manages game screens.
 */
export class GameManager {
  currentScreen: GameScreen | null = null;
  app: Application;
  onScreenChange: () => void;
  gameData: GameData;

  constructor(app: Application, onScreenChange: () => void) {
    this.app = app;
    this.onScreenChange = onScreenChange;
    this.gameData = new GameData();
    app.ticker.add(this.executeGameLoop.bind(this));
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
