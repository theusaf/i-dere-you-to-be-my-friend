import { Container, Sprite, Texture } from "pixi.js";
import { BaseSprite, recolorSprite } from "../game/util/sprite";
import { GameAnimation, easeMethod, lerp } from "../game/util/animation";
import { Direction } from "../game/util/direction";

export interface CharacterSpriteOpts {
  skinColor: number;
  headColor: number;
  headId: string;
  bodyColor: number;
  bodyId: string;
  legColor: number;
  legId: string;
}

export enum CharacterSpriteAnimation {
  idle,
  pose,
  running,
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
  animationType: CharacterSpriteAnimation;
  animation: GameAnimation;
  oldAnimationType: CharacterSpriteAnimation;
  /**
   * A hacky object to store state abut the current animation
   *
   * Really not how TypeScript is supposed to be used...
   */
  animationContext: Record<string, any>;

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

    this.oldAnimationType = CharacterSpriteAnimation.idle;
    this.animationType = CharacterSpriteAnimation.idle;
    this.animation = new GameAnimation({}, {}, 0);
    this.animationContext = {};
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

    this.setZIndex();

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

  setZIndex(): void {
    this.headSprite.zIndex = 10;
    this.bodySprite.zIndex = 8;
    if (this.animationType === CharacterSpriteAnimation.running) {
      const isLeft = this.animationContext.directionMultiple === -1;
      if (this.facingForward) {
        if (isLeft) {
          this.shoulderRightSprite.zIndex = 7;
          this.armRightLink.zIndex = 7;
          this.shoulderLeftSprite.zIndex = 9;
          this.armLeftLink.zIndex = 9;
        } else {
          this.shoulderRightSprite.zIndex = 9;
          this.armRightLink.zIndex = 9;
          this.shoulderLeftSprite.zIndex = 9;
          this.armLeftLink.zIndex = 9;
        }
      } else {
        if (isLeft) {
          // left
          this.shoulderRightSprite.zIndex = 9;
          this.armRightLink.zIndex = 9;
          this.shoulderLeftSprite.zIndex = 7;
          this.armLeftLink.zIndex = 7;
        } else {
          this.shoulderRightSprite.zIndex = 7;
          this.armRightLink.zIndex = 7;
          this.shoulderLeftSprite.zIndex = 9;
          this.armLeftLink.zIndex = 9;
        }
      }
    } else {
      this.shoulderRightSprite.zIndex = 9;
      this.armRightLink.zIndex = 9;
      this.shoulderLeftSprite.zIndex = 9;
      this.armLeftLink.zIndex = 9;
    }
    if (this.facingForward) {
      this.thighRightSprite.zIndex = 7;
      this.thighLeftSprite.zIndex = 7;
      this.legRightLink.zIndex = 6;
      this.legLeftLink.zIndex = 6;
    } else {
      this.thighRightSprite.zIndex = 6;
      this.thighLeftSprite.zIndex = 6;
      this.legRightLink.zIndex = 7;
      this.legLeftLink.zIndex = 7;
    }
    this.mainContainer.sortChildren();
  }

  setAnimation(animation: CharacterSpriteAnimation): void {
    this.animationType = animation;
    this.updateAnimation(0);
  }

  updateAnimation(delta: number): void {
    if (this.oldAnimationType !== this.animationType) {
      this.oldAnimationType = this.animationType;
      switch (this.animationType) {
        case CharacterSpriteAnimation.running:
          this.setupRunningAnimation();
          break;
      }
    } else {
      switch (this.animationType) {
        case CharacterSpriteAnimation.idle:
          this.updateIdleAnimation();
          break;
        case CharacterSpriteAnimation.running:
          this.updateRunningAnimation(delta);
          break;
      }
    }
  }

