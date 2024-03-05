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
    this.linkSprites(this.thighRightSprite, this.legRightSprite, this.legRightLink);
    this.linkSprites(this.thighLeftSprite, this.legLeftSprite, this.legLeftLink);
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
    const partList: [keyof BaseSprite, string, number, boolean?][] = [
      ["frontHead", this.headId, this.headColor, true],
      ["backHead", this.headId, this.headColor, true],
      ["frontBody", this.bodyId, this.bodyColor],
      ["backBody", this.bodyId, this.bodyColor],
      ["frontRightThigh", this.legId, this.legColor],
      ["backRightThigh", this.legId, this.legColor],
      ["frontLeftThigh", this.legId, this.legColor],
      ["backLeftThigh", this.legId, this.legColor],
      ["frontRightLeg", this.legId, this.legColor],
      ["backRightLeg", this.legId, this.legColor],
      ["frontLeftLeg", this.legId, this.legColor],
      ["backLeftLeg", this.legId, this.legColor],
      ["frontRightShoulder", this.bodyId, this.bodyColor],
      ["backRightShoulder", this.bodyId, this.bodyColor],
      ["frontLeftShoulder", this.bodyId, this.bodyColor],
      ["backLeftShoulder", this.bodyId, this.bodyColor],
      ["frontRightArm", this.bodyId, this.bodyColor],
      ["backRightArm", this.bodyId, this.bodyColor],
      ["frontLeftArm", this.bodyId, this.bodyColor],
      ["backLeftArm", this.bodyId, this.bodyColor],
    ];
    [
      this.headFront,
      this.headBack,
      this.bodyFront,
      this.bodyBack,
      this.thighRightFront,
      this.thighRightBack,
      this.thighLeftFront,
      this.thighLeftBack,
      this.legRightFront,
      this.legRightBack,
      this.legLeftFront,
      this.legLeftBack,
      this.shoulderRightFront,
      this.shoulderRightBack,
      this.shoulderLeftFront,
      this.shoulderLeftBack,
      this.armRightFront,
      this.armRightBack,
      this.armLeftFront,
      this.armLeftBack,
    ] = await Promise.all(
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

    this.headSprite.texture = this.headFront;
    this.bodySprite.texture = this.bodyFront;
    this.shoulderRightSprite.texture = this.shoulderRightFront;
    this.shoulderLeftSprite.texture = this.shoulderLeftFront;
    this.armRightSprite.texture = this.armRightFront;
    this.armLeftSprite.texture = this.armLeftFront;
    this.thighRightSprite.texture = this.thighRightFront;
    this.thighLeftSprite.texture = this.thighLeftFront;
    this.legRightSprite.texture = this.legRightFront;
    this.legLeftSprite.texture = this.legLeftFront;

    this.setInitialPositions();
  }
}
