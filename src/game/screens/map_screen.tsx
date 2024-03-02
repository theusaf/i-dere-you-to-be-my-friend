import * as PIXI from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { MapScreenContent } from "./ui/map_screen_content";
import RenderLayer from "../../engine/render_layer";
import { MAP_SIZE, MapData, MapTile } from "../util/map";
import { Direction } from "../util/direction";

export class MapScreen extends GameScreen {
  mapBgContainer?: PIXI.Container;
  chunks: Record<`${number},${number}`, MapData | null> = {};
  characterSprite?: PIXI.Sprite;
  get currentChunk(): MapData | null {
    return this.chunks[`${this.chunkX},${this.chunkY}`];
  }
  /**
   * The x position of the map chunk the player is currently in.
   */
  get chunkX(): number {
    const chunkPos = this.getGlobalChunkNumber(
      this.characterWorldX,
      this.characterWorldY,
    );
    return +chunkPos.split(",")[0];
  }
  cacheChunkX: number = Infinity;
  /**
   * The y position of the map chunk the player is currently in.
   */
  get chunkY(): number {
    const chunkPos = this.getGlobalChunkNumber(
      this.characterWorldX,
      this.characterWorldY,
    );
    return +chunkPos.split(",")[1];
  }
  cacheChunkY: number = Infinity;
  /**
   * The x position of the player in the current map chunk.
   */
  get characterChunkX(): number {
    const { x } = this.getLocalChunkPosition(
      this.characterWorldX,
      this.characterWorldY,
    );
    return x;
  }
  cacheCharacterX: number = 0;
  /**
   * The y position of the player in the current map chunk.
   */
  get characterChunkY(): number {
    const { y } = this.getLocalChunkPosition(
      this.characterWorldX,
      this.characterWorldY,
    );
    return y;
  }
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
    this.mapBgContainer = new PIXI.Container();
    this.characterSprite = new PIXI.Sprite(PIXI.Assets.get("icon/map/water2")!);
    this.characterSprite.width = 1;
    this.characterSprite.height = 1;
    this.characterSprite.x = this.container?.worldWidth! / 2 - 0.5;
    this.characterSprite.y = this.container?.worldHeight! / 2 - 0.5;
    this.characterSprite.texture.baseTexture.scaleMode =
      PIXI.SCALE_MODES.NEAREST;
    this.characterSprite.zIndex = 100;
    this.container?.addChild(this.characterSprite);
    this.characterWorldX = Math.floor(MAP_SIZE / 2);
    this.characterWorldY = Math.floor(MAP_SIZE / 2);
    this.updateChunks();

