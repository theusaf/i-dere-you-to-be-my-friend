import * as PIXI from "pixi.js";
import RenderLayer from "./render_layer";

export interface UIOutput {
  /**
   * What to render above the main canvas.
   */
  main?: JSX.Element;
  /**
   * What to render above the entire screen.
   */
  screen?: JSX.Element;
}

/**
 * Represents a screen in the game.
 *
 * Handles PixiJS rendering, game logic, and React UI.
 */
export abstract class GameScreen {
  container: RenderLayer | null = null;
  app: PIXI.Application | null = null;
  gameManager: GameManager | null = null;

  /**
   * Called when the screen is deactivated
   */
  dispose(): void {
    this.container!.destroy(true);
    this.app?.stage.removeChild(this.container!);
  }

  /**
   * Called when the screen becomes active
   *
   * @param app - The PixiJS application
   * @param gameManager - The game manager
   */
  initialize(
    app: PIXI.Application,
    gameManager: GameManager,
    container?: RenderLayer
  ): void {
    this.app = app;
    this.gameManager = gameManager;
    this.container = container ?? new RenderLayer(app, 1920, 1080);
    this.app.stage.addChild(this.container);
  }

  /**
   * Called every frame - should be used for rendering and time-based logic
   *
   * @param deltaMs - The time since the last frame in milliseconds
   * @param delta - The delta in terms of speed (fps)
   */
  abstract update(deltaMs: number, delta?: number): void;

  /**
   * Returns the React UI for the screen.
   *
   * This is useful for things like menus, and other UI elements.
   * This UI is overlaid on top of the PixiJS canvas.
   */
  abstract getUI(): UIOutput | null;
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
  }
}