  private updateRunningAnimation(delta: number) {
    this.animation.update(delta);
    const isLeft =
      this.animationContext.direction === Direction.left ||
      this.animationContext.direction === Direction.downLeft ||
      this.animationContext.direction === Direction.upLeft;
    const isRight =
      this.animationContext.direction === Direction.right ||
      this.animationContext.direction === Direction.downRight ||
      this.animationContext.direction === Direction.upRight;
    const directionMultiple = isLeft
      ? -1
      : isRight
        ? 1
        : this.animationContext.directionMultiple ?? 1;
    if (directionMultiple !== this.animationContext.directionMultiple) {
      this.animationContext.directionMultiple = directionMultiple;
    }
    this.thighRightSprite.angle =
      this.animation.currentValues.rightThigh * directionMultiple;
    this.legRightSprite.angle =
      this.animation.currentValues.rightLeg * directionMultiple;
    this.thighLeftSprite.angle =
      this.animation.currentValues.leftThigh * directionMultiple;
    this.legLeftSprite.angle =
      this.animation.currentValues.leftLeg * directionMultiple;

    this.shoulderRightSprite.angle = this.animation.currentValues.rightShoulder;
    this.armRightSprite.angle = this.animation.currentValues.rightArm;
    this.shoulderLeftSprite.angle = this.animation.currentValues.leftShoulder;
    this.armLeftSprite.angle = this.animation.currentValues.leftArm;
    if (this.animation.isDone) {
      this.setZIndex();
      const endValues = this.animation.endValues;
      const armRunningToggle = !this.animationContext.armRunningToggle;
      this.animationContext.armRunningToggle = armRunningToggle;
      this.animation.startValues = endValues;
      this.animation.endValues = {
        rightThigh: endValues.leftThigh,
        rightLeg: endValues.leftLeg,
        leftThigh: endValues.rightThigh,
        leftLeg: endValues.rightLeg,
        rightShoulder: (armRunningToggle ? 45 : 10) * directionMultiple,
        leftShoulder: (armRunningToggle ? -45 : 10) * directionMultiple,
        rightArm: (armRunningToggle ? -20 : -100) * directionMultiple,
        leftArm: (armRunningToggle ? -80 : -30) * directionMultiple,
      };
      this.animation.reset();
    }
  }

  private setupRunningAnimation() {
    this.animation = new GameAnimation(
      {
        rightThigh: 0,
        rightLeg: 0,
        leftThigh: 0,
        leftLeg: 0,
        rightShoulder: 0,
        rightArm: 0,
        leftShoulder: 0,
        leftArm: 0,
      },
      {
        rightThigh: 20,
        rightLeg: 140,
        leftThigh: -25,
        leftLeg: 10,
        rightShoulder: -20,
        rightArm: 20,
        leftShoulder: 20,
        leftArm: -20,
      },
      500,
      easeMethod.easeInQuart,
    );
  }

  private updateIdleAnimation() {
    this.thighRightSprite.angle = lerp(this.thighRightSprite.angle, 0, 0.1);
    this.legRightSprite.angle = lerp(this.legRightSprite.angle, 0, 0.1);
    this.thighLeftSprite.angle = lerp(this.thighLeftSprite.angle, 0, 0.1);
    this.legLeftSprite.angle = lerp(this.legLeftSprite.angle, 0, 0.1);
    this.shoulderRightSprite.angle = lerp(
      this.shoulderRightSprite.angle,
      0,
      0.1,
    );
    this.armRightSprite.angle = lerp(this.armRightSprite.angle, 0, 0.1);
    this.shoulderLeftSprite.angle = lerp(this.shoulderLeftSprite.angle, 0, 0.1);
    this.armLeftSprite.angle = lerp(this.armLeftSprite.angle, 0, 0.1);
  }

  update(delta: number): void {
    this.updateAnimation(delta);
    this.armRightLink.rotation = this.shoulderRightSprite.rotation;
    this.armLeftLink.rotation = this.shoulderLeftSprite.rotation;
    this.legRightLink.rotation = this.thighRightSprite.rotation;
    this.legLeftLink.rotation = this.thighLeftSprite.rotation;
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
      this.setZIndex();
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