    this.container?.addChild(this.mapBgContainer);
    (window as unknown as any).testbg = this.mapBgContainer;

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
    if (this.keysDown.has("ArrowUp") || this.keysDown.has("KeyW")) {
      if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA")) {
        return Direction.upLeft;
      } else if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD")) {
        return Direction.upRight;
      } else {
        return Direction.up;
      }
    } else if (this.keysDown.has("ArrowDown") || this.keysDown.has("KeyS")) {
      if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA")) {
        return Direction.downLeft;
      } else if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD")) {
        return Direction.downRight;
      } else {
        return Direction.down;
      }
    } else if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA")) {
      return Direction.left;
    } else if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD")) {
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
          additionalLoadAllDirections - 4 &&
        Math.abs(this.characterChunkY - this.cacheCharacterY) <
          additionalLoadAllDirections - 4
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
    this.cacheCharacterX = this.characterChunkX;
    this.cacheCharacterY = this.characterChunkY;

    const relativeStartX = Math.floor(
        this.characterChunkX - additionalLoadAllDirections - worldWidth / 2,
      ),
      relativeStartY = Math.floor(
        this.characterChunkY - additionalLoadAllDirections - worldHeight / 2,
      ),
      relativeEndX = Math.floor(
        this.characterChunkX + additionalLoadAllDirections + worldWidth / 2,
      ),
      relativeEndY = Math.floor(
        this.characterChunkY + additionalLoadAllDirections + worldHeight / 2,
      );

    this.mapBgContainer!.removeChildren();
    for (let y = relativeStartY; y < relativeEndY; y++) {
      for (let x = relativeStartX; x < relativeEndX; x++) {
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
          sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
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
   * @param x The x position relative to current/provided chunk.
   * @param y The y position relative to current/provided chunk.
   * @param chunkX The chunk's x number.
   * @param chunkY The chunk's y number.
   */
  getChunkNumberRelative(
    x: number,
    y: number,
    chunkX: number = this.chunkX,
    chunkY: number = this.chunkY,
  ): `${number},${number}` {
    if (x < 0 && y < 0) {
      return `${chunkX - 1},${chunkY - 1}`;
    } else if (x < 0 && y >= MAP_SIZE) {
      return `${chunkX - 1},${chunkY + 1}`;
    } else if (x >= MAP_SIZE && y < 0) {
      return `${chunkX + 1},${chunkY - 1}`;
    } else if (x >= MAP_SIZE && y >= MAP_SIZE) {
      return `${chunkX + 1},${chunkY + 1}`;
    } else if (x < 0) {
      return `${chunkX - 1},${chunkY}`;
    } else if (x >= MAP_SIZE) {
      return `${chunkX + 1},${chunkY}`;
    } else if (y < 0) {
      return `${chunkX},${chunkY - 1}`;
    } else if (y >= MAP_SIZE) {
      return `${chunkX},${chunkY + 1}`;
    }
    return `${chunkX},${chunkY}`;
  }

  /**
   * Gets the tile at a relative position to a chunk.
   *
   * @param x The x position relative to provided chunk.
   * @param y The y position relative to provided chunk.
   * @param chunkX The chunk's x number.
   * @param chunkY The chunk's y number.
   */
  getLocalChunkTile(
    x: number,
    y: number,
    chunkX: number = this.chunkX,
    chunkY: number = this.chunkY,
  ): MapTile {
    const chunk = this.chunks[`${chunkX},${chunkY}`];
    if (!chunk) return MapTile.unknown;
    return (
      chunk.tiles[Math.floor(y) * MAP_SIZE + Math.floor(x)] ?? MapTile.unknown
    );
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

  /**
   * Calculates the chunk number from a global position.
   */
  getGlobalChunkNumber(worldX: number, worldY: number): `${number},${number}` {
    return `${Math.floor(worldX / MAP_SIZE)},${Math.floor(worldY / MAP_SIZE)}`;
  }

  /**
   * Calculates the local position in a chunk from a global position.
   */
  getLocalChunkPosition(
    worldX: number,
    worldY: number,
  ): {
    x: number;
    y: number;
  } {
    const chunkNumber = this.getGlobalChunkNumber(worldX, worldY),
      [chunkX, chunkY] = chunkNumber.split(",").map(Number),
      { x: baseX, y: baseY } = this.getChunkGlobalPosition(chunkX, chunkY);
    return {
      x: worldX - baseX,
      y: worldY - baseY,
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

  update(delta: number): void {
    this.mapBgContainer!.x = -(
      this.characterWorldX -
      this.container?.worldWidth! / 2
    );
    this.mapBgContainer!.y = -(
      this.characterWorldY -
      this.container?.worldHeight! / 2
    );

    if (this.direction !== Direction.none) {
      const distance = 0.008 * delta;
      switch (this.direction) {
        case Direction.up:
          this.moveCharacterY(-distance);
          break;
        case Direction.down:
          this.moveCharacterY(distance);
          break;
        case Direction.left:
          this.moveCharacterX(-distance);
          break;
        case Direction.right:
          this.moveCharacterX(distance);
          break;
        case Direction.upLeft:
          this.moveCharacterX(-distance);
          this.moveCharacterY(-distance);
          break;
        case Direction.upRight:
          this.moveCharacterY(-distance);
          this.moveCharacterX(distance);
          break;
        case Direction.downLeft:
          this.moveCharacterY(distance);
          this.moveCharacterX(-distance);
          break;
        case Direction.downRight:
          this.moveCharacterY(distance);
          this.moveCharacterX(distance);
          break;
      }
      this.updateChunks();
    }
  }

  moveCharacterX(dx: number): void {
    this.moveCharacterToX(this.characterWorldX + dx);
  }

  moveCharacterToX(x: number): void {
    this.moveCharacterTo(x, this.characterWorldY);
  }

  moveCharacterY(dy: number): void {
    this.moveCharacterToY(this.characterWorldY + dy);
  }

  moveCharacterToY(y: number): void {
    this.moveCharacterTo(this.characterWorldX, y);
  }

  moveCharacterTo(x: number, y: number): void {
    // check for collisions/bounds
    const testChunkNumber = this.getGlobalChunkNumber(x, y),
      [testChunkX, testChunkY] = testChunkNumber.split(",").map(Number);
    if (!this.chunks[testChunkNumber]) return;

    const { x: localX, y: localY } = this.getLocalChunkPosition(x, y);
    const tile = this.getLocalChunkTile(localX, localY, testChunkX, testChunkY);
    // TODO: separate into a collision detection function
    // This can also be used for events, like entering buildings
    if (tile === MapTile.water) {
      // if already in water, it's alright
      const currentTile = this.getLocalChunkTile(
        this.characterChunkX,
        this.characterChunkY,
      );
      if (currentTile !== MapTile.water) return;
    }

    // checks pass, move character
    this.characterWorldX = x;
    this.characterWorldY = y;
  }

  getUI(): UIOutput | null {
    return {
      main: <MapScreenContent />,
    };
  }
}
