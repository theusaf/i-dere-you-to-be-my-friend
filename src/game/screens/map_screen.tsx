import {
  Application,
  Assets,
  Container,
  DisplayObject,
  ParticleContainer,
  Sprite,
  Texture,
} from "pixi.js";
import { GameScreen, UIOutput } from "../../engine/screen";
import { GameManager } from "../../engine/game_manager";
import { MapScreenContent } from "./ui/map_screen_content";
import RenderLayer from "../../engine/render_layer";
import { MAP_SIZE, MapData, MapTile, mapTileStrings } from "../util/map";
import { Direction } from "../util/direction";
import {
  BuildingSpecialData,
  MapSpecialActionBattle,
  MapSpecialBuildingBox,
  MapSpecialData,
  NPCData,
} from "../util/map_types";
import { AnimatedSprite } from "../../engine/animated_sprite";
import { lerp } from "../util/animation";
import { chance } from "../util/chance";
import {
  CharacterSprite,
  CharacterSpriteAnimation,
} from "../../engine/character_sprite";
import { Character } from "../util/character";
import { constrain } from "../util/math";

export enum MapScreenEvents {
  /**
   * Emitted when a battle is about to start.
   *
   * @param {MapSpecialActionBattle} detail - The battle data.
   */
  battleStart = "battleStart",
  blankScreen = "blankScreen",
  dialog = "dialog",
  contract = "contract",
  animate = "animate",
}

export enum MapBuildingPosition {
  outside,
  entering,
  inside,
}

export class MapScreen extends GameScreen {
  mapBgContainer!: Container;
  chunks: Record<`${number},${number}`, MapData | null> = {};
  characterSprite!: CharacterSprite;
  collisionCacheX: number = 0;
  collisionCacheY: number = 0;
  lerpWorldY: number = 0;
  lerpWorldX: number = 0;
  mapSpecialContainer!: Container<DisplayObject>;
  mapContainer!: Container<DisplayObject>;
  mapBuildingContainer!: Container<DisplayObject>;
  mapNPCContainer!: Container<DisplayObject>;
  paused: boolean = false;
  mapNPCS: Record<
    string,
    {
      character: Character;
      sprite: CharacterSprite;
    }
  > = {};
  baseSize!: number;
  currentSize!: number;
  inBuilding!: MapBuildingPosition;
  ignoreCollisionBox: [number, number, number, number] | null = null;
  mapBuildingData: {
    offsetX: number;
    offsetY: number;
    data: MapData;
  } | null = null;

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

  get characterWorldX(): number {
    return this.gameManager.gameData.worldMapData.playerX;
  }
  set characterWorldX(x: number) {
    this.gameManager.gameData.worldMapData.playerX = x;
  }
  get characterWorldY(): number {
    return this.gameManager.gameData.worldMapData.playerY;
  }
  set characterWorldY(y: number) {
    this.gameManager.gameData.worldMapData.playerY = y;
  }

  keysDown: Set<string> = new Set();

  textureParticleContainerMap: Map<Texture, ParticleContainer> = new Map();
  static SPRITE_SIZE = 4096;

  eventNotifier: EventTarget = new EventTarget();

