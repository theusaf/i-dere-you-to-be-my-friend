import { Container, Sprite, Texture } from "pixi.js";
import { BaseSprite, recolorSprite } from "../game/util/sprite";

export interface CharacterSpriteOpts {
  skinColor: number;
  headColor: number;
  headId: string;
  bodyColor: number;
  bodyId: string;
  legColor: number;
  legId: string;
}

type PartConstructionList = [keyof BaseSprite, string, number, boolean?][];

/**
 * A character sprite. The various parts are connected together and can be rotated.
 *
 * The sprite's origin is at the feet.
 */
export class CharacterSprite {
  skinColor: number;
  headColor: number;
  headId: string;
  bodyColor: number;
  bodyId: string;
  legColor: number;
  legId: string;

  mainContainer: Container;
  facingForward: boolean = true;

  // Note: The positional (right, left) parts are based on the character's right and left when viewning the character from the front.
  // When the character is viewed from the back, right and left are not actually accurate.
  headFront: Texture | null = null;
  headBack: Texture | null = null;
  bodyFront: Texture | null = null;
  bodyBack: Texture | null = null;
  thighRightFront: Texture | null = null;
  thighRightBack: Texture | null = null;
  thighLeftFront: Texture | null = null;
  thighLeftBack: Texture | null = null;
  legRightFront: Texture | null = null;
  legRightBack: Texture | null = null;
  legLeftFront: Texture | null = null;
  legLeftBack: Texture | null = null;
  shoulderRightFront: Texture | null = null;
  shoulderRightBack: Texture | null = null;
  shoulderLeftFront: Texture | null = null;
  shoulderLeftBack: Texture | null = null;
  armRightFront: Texture | null = null;
  armRightBack: Texture | null = null;
  armLeftFront: Texture | null = null;
  armLeftBack: Texture | null = null;

  headSprite: Sprite;
  bodySprite: Sprite;
  shoulderRightSprite: Sprite;
  shoulderLeftSprite: Sprite;
  armRightSprite: Sprite;
  armLeftSprite: Sprite;
  thighRightSprite: Sprite;
  thighLeftSprite: Sprite;
  legRightSprite: Sprite;
  legLeftSprite: Sprite;

  armRightLink: Container;
  armLeftLink: Container;
  legRightLink: Container;
  legLeftLink: Container;

  constructor({
    skinColor,
    headColor,
    headId,
    bodyColor,
    bodyId,
    legColor,
    legId,
  }: CharacterSpriteOpts) {
    this.skinColor = skinColor;
    this.headColor = headColor;
    this.headId = headId;
    this.bodyColor = bodyColor;
    this.bodyId = bodyId;
    this.legColor = legColor;
    this.legId = legId;

    this.mainContainer = new Container();
    this.mainContainer.sortableChildren = true;

    this.headSprite = new Sprite();
    this.bodySprite = new Sprite();
    this.shoulderRightSprite = new Sprite();
    this.shoulderLeftSprite = new Sprite();
    this.armRightSprite = new Sprite();
    this.armLeftSprite = new Sprite();
    this.thighRightSprite = new Sprite();
    this.thighLeftSprite = new Sprite();
    this.legRightSprite = new Sprite();
    this.legLeftSprite = new Sprite();

    this.mainContainer.addChild(this.headSprite);
    this.mainContainer.addChild(this.bodySprite);
    this.mainContainer.addChild(this.shoulderRightSprite);
    this.mainContainer.addChild(this.shoulderLeftSprite);
    this.mainContainer.addChild(this.thighRightSprite);
    this.mainContainer.addChild(this.thighLeftSprite);

    this.armRightLink = new Container();
    this.armLeftLink = new Container();
    this.legRightLink = new Container();
    this.legLeftLink = new Container();

    this.mainContainer.addChild(this.armRightLink);
    this.mainContainer.addChild(this.armLeftLink);
    this.mainContainer.addChild(this.legRightLink);
    this.mainContainer.addChild(this.legLeftLink);
  }

  get x(): number {
    return this.mainContainer.x;
  }
  set x(x: number) {
    this.mainContainer.x = x;
  }

  get y(): number {
    return this.mainContainer.y;
  }
  set y(y: number) {
    this.mainContainer.y = y;
  }

  getView(): Container {
    return this.mainContainer;
  }

