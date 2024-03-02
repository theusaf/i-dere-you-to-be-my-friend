import { Application } from "pixi.js";
import RenderLayer from "./render_layer";
import { GameManager } from "./game_manager";

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
  container!: RenderLayer;
  app!: Application;
  gameManager!: GameManager;

  /**
   * Called when the screen is deactivated
   */
  dispose(): void {
    this.container.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.app.stage.removeChild(this.container);
  }

  /**
   * Called when the screen becomes active
   *
   * @param app - The PixiJS application
   * @param gameManager - The game manager
   */
  initialize(
    app: Application,
    gameManager: GameManager,
    container?: RenderLayer,
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
  abstract update(deltaMs?: number, delta?: number): void;

  /**
   * Returns the React UI for the screen.
   *
   * This is useful for things like menus, and other UI elements.
   * This UI is overlaid on top of the PixiJS canvas.
   */
  abstract getUI(): UIOutput | null;
}
