import * as PIXI from "pixi.js";

/**
 * Represents a screen in the game.
 *
 * Handles PixiJS rendering, game logic, and React UI.
 */
export abstract class GameScreen {
  app: PIXI.Application | null = null;

  /**
   * Called when the screen is deactivated
   */
  abstract dispose(): void;

  /**
   * Called when the screen becomes active
   *
   * @param app - The PixiJS application
   */
  initialize(app: PIXI.Application): void {
    this.app = app;
  }

  /**
   * Called every frame - should be used for rendering and time-based logic
   *
   * @param delta - The time since the last frame in milliseconds
   */
  abstract update(delta: number): void;

  /**
   * Returns the React UI for the screen.
   *
   * This is useful for things like menus, and other UI elements.
   * This UI is overlaid on top of the PixiJS canvas.
   */
  abstract getUI(): JSX.Element;
}

/**
 * Manages game screens.
 */
export class GameManager {
  currentScreen: GameScreen | null = null;
  app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;
    app.ticker.add(this.executeGameLoop.bind(this));
  }

  executeGameLoop(delta: number): void {
    this.currentScreen?.update(delta);
  }

  /**
   * Changes the screen, and disposes the old one.
   *
   * @param screen - The screen to change to
   */
  changeScreen(screen: GameScreen): void {
    this.currentScreen?.dispose();
    this.currentScreen = screen;
    this.currentScreen.initialize(this.app);
  }
}