  setScale(scale: number): void {
    this.mainContainer.scale.set(scale);
  }

  setHeight(height: number): void {
    const currentHeight = this.mainContainer.height;
    const ratio = height / currentHeight;
    this.setScale(ratio);
  }

  setWidth(width: number): void {
    const currentWidth = this.mainContainer.width;
    const ratio = width / currentWidth;
    this.setScale(ratio);
  }

  setInitialPositions(): void {
    this.headSprite.anchor.set(0.5, 1);
    this.bodySprite.anchor.set(0.5, 0);
    this.shoulderRightSprite.anchor.set(0.5, 0);
    this.shoulderLeftSprite.anchor.set(0.5, 0);
    this.armRightSprite.anchor.set(0.5, 0);
    this.armLeftSprite.anchor.set(0.5, 0);
    this.thighRightSprite.anchor.set(0.5, 0);
    this.thighLeftSprite.anchor.set(0.5, 0);
    this.legRightSprite.anchor.set(0.5, 0);
    this.legLeftSprite.anchor.set(0.5, 0);

    this.headSprite.zIndex = 10;
    this.bodySprite.zIndex = 8;
    this.shoulderRightSprite.zIndex = 9;
    this.shoulderLeftSprite.zIndex = 9;
    this.armRightSprite.zIndex = 9;
    this.armLeftSprite.zIndex = 9;
    this.thighRightSprite.zIndex = 7;
    this.thighLeftSprite.zIndex = 7;
    this.legRightSprite.zIndex = 7;
    this.legLeftSprite.zIndex = 7;

    // unfortunately, PIXI doesn't really have good dynamic sizing of containers and sprites
    // the following uses hard-coded values to position the sprites
    this.bodySprite.y = -135;
    this.headSprite.y = this.bodySprite.y + 8;
    this.shoulderRightSprite.position.set(
      this.bodySprite.x - 40,
      this.bodySprite.y,
    );
    this.shoulderLeftSprite.position.set(
      this.bodySprite.x + 40,
      this.bodySprite.y,
    );
    this.thighRightSprite.position.set(this.bodySprite.x - 20, -64);
    this.thighLeftSprite.position.set(this.bodySprite.x + 18, -64);

    this.linkSprites(
      this.shoulderRightSprite,
      this.armRightSprite,
      this.armRightLink,
    );
    this.linkSprites(
      this.shoulderLeftSprite,
      this.armLeftSprite,
      this.armLeftLink,
    );
    this.linkSprites(
      this.thighRightSprite,
      this.legRightSprite,
      this.legRightLink,
    );
    this.linkSprites(
      this.thighLeftSprite,
      this.legLeftSprite,
      this.legLeftLink,
    );
  }

  linkSprites(origin: Sprite, connecting: Sprite, via: Container): void {
    const { height, x, y } = origin;
    via.addChild(connecting);
    via.position.set(x, y);
    connecting.position.set(0, height);
  }

  update(_?: number): void {
    this.armRightLink.rotation = this.shoulderRightSprite.rotation;
    this.armLeftLink.rotation = this.shoulderLeftSprite.rotation;
    this.legRightLink.rotation = this.bodySprite.rotation;
    this.legLeftLink.rotation = this.bodySprite.rotation;
  }

  async initSprite(): Promise<void> {
    await this.updateSkinColor(this.skinColor);
    this.setInitialPositions();
  }

  async updateSkinColor(color: number): Promise<void> {
    this.skinColor = color;
    await Promise.all([
      this.updateLegTexture(this.legId, this.legColor),
      this.updateBodyTexture(this.bodyId, this.bodyColor),
      this.updateHeadTexture(this.headId, this.headColor),
    ]);
  }

