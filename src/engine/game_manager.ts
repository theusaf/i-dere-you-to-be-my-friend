import { Application } from "pixi.js";
import { GameScreen } from "./screen";

/**
 * Manages game screens.
 */
export class GameManager {
  currentScreen: GameScreen | null = null;
  app: Application;
  onScreenChange: () => void;

  constructor(app: Application, onScreenChange: () => void) {
    this.app = app;
    this.onScreenChange = onScreenChange;
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
}
