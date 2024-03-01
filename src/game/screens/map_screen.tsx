import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { MapScreenContent } from "./ui/map_screen_content";
import RenderLayer from "../../engine/render_layer";
import { MapData } from "../util/map";
import { Direction } from "../util/direction";

export class MapScreen extends GameScreen {
  mapBgContainer?: PIXI.ParticleContainer<PIXI.Sprite>;
  currentChunk?: MapData;
  chunks: Record<`${number},${number}`, MapData | null> = {};
  /**
   * The x position of the map chunk the player is currently in.
   */
  chunkX: number = 0;
  cacheChunkX: number = 0;
  /**
   * The y position of the  map chunk the player is currently in.
   */
  chunkY: number = 0;
  cacheChunkY: number = 0;
  /**
   * The x position of the player in the current map chunk.
   */
  characterX: number = 0;
  cacheCharacterX: number = 0;
  /**
   * The y position of the player in the current map chunk.
   */
  characterY: number = 0;
  cacheCharacterY: number = 0;

  keysDown: Set<string> = new Set();

  static SPRITE_SIZE = 4096;

  initialize(app: PIXI.Application, gameManager: GameManager): void {
    // intialize world size in terms of "blocks" (about 0.5 meters)
    super.initialize(app, gameManager, new RenderLayer(app, 30));

    // 4096 is about 1/4 chunk's worth of sprites
    // generally, around ~2000 sprites are visible on the screen.
    // it will be important to keep the sprites updated.
    // ideas: do this in a setInterval that runs slowly (1 second?)
    // the player shouldn't be able to move super fast, so this should be
    // enough time.
    this.mapBgContainer = new PIXI.ParticleContainer(MapScreen.SPRITE_SIZE);
    this.container!.addChild(this.mapBgContainer);
    this.updateChunks();

    window.addEventListener("keydown", (e) => this.onKeyDown(e.code));
    window.addEventListener("keyup", (e) => this.onKeyUp(e.code));
  }

  onKeyDown(key: string): void {
    this.keysDown.add(key);
  }

  onKeyUp(key: string): void {
    this.keysDown.delete(key);
  }

  get direction(): Direction {
    if ("ArrowUp" in this.keysDown) {
      if ("ArrowLeft" in this.keysDown) {
        return Direction.upLeft;
      } else if ("ArrowRight" in this.keysDown) {
        return Direction.upRight;
      } else {
        return Direction.up;
      }
    } else if ("ArrowDown" in this.keysDown) {
      if ("ArrowLeft" in this.keysDown) {
        return Direction.downLeft;
      } else if ("ArrowRight" in this.keysDown) {
        return Direction.downRight;
      } else {
        return Direction.down;
      }
    } else if ("ArrowLeft" in this.keysDown) {
      return Direction.left;
    } else if ("ArrowRight" in this.keysDown) {
      return Direction.right;
    }
    return Direction.none;
  }

  dispose(): void {
    super.dispose();
    window.removeEventListener("keydown", (e) => this.onKeyDown(e.code));
    window.removeEventListener("keyup", (e) => this.onKeyUp(e.code));
  }

  /**
   * Loads map data and adds relevant sprites to the renderer.
   */
  updateChunks(): void {
    const { worldWidth, worldHeight } = this.container!;
    const totalVisibleSprites = worldWidth * worldHeight;
    const remainingAvailableSprites =
      MapScreen.SPRITE_SIZE - totalVisibleSprites;
    const additionalLoadAllDirections = Math.floor(
      remainingAvailableSprites / 4,
    );

    // don't continue if player hasn't moved enough
    if (this.chunkX === this.cacheChunkX && this.chunkY === this.cacheChunkY) {
      if (
        Math.abs(this.characterX - this.cacheCharacterX) <
          additionalLoadAllDirections / 2 &&
        Math.abs(this.characterY - this.cacheCharacterY) <
          additionalLoadAllDirections / 2
      ) {
        return;
      }
    }

    // player has moved enough, update cache
    this.cacheChunkX = this.chunkX;
    this.cacheChunkY = this.chunkY;
    this.cacheCharacterX = this.characterX;
    this.cacheCharacterY = this.characterY;

    // load all directions
    this.chunks = {};
    for (let i = 0; i < 9; i++) {
      const x = this.chunkX + (i % 3) - 1;
      const y = this.chunkY + Math.floor(i / 3) - 1;
      const chunk = PIXI.Assets.get<MapData>(`map/${x},${y}`) ?? null;
      this.chunks[`${x},${y}`] = chunk;
    }
  }

  update(): void {}

  getUI(): UIOutput | null {
    return {
      main: <MapScreenContent />,
    };
  }
}