  initialize(app: Application, gameManager: GameManager): void {
    // intialize world size in terms of "blocks" (about 0.5 meters)
    super.initialize(app, gameManager, new RenderLayer(app, 30));

    this.baseSize = this.container.worldWidth;
    this.currentSize = this.baseSize;

    this.mapContainer = new Container();
    this.mapBgContainer = new Container();
    this.mapSpecialContainer = new Container();
    this.mapNPCContainer = new Container();
    this.mapBuildingContainer = new Container();
    this.mapBuildingContainer.sortableChildren = true;
    this.mapSpecialContainer.sortableChildren = true;
    this.mapContainer.sortableChildren = true;

    this.characterSprite = new CharacterSprite({
      skinColor: this.gameManager.gameData.you.colors.skin,
      headColor: this.gameManager.gameData.you.colors.head,
      bodyColor: this.gameManager.gameData.you.colors.body,
      legColor: this.gameManager.gameData.you.colors.legs,
      headId: `${this.gameManager.gameData.you.styles.head}`,
      bodyId: `${this.gameManager.gameData.you.styles.body}`,
      legId: `${this.gameManager.gameData.you.styles.legs}`,
    });
    this.characterSprite.x = this.container.worldWidth! / 2;
    this.characterSprite.y = this.container.worldHeight! / 2;

    this.lerpWorldX = -(this.characterWorldX - this.container.worldWidth! / 2);
    this.lerpWorldY = -(this.characterWorldY - this.container.worldWidth! / 2);

    this.mapContainer.addChild(this.mapBgContainer);
    this.mapContainer.addChild(this.mapSpecialContainer);
    this.mapContainer.addChild(this.mapNPCContainer);
    this.mapContainer.addChild(this.mapBuildingContainer);
    this.container.addChild(this.mapContainer);
    this.mapContainer.addChild(this.characterSprite.getView());
    this.characterSprite.initSprite().then(() => {
      this.characterSprite.setWidth(0.75);
    });

    this.mapSpecialContainer.zIndex = 25;
    this.characterSprite.getView().zIndex = 40;
    this.mapNPCContainer.zIndex = 30;
    this.mapBuildingContainer.zIndex = 20;
    this.mapContainer.zIndex = 15;

    this.container.sortChildren();
    this.updateChunks();

    this.inBuilding = MapBuildingPosition.outside;
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
  async updateChunks(): Promise<void> {
    const { worldWidth, worldHeight } = this.container!;
    const totalVisibleSprites = Math.ceil(worldWidth * worldHeight);
    const remainingAvailableSprites =
      MapScreen.SPRITE_SIZE - totalVisibleSprites;
    const additionalLoadAllDirections = MapScreen.calculateMarginSize(
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
    } else {
      setTimeout(() => this.updateSpecials());
    }

    // load all directions
    for (let i = 0; i < 9; i++) {
      const x = this.chunkX + (i % 3) - 1;
      const y = this.chunkY + Math.floor(i / 3) - 1;
      if (`${x},${y}` in this.chunks) continue;
      const chunk = Assets.get<MapData>(`map/${x},${y}`) ?? null;
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

    const { x: globalStartX, y: globalStartY } = this.getChunkGlobalPosition(
        this.chunkX,
        this.chunkY,
        relativeStartX,
        relativeStartY,
      ),
      { x: globalEndX, y: globalEndY } = this.getChunkGlobalPosition(
        this.chunkX,
        this.chunkY,
        relativeEndX,
        relativeEndY,
      );
    const exists = new Set<string>();
    const deleteExcessSprites = (container: Container, i: number) => {
      const sprite = container.children[i];
      if (
        sprite.x < globalStartX ||
        sprite.x > globalEndX ||
        sprite.y < globalStartY ||
        sprite.y > globalEndY
      ) {
        container.removeChildAt(i);
        sprite.destroy();
      } else {
        exists.add(`${sprite.x},${sprite.y}`);
      }
    };
    for (const [, container] of this.textureParticleContainerMap) {
      for (let i = container.children.length - 1; i >= 0; i--) {
        deleteExcessSprites(container, i);
      }
    }
    for (let y = relativeStartY; y < relativeEndY; y++) {
      for (let x = relativeStartX; x < relativeEndX; x++) {
        this.createTileSprite(x, y, exists);
      }
    }
  }

  createTileSprite(x: number, y: number, exists: Set<string>) {
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
      if (exists.has(`${globalX},${globalY}`)) return;
      const offsetX = globalX - newChunkBaseGlobalX,
        offsetY = globalY - newChunkBaseGlobalY;
      const tileIndex = offsetY * MAP_SIZE + offsetX,
        tile = chunk.tiles[tileIndex];
      const sprite = this.getSpriteFromTile(tile);
      if (sprite.texture === Texture.EMPTY) {
        sprite.destroy();
        return;
      }
      sprite.x = globalX;
      sprite.y = globalY;
      sprite.width = 1;
      sprite.height = 1;
      this.addSpriteParticle(sprite);
    }
  }

  /**
   * Updates the special sprites on the map.
   *
   * These include:
   * - buildings
   * - backgrounds
   * - treasure
   */
  updateSpecials(): void {
    for (const removed of this.mapSpecialContainer.removeChildren()) {
      removed.destroy();
    }
    for (let i = 0; i < 9; i++) {
      const x = this.chunkX + (i % 3) - 1;
      const y = this.chunkY + Math.floor(i / 3) - 1;
      this.updateSpecialsChunk(x, y);
    }
  }

  updateSpecialsChunk(chunkX: number, chunkY: number): void {
    const chunkData = Assets.get<MapSpecialData | null>(
      `map/special/${chunkX},${chunkY}`,
    );
    if (!chunkData) return;

    const { boxes, cutscenes, npcs } = chunkData;
    for (const box of boxes ?? []) {
      const { from, to, type } = box;
      if (from === null || to === null) continue;
      if (type === "building") {
        const width = to[0] - from[0],
          height = to[1] - from[1];
        const buildingSprite = new Sprite(
          Assets.get(`icon/structure/${box.image}`),
        );
        const { x, y } = this.getChunkGlobalPosition(
          chunkX,
          chunkY,
          from[0],
          from[1],
        );
        buildingSprite.width = width;
        buildingSprite.height = height;
        buildingSprite.x = x;
        buildingSprite.y = y;
        buildingSprite.zIndex = 50;
        this.mapSpecialContainer.addChild(buildingSprite);

        // check for background fill
        if (!box.background_tile) continue;
        for (let y = from[1]; y <= to[1]; y++) {
          for (let x = from[0]; x <= to[0]; x++) {
            const sprite = this.getSpriteFromTile(
              mapTileStrings[box.background_tile],
            );
            sprite.width = 1;
            sprite.height = 1;
            const { x: calcX, y: calcY } = this.getChunkGlobalPosition(
              chunkX,
              chunkY,
              x,
              y,
            );
            sprite.x = calcX;
            sprite.y = calcY;
            this.mapSpecialContainer.addChild(sprite);
          }
        }
      }
    }
    for (const cutsceneId in cutscenes ?? {}) {
      if (this.gameManager.gameData.cutscenes.has(cutsceneId)) continue;
      if (this.chunkX !== chunkX || this.chunkY !== chunkY) continue;
      const cutscene = cutscenes![cutsceneId];
      this.gameManager.applyCutsceneData(cutscene.actions, cutsceneId);
      break;
    }
    for (const npcId in npcs ?? {}) {
      this.addNPC(npcId, npcs![npcId], this.mapNPCContainer);
    }
  }

  addNPC(npcId: string, npcData: NPCData, container: Container): void {
    if (this.gameManager.gameData.isNPCinFriendGroup(npcId)) return;
    if (this.gameManager.gameData.specialNPCs[npcId]) {
      const npc = this.gameManager.gameData.specialNPCs[npcId];
      if (npc.isDead || npc.hp <= 0) return;
    }
    if (this.mapNPCS[npcId]) return;
    let npc: Character;
    let position: [number, number];
    if (this.gameManager.gameData.specialNPCs[npcId]) {
      npc = this.gameManager.gameData.specialNPCs[npcId];
      position = npc.position;
    } else {
      const { types, gender, knownMoves, stats, colors, styles, type } =
        npcData;
      let { love, hp } = npcData;
      position = npcData.position;
      love = Array.isArray(love)
        ? chance.integer({ min: love[0], max: love[1] })
        : love;
      hp = Array.isArray(hp) ? chance.integer({ min: hp[0], max: hp[1] }) : hp;
      npc = Character.createRandomCharacter(love);

      npc.hp = hp ?? npc.hp;
      npc.types = types ?? npc.types;
      npc.gender = gender ?? npc.gender;
      npc.knownMoves = knownMoves ?? npc.knownMoves;
      Object.assign(npc.stats, stats ?? {});
      npc.colors = colors ?? npc.colors;
      npc.styles = styles ?? npc.styles;

      if (type === "special") {
        npc.id = npcId;
        this.gameManager.gameData.specialNPCs[npcId] = npc;
      }
    }

    const npcSprite = new CharacterSprite({
      skinColor: npc.colors.skin,
      headColor: npc.colors.head,
      bodyColor: npc.colors.body,
      legColor: npc.colors.legs,
      headId: `${npc.styles.head}`,
      bodyId: `${npc.styles.body}`,
      legId: `${npc.styles.legs}`,
    });
    npc.position = position;
    npcSprite.initSprite().then(() => {
      npcSprite.setWidth(0.75);
      container.addChild(npcSprite.getView());
    });
    this.mapNPCS[npcId] = {
      character: npc,
      sprite: npcSprite,
    };
  }

  addSpriteParticle(sprite: Sprite) {
    const container = this.textureParticleContainerMap.get(sprite.texture);
    if (container) {
      container.addChild(sprite);
    } else {
      const newContainer = new ParticleContainer(MapScreen.SPRITE_SIZE);
      newContainer.addChild(sprite);
      this.textureParticleContainerMap.set(sprite.texture, newContainer);
      this.mapBgContainer.addChild(newContainer);
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

  getSpriteFromTile(tile: MapTile): Sprite {
    let sprite = new Sprite();
    switch (tile) {
      case MapTile.bridge:
        sprite.texture = Assets.get("icon/map/wood")!;
        break;
      case MapTile.dirtRoad:
        sprite.texture = Assets.get("icon/map/dirt")!;
        break;
      case MapTile.grass:
        sprite.texture = Assets.get("icon/map/grass")!;
        break;
      case MapTile.pavedRoad:
        sprite.texture = Assets.get("icon/map/rock")!;
        break;
      case MapTile.sand:
        sprite.texture = Assets.get("icon/map/sand")!;
        break;
      case MapTile.tallgrass:
        sprite.texture = Assets.get("icon/map/thick_grass")!;
        break;
      case MapTile.water: {
        sprite.destroy();
        let oldTexture: Texture = Assets.get("icon/map/water1");
        sprite = new AnimatedSprite({
          frames: [
            Assets.get("icon/map/water1")!,
            Assets.get("icon/map/water2")!,
          ],
          frameDuration: 1000,
          loop: true,
          onTextureChange: (texture) => {
            if (oldTexture !== texture) {
              oldTexture = texture;
              const container = sprite.parent;
              if (container instanceof ParticleContainer) {
                this.textureParticleContainerMap
                  .get(texture)
                  ?.removeChild(sprite);
                this.addSpriteParticle(sprite);
              }
            }
          },
        });
        break;
      }
      case MapTile.glass:
        sprite.texture = Assets.get("icon/map/glass")!;
        break;
      case MapTile.tile:
        sprite.texture = Assets.get("icon/map/tile")!;
        break;
      case MapTile.stonebrick:
        sprite.texture = Assets.get("icon/map/stonebrick")!;
        break;
      case MapTile.interactable:
        sprite.texture = Texture.WHITE;
        break;
      case MapTile.building:
        sprite.texture = Texture.WHITE;
        break;
      default:
        sprite.texture = Texture.EMPTY;
    }
    return sprite;
  }

  /**
   * Calculates the margin size for a rectangle given available margin area.
   *
   * @param innerWidth The width of the rectangle.
   * @param innerHeight The height of the rectangle.
   * @param marginArea The available margin area.
   */
  static calculateMarginSize(
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

  getSpeed(): number {
    const base = 0.006;
    const mult =
      this.keysDown.has("ShiftLeft") || this.keysDown.has("ShiftRight") ? 2 : 1;
    return base * mult;
  }

  update(delta: number): void {
    const targetX = -(this.characterWorldX - this.container.worldWidth! / 2);
    const targetY = -(this.characterWorldY - this.container.worldHeight! / 2);
    this.lerpWorldX = lerp(this.lerpWorldX, targetX, 0.2);
    this.lerpWorldY = lerp(this.lerpWorldY, targetY, 0.2);
    this.mapContainer.x = this.lerpWorldX;
    this.mapContainer.y = this.lerpWorldY;
    this.characterSprite.x = this.characterWorldX;
    this.characterSprite.y = this.characterWorldY;
    this.characterSprite.update(delta);

    const specialAlphaTarget =
      this.inBuilding === MapBuildingPosition.inside ? 0 : 1;
    const bgAlphaTarget =
      this.inBuilding === MapBuildingPosition.inside ? 0.25 : 1;
    const buildingAlphaTarget =
      this.inBuilding === MapBuildingPosition.inside ? 1 : 0;
    this.mapSpecialContainer.alpha = lerp(
      this.mapSpecialContainer.alpha,
      specialAlphaTarget,
      0.1,
    );
    this.mapBgContainer.alpha = lerp(
      this.mapBgContainer.alpha,
      bgAlphaTarget,
      0.1,
    );
    this.mapBuildingContainer.alpha = lerp(
      this.mapBuildingContainer.alpha,
      buildingAlphaTarget,
      0.1,
    );

    this.updateBuildings();
    this.animateNPCs(delta);
    this.movePlayer(delta);
  }

  updateBuildings() {
    const chunkData = Assets.get<MapSpecialData>(
      `map/special/${this.chunkX},${this.chunkY}`,
    );
    if (!chunkData) return;
    let resultDistance = Infinity;
    let resultSize = this.baseSize;
    let resultBox: MapSpecialBuildingBox | null = null;
    for (const box of chunkData.boxes ?? []) {
      if (box.type !== "building") continue;
      const entry = box.entry;
      const inside = box.inside!;
      if (!entry) continue;
      const center = [(entry[0] + entry[2]) / 2, (entry[1] + entry[3]) / 2];
      const distance = Math.sqrt(
        (center[0] - this.characterChunkX) ** 2 +
          (center[1] - this.characterChunkY) ** 2,
      );
      if (distance > 10 && this.inBuilding !== MapBuildingPosition.inside) {
        if (this.mapBuildingContainer.children.length) {
          const removed = this.mapBuildingContainer.removeChildren();
          for (const sprite of removed) sprite.destroy({ children: true });
        }
        continue;
      }
      if (distance < resultDistance) {
        resultDistance = distance;
        resultSize = this.baseSize / (Math.max(10 - resultDistance, 1) / 4);
        resultBox = box;
        if (
          this.characterChunkX >= inside[0] &&
          this.characterChunkX <= inside[2] &&
          this.characterChunkY >= inside[1] &&
          this.characterChunkY <= inside[3]
        ) {
          this.inBuilding = MapBuildingPosition.inside;
        } else if (
          this.characterChunkX >= entry[0] &&
          this.characterChunkX <= entry[2] &&
          this.characterChunkY >= entry[1] &&
          this.characterChunkY <= entry[3]
        ) {
          this.inBuilding = MapBuildingPosition.entering;
          this.ignoreCollisionBox = inside;
        } else {
          if (this.inBuilding === MapBuildingPosition.entering) {
            this.inBuilding = MapBuildingPosition.outside;
          }
        }
      }
    }
    if (resultBox) {
      this.currentSize = lerp(
        this.currentSize,
        constrain(resultSize, this.baseSize / 2, this.baseSize),
        0.1,
      );
      this.container.setWorldSize(this.currentSize);
      if (!this.mapBuildingContainer.children.length) {
        this.loadBuilding(resultBox);
      }
    }
  }

  loadBuilding(resultBox: MapSpecialBuildingBox) {
    const buildingId = resultBox.building_id!;
    const buildingData = Assets.get<BuildingSpecialData>(
      `building/special/${buildingId}`,
    );
    const mapBuildingData = Assets.get<MapData>(`building/${buildingId}`);
    const { width, height, tiles } = mapBuildingData;
    const tileContainer = new Container();
    const chunkEntryPos = resultBox.entry!;
    const buildingEntryPos = buildingData.entry;
    // calculate offset between local building and chunk position
    const offsetX = chunkEntryPos[0] - buildingEntryPos[0];
    const offsetY = chunkEntryPos[1] - buildingEntryPos[1];
    // calculate offset between entry and width/height
    const { x, y } = this.getChunkGlobalPosition(
      this.chunkX,
      this.chunkY,
      offsetX,
      offsetY,
    );
    tileContainer.x = x;
    tileContainer.y = y;
    this.mapBuildingContainer.addChild(tileContainer);
    this.mapBuildingData = {
      offsetX,
      offsetY,
      data: mapBuildingData,
    };
    // add tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y * width + x];
        const sprite = this.getSpriteFromTile(tile);
        if (sprite.texture === Texture.EMPTY) {
          sprite.destroy();
          continue;
        }
        sprite.x = x;
        sprite.y = y;
        sprite.width = 1;
        sprite.height = 1;
        tileContainer.addChild(sprite);
      }
    }

    const npcs = buildingData.npcs;
    for (const id in npcs) {
      this.addNPC(id, npcs[id], tileContainer);
    }
  }

  animateNPCs(delta: number): void {
    for (const id in this.mapNPCS) {
      const { sprite, character } = this.mapNPCS[id];
      if (sprite.mainContainer.destroyed) {
        delete this.mapNPCS[id];
        continue;
      }
      sprite.x = character.position[0];
      sprite.y = character.position[1];
      sprite.update(delta);
    }
  }

  animatePlayer(delta: number): void {
    this.characterSprite.update(delta);
    switch (this.direction) {
      case Direction.up:
      case Direction.upLeft:
      case Direction.upRight:
        this.characterSprite.facingForward = false;
        this.characterSprite.updateSkinColor(
          this.gameManager.gameData.you.colors.skin,
        );
        break;
      case Direction.down:
      case Direction.downLeft:
      case Direction.downRight:
        this.characterSprite.facingForward = true;
        this.characterSprite.updateSkinColor(
          this.gameManager.gameData.you.colors.skin,
        );
        break;
    }
  }

  private movePlayer(delta: number) {
    if (this.paused) return;
    this.animatePlayer(delta);
    if (this.direction !== Direction.none) {
      this.characterSprite.setAnimation(CharacterSpriteAnimation.running);
      this.characterSprite.animationContext.direction = this.direction;
      const distance = this.getSpeed() * delta;
      const angleMult = 1 / Math.sqrt(2);
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
          this.moveCharacterX(-distance * angleMult);
          this.moveCharacterY(-distance * angleMult);
          break;
        case Direction.upRight:
          this.moveCharacterY(-distance * angleMult);
          this.moveCharacterX(distance * angleMult);
          break;
        case Direction.downLeft:
          this.moveCharacterY(distance * angleMult);
          this.moveCharacterX(-distance * angleMult);
          break;
        case Direction.downRight:
          this.moveCharacterY(distance * angleMult);
          this.moveCharacterX(distance * angleMult);
          break;
      }
      this.updateChunks();
    } else {
      this.characterSprite.setAnimation(CharacterSpriteAnimation.idle);
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
    const testChunkNumber = this.getGlobalChunkNumber(x, y);
    if (!this.chunks[testChunkNumber]) return; // chunk doesn't exist (out of bounds)
    if (this.handleCollisions(x, y)) return;

    // checks pass, move character
    this.characterWorldX = x;
    this.characterWorldY = y;
  }

  handleCollisions(x: number, y: number): boolean {
    // limits checking when changing positions
    if (
      Math.floor(x) === this.collisionCacheX &&
      Math.floor(y) === this.collisionCacheY
    ) {
      return false;
    }
    const testChunkNumber = this.getGlobalChunkNumber(x, y),
      [testChunkX, testChunkY] = testChunkNumber.split(",").map(Number);
    const { x: localX, y: localY } = this.getLocalChunkPosition(x, y);
    let newTile: MapTile;
    let currentTile: MapTile;
    if (this.inBuilding !== MapBuildingPosition.inside) {
      newTile = this.getLocalChunkTile(localX, localY, testChunkX, testChunkY);
      currentTile = this.getLocalChunkTile(
        this.characterChunkX,
        this.characterChunkY,
      );
      // check for ignore
      if (this.ignoreCollisionBox) {
        const [x1, y1, x2, y2] = this.ignoreCollisionBox;
        if (localX >= x1 && localX <= x2 && localY >= y1 && localY <= y2) {
          return false;
        }
      }
    } else {
      const { offsetX, offsetY, data } = this.mapBuildingData!;
      // check for building bounds
      if (
        localX - offsetX < 0 ||
        localX - offsetX >= data.width ||
        localY - offsetY < 0 ||
        localY - offsetY >= data.height
      ) {
        return true;
      }

      // get tile
      newTile =
        data.tiles[
          (Math.floor(localY) - offsetY) * data.width +
            (Math.floor(localX) - offsetX)
        ];
      currentTile =
        data.tiles[
          Math.floor(
            (Math.floor(this.characterChunkY) - offsetY) * data.width +
              (Math.floor(this.characterChunkX) - offsetX),
          )
        ];
    }
    if (this.handleBasicCollisions(newTile, currentTile)) return true;

    // special checks
    if (
      this.handleSpecialtriggersChunk(
        testChunkNumber,
        x,
        y,
        newTile,
        currentTile,
      )
    ) {
      return true;
    }
    if (this.handleSpecialtriggersDefault(x, y, newTile, currentTile)) {
      return true;
    }

    // update cache
    this.collisionCacheX = Math.floor(x);
    this.collisionCacheY = Math.floor(y);
    return false;
  }

  handleBasicCollisions(newTile: MapTile, currentTile: MapTile): boolean {
    if (!newTile) return true;
    if (newTile === MapTile.unknown) return true;
    if (newTile === MapTile.water) {
      return currentTile !== MapTile.water;
    }
    if (newTile === MapTile.building) {
      // to prevent players from being stuck if they save the game while in a building
      // TODO: make sure players either load back into the building, or are booted outside
      return currentTile !== MapTile.building;
    }
    if (newTile === MapTile.glass) return true;
    if (newTile === MapTile.stonebrick) return true;
    return false;
  }

  handleSpecialtriggersDefault(
    worldX: number,
    worldY: number,
    newTile: MapTile,
    currentTile: MapTile,
  ): boolean {
    const chunkData = Assets.get<MapSpecialData>("map/special/default");
    return this.handleSpecialTriggers(
      worldX,
      worldY,
      newTile,
      currentTile,
      chunkData,
    );
  }

  handleSpecialtriggersChunk(
    testChunkNumber: string,
    worldX: number,
    worldY: number,
    newTile: MapTile,
    currentTile: MapTile,
  ): boolean {
    const chunkData = Assets.get<MapSpecialData | null>(
      `map/special/${testChunkNumber}`,
    );
    return this.handleSpecialTriggers(
      worldX,
      worldY,
      newTile,
      currentTile,
      chunkData,
    );
  }

  handleSpecialTriggers(
    worldX: number,
    worldY: number,
    newTile: MapTile,
    currentTile: MapTile,
    chunkData?: MapSpecialData | null,
  ): boolean {
    const { x: chunkX, y: chunkY } = this.getLocalChunkPosition(worldX, worldY);
    if (chunkData) {
      const { boxes } = chunkData;
      for (const box of boxes ?? []) {
        const { type } = box;
        let { from, to } = box;
        if (from === null || to === null) {
          from = [chunkX, chunkY];
          to = [chunkX, chunkY];
        }
        if (
          chunkX >= from[0] &&
          chunkX <= to[0] &&
          chunkY >= from[1] &&
          chunkY <= to[1]
        ) {
          if (type === "walk_action" || type === "interact_action") {
            const { if: condition, unless, action } = box;
            let passesCondition = true;
            if (condition) {
              const {
                new_tile: conditionNewTile,
                current_tile: conditionCurrentTile,
                chance: conditionChance,
              } = condition;
              if (typeof conditionChance === "number") {
                if (!chance.bool({ likelihood: conditionChance * 100 })) {
                  passesCondition = false;
                }
              }
              if (
                conditionNewTile &&
                mapTileStrings[conditionNewTile] !== newTile
              ) {
                passesCondition = false;
              }
              if (
                conditionCurrentTile &&
                mapTileStrings[conditionCurrentTile] !== currentTile
              ) {
                passesCondition = false;
              }
            }
            if (unless) {
              const {
                new_tile: unlessNewTile,
                current_tile: unlessCurrentTile,
              } = unless;
              if (unlessNewTile && mapTileStrings[unlessNewTile] === newTile) {
                passesCondition = false;
              }
              if (
                unlessCurrentTile &&
                mapTileStrings[unlessCurrentTile] === currentTile
              ) {
                passesCondition = false;
              }
            }
            if (passesCondition) {
              if (action.type === "enter_battle") {
                this.characterWorldX = Math.floor(this.characterWorldX) + 0.5;
                this.characterWorldY = Math.floor(this.characterWorldY) + 0.5;
                this.eventNotifier.dispatchEvent(
                  new CustomEvent<MapSpecialActionBattle>(
                    MapScreenEvents.battleStart,
                    { detail: action },
                  ),
                );
                this.paused = true;
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  notify<T>(event: MapScreenEvents, data: T): void {
    this.eventNotifier.dispatchEvent(
      new CustomEvent<T>(event, { detail: data }),
    );
  }

  getUI(): UIOutput | null {
    return {
      main: <MapScreenContent state={this} />,
    };
  }
}
