import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { MapScreenContent } from "./ui/map_screen_content";
import RenderLayer from "../../engine/render_layer";
import { MAP_SIZE, MapData, MapTile } from "../util/map";
import { Direction } from "../util/direction";

export class MapScreen extends GameScreen {
  mapBgContainer?: PIXI.ParticleContainer<PIXI.Sprite>;
  currentChunk?: MapData;
  chunks: Record<`${number},${number}`, MapData | null> = {};
  /**
   * The x position of the map chunk the player is currently in.
   */
  chunkX: number = 0;
  cacheChunkX: number = Infinity;
  /**
   * The y position of the  map chunk the player is currently in.
   */
  chunkY: number = 0;
  cacheChunkY: number = Infinity;
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
    this.characterChunkX = Math.floor(MAP_SIZE / 2);
    this.characterChunkY = Math.floor(MAP_SIZE / 2);
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
    const totalVisibleSprites = Math.ceil(worldWidth * worldHeight);
    const remainingAvailableSprites =
      MapScreen.SPRITE_SIZE - totalVisibleSprites;
    const additionalLoadAllDirections = this.calculateMarginSize(
      worldWidth,
      worldHeight,
      remainingAvailableSprites,
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

    const relativeStartX = this.characterChunkX - additionalLoadAllDirections,
      relativeStartY = this.characterChunkY - additionalLoadAllDirections,
      relativeEndX = this.characterChunkX + additionalLoadAllDirections,
      relativeEndY = this.characterChunkY + additionalLoadAllDirections;

    this.mapBgContainer!.removeChildren();
    for (let x = relativeStartX; x < relativeEndX; x++) {
      for (let y = relativeStartY; y < relativeEndY; y++) {
        const chunk = this.getChunkRelative(x, y);
        if (chunk) {
          const [chunkX, chunkY] = this.getChunkNumberRelative(x, y)
            .split(",")
            .map(Number);
          const { x: newChunkBaseGlobalX, y: newChunkBaseGlobalY } =
            this.getChunkGlobalPosition(chunkX, chunkY);
          const { x: globalX, y: globalY } = this.getChunkGlobalPosition(
            this.chunkX,
            this.chunkY,
            x,
            y,
          );
          const offsetX = globalX - newChunkBaseGlobalX,
            offsetY = globalY - newChunkBaseGlobalY;
          const tileIndex = offsetY * MAP_SIZE + offsetX,
            tile = chunk.tiles[tileIndex];
          const sprite = new PIXI.Sprite(this.getTextureFromTile(tile));
          sprite.x = globalX;
          sprite.y = globalY;
          sprite.width = 1;
          sprite.height = 1;
          this.mapBgContainer!.addChild(sprite);
        }
      }
    }
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
    ry: number = 0,
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

  getTextureFromTile(tile: MapTile): PIXI.Texture {
    // TODO: wrap in another class to allow for animations
    switch (tile) {
      case MapTile.bridge:
        return PIXI.Assets.get("icon/map/wood")!;
      case MapTile.dirtRoad:
        return PIXI.Assets.get("icon/map/dirt")!;
      case MapTile.grass:
        return PIXI.Assets.get("icon/map/grass")!;
      case MapTile.pavedRoad:
        return PIXI.Assets.get("icon/map/rock")!;
      case MapTile.sand:
        return PIXI.Assets.get("icon/map/sand")!;
      case MapTile.tallgrass:
        return PIXI.Assets.get("icon/map/thick_grass")!;
      case MapTile.water:
        return PIXI.Assets.get("icon/map/water1")!;
    }
    return PIXI.Texture.WHITE;
  }

  /**
   * Calculates the margin size for a rectangle given available margin area.
   *
   * @param innerWidth The width of the rectangle.
   * @param innerHeight The height of the rectangle.
   * @param marginArea The available margin area.
   */
  calculateMarginSize(
    innerWidth: number,
    innerHeight: number,
    marginArea: number,
  ): number {
    // formula derived from quadratic forumla using wolfram alpha:
    // area = area with margins - area of rectangle
    // area with margins = (rect width + 2 * margin width) * (rect height + 2 * margin height)
    // area of rectangle = rect width * rect height
    const d = Math.sqrt(
      innerHeight ** 2 +
        innerWidth ** 2 +
        2 * innerHeight * innerWidth +
        4 * marginArea,
    );
    return Math.floor(
      Math.max(
        (d - innerHeight - innerWidth) / 4,
        (-d - innerHeight - innerWidth) / 4,
      ),
    );
  }

  update(): void {}

  getUI(): UIOutput | null {
    return {
      main: <MapScreenContent />,
    };
  }
}
