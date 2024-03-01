import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { MapScreenContent } from "./ui/map_screen_content";
import RenderLayer from "../../engine/render_layer";
import { MAP_SIZE, MapData } from "../util/map";
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
  characterChunkX: number = 0;
  cacheCharacterX: number = 0;
  /**
   * The y position of the player in the current map chunk.
   */
  characterChunkY: number = 0;
  cacheCharacterY: number = 0;

  characterWorldX: number = 0;
  characterWorldY: number = 0;

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
    if ("ArrowUp" in this.keysDown || "KeyW" in this.keysDown) {
      if ("ArrowLeft" in this.keysDown || "KeyA" in this.keysDown) {
        return Direction.upLeft;
      } else if ("ArrowRight" in this.keysDown || "KeyD" in this.keysDown) {
        return Direction.upRight;
      } else {
        return Direction.up;
      }
    } else if ("ArrowDown" in this.keysDown || "KeyS" in this.keysDown) {
      if ("ArrowLeft" in this.keysDown || "KeyA" in this.keysDown) {
        return Direction.downLeft;
      } else if ("ArrowRight" in this.keysDown || "KeyD" in this.keysDown) {
        return Direction.downRight;
      } else {
        return Direction.down;
      }
    } else if ("ArrowLeft" in this.keysDown || "KeyA" in this.keysDown) {
      return Direction.left;
    } else if ("ArrowRight" in this.keysDown || "KeyD" in this.keysDown) {
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
      remainingAvailableSprites / 4
    );

    // don't continue if player hasn't moved enough
    if (this.chunkX === this.cacheChunkX && this.chunkY === this.cacheChunkY) {
      if (
        Math.abs(this.characterChunkX - this.cacheCharacterX) <
          additionalLoadAllDirections / 2 &&
        Math.abs(this.characterChunkY - this.cacheCharacterY) <
          additionalLoadAllDirections / 2
      ) {
        return;
      }
    }

    // load all directions
    for (let i = 0; i < 9; i++) {
      const x = this.chunkX + (i % 3) - 1;
      const y = this.chunkY + Math.floor(i / 3) - 1;
      if (`${x},${y}` in this.chunks) continue;
      const chunk = PIXI.Assets.get<MapData>(`map/${x},${y}`) ?? null;
      this.chunks[`${x},${y}`] = chunk;
    }

    // update cache locations
    this.cacheChunkX = this.chunkX;
    this.cacheChunkY = this.chunkY;
    this.currentChunk = this.chunks[`${this.chunkX},${this.chunkY}`]!; // movement logic should prevent this from being null
    this.cacheCharacterX = this.characterChunkX;
    this.cacheCharacterY = this.characterChunkY;
  }

  /**
   * @param x The x position relative to current chunk.
   * @param y The y position relative to current chunk.
   */
  getChunkRelative(x: number, y: number): MapData | null {
    return this.chunks[this.getChunkNumberRelative(x, y)];
  }

  /**
   * @param x The x position relative to current chunk.
   * @param y The y position relative to current chunk.
   */
  getChunkNumberRelative(x: number, y: number): `${number},${number}` {
    if (x < 0 && y < 0) {
      return `${this.chunkX - 1},${this.chunkY - 1}`;
    } else if (x < 0 && y >= MAP_SIZE) {
      return `${this.chunkX - 1},${this.chunkY + 1}`;
    } else if (x >= MAP_SIZE && y < 0) {
      return `${this.chunkX + 1},${this.chunkY - 1}`;
    } else if (x >= MAP_SIZE && y >= MAP_SIZE) {
      return `${this.chunkX + 1},${this.chunkY + 1}`;
    } else if (x < 0) {
      return `${this.chunkX - 1},${this.chunkY}`;
    } else if (x >= MAP_SIZE) {
      return `${this.chunkX + 1},${this.chunkY}`;
    } else if (y < 0) {
      return `${this.chunkX},${this.chunkY - 1}`;
    } else if (y >= MAP_SIZE) {
      return `${this.chunkX},${this.chunkY + 1}`;
    }
    return `${this.chunkX},${this.chunkY}`;
  }

  /**
   * Calculates the global world position from a chunk position.
   *
   * @param x The x chunk position.
   * @param y The y chunk position.
   * @param rx The x position relative to the chunk.
   * @param ry The y position relative to the chunk.
   * @returns The global position in the world.
   */
  getChunkGlobalPosition(
    x: number,
    y: number,
    rx: number = 0,
    ry: number = 0
  ): {
    x: number;
    y: number;
  } {
    const baseX = x * MAP_SIZE,
      baseY = y * MAP_SIZE;
    return {
      x: baseX + rx,
      y: baseY + ry,
    };
  }

  update(): void {}

  getUI(): UIOutput | null {
    return {
      main: <MapScreenContent />,
    };
  }
}