  async updateLegTexture(id: string, color: number): Promise<void> {
    this.legId = id;
    this.legColor = color;
    const partList: PartConstructionList = [
      ["frontRightThigh", this.legId, this.legColor],
      ["backRightThigh", this.legId, this.legColor],
      ["frontLeftThigh", this.legId, this.legColor],
      ["backLeftThigh", this.legId, this.legColor],
      ["frontRightLeg", this.legId, this.legColor],
      ["backRightLeg", this.legId, this.legColor],
      ["frontLeftLeg", this.legId, this.legColor],
      ["backLeftLeg", this.legId, this.legColor],
    ];
    const [
      thighRightFront,
      thighRightBack,
      thighLeftFront,
      thighLeftBack,
      legRightFront,
      legRightBack,
      legLeftFront,
      legLeftBack,
    ] = await this.mapAndRecolor(partList);
    this.thighRightFront = thighRightFront;
    this.thighRightBack = thighRightBack;
    this.thighLeftFront = thighLeftFront;
    this.thighLeftBack = thighLeftBack;
    this.legRightFront = legRightFront;
    this.legRightBack = legRightBack;
    this.legLeftFront = legLeftFront;
    this.legLeftBack = legLeftBack;
    this.updateSpriteTextures(this.thighRightSprite, [
      thighRightFront,
      thighRightBack,
    ]);
    this.updateSpriteTextures(this.thighLeftSprite, [
      thighLeftFront,
      thighLeftBack,
    ]);
    this.updateSpriteTextures(this.legRightSprite, [
      legRightFront,
      legRightBack,
    ]);
    this.updateSpriteTextures(this.legLeftSprite, [legLeftFront, legLeftBack]);
  }

  async updateBodyTexture(id: string, color: number): Promise<void> {
    this.bodyId = id;
    this.bodyColor = color;
    const partList: PartConstructionList = [
      ["frontBody", this.bodyId, this.bodyColor],
      ["backBody", this.bodyId, this.bodyColor],
      ["frontRightShoulder", this.bodyId, this.bodyColor],
      ["backRightShoulder", this.bodyId, this.bodyColor],
      ["frontLeftShoulder", this.bodyId, this.bodyColor],
      ["backLeftShoulder", this.bodyId, this.bodyColor],
      ["frontRightArm", this.bodyId, this.bodyColor],
      ["backRightArm", this.bodyId, this.bodyColor],
      ["frontLeftArm", this.bodyId, this.bodyColor],
      ["backLeftArm", this.bodyId, this.bodyColor],
    ];
    const [
      bodyFront,
      bodyBack,
      shoulderRightFront,
      shoulderRightBack,
      shoulderLeftFront,
      shoulderLeftBack,
      armRightFront,
      armRightBack,
      armLeftFront,
      armLeftBack,
    ] = await this.mapAndRecolor(partList);
    this.bodyFront = bodyFront;
    this.bodyBack = bodyBack;
    this.shoulderRightFront = shoulderRightFront;
    this.shoulderRightBack = shoulderRightBack;
    this.shoulderLeftFront = shoulderLeftFront;
    this.shoulderLeftBack = shoulderLeftBack;
    this.armRightFront = armRightFront;
    this.armRightBack = armRightBack;
    this.armLeftFront = armLeftFront;
    this.armLeftBack = armLeftBack;
    this.updateSpriteTextures(this.bodySprite, [bodyFront, bodyBack]);
    this.updateSpriteTextures(this.shoulderRightSprite, [
      shoulderRightFront,
      shoulderRightBack,
    ]);
    this.updateSpriteTextures(this.shoulderLeftSprite, [
      shoulderLeftFront,
      shoulderLeftBack,
    ]);
    this.updateSpriteTextures(this.armRightSprite, [
      armRightFront,
      armRightBack,
    ]);
    this.updateSpriteTextures(this.armLeftSprite, [armLeftFront, armLeftBack]);
  }

  async updateHeadTexture(id: string, color: number): Promise<void> {
    this.headId = id;
    this.headColor = color;
    const partList: PartConstructionList = [
      ["frontHead", this.headId, this.headColor, true],
      ["backHead", this.headId, this.headColor, true],
    ];
    const [front, back] = await this.mapAndRecolor(partList);
    this.headFront = front;
    this.headBack = back;
    this.updateSpriteTextures(this.headSprite, [front, back]);
  }

  updateSpriteTextures(sprite: Sprite, textures: [Texture, Texture]): void {
    const checkTexture = this.facingForward ? textures[0] : textures[1];
    if (sprite.texture !== checkTexture) {
      sprite.texture = checkTexture;
    }
  }

  mapAndRecolor(partList: PartConstructionList): Promise<Texture[]> {
    return Promise.all(
      partList.map(([part, id, color, treatWhiteAsMain]) =>
        recolorSprite({
          id,
          part,
          mainColor: color,
          skinColor: this.skinColor,
          treatWhiteAsMain: treatWhiteAsMain ?? false,
        }),
      ),
    );
  }
}
