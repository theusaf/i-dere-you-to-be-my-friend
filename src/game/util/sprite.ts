import {
  Assets,
  BaseTexture,
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  SCALE_MODES,
  Texture,
  extensions,
} from "pixi.js";
import { constrain } from "./math";

const SIZE = 256;

const baseRecolorable = 0x00ff13;
const baseRecolorableList = convertToColorList(baseRecolorable);
const baseRecolorableListInverse = baseRecolorableList.map((c) => 255 - c);
const baseSkinColorable = 0x828282;
const baseSkinColorableList = convertToColorList(baseSkinColorable);
const baseSkinColorableListInverse = baseSkinColorableList.map((c) => 255 - c);

const spriteCanvas = document.createElement("canvas");
const spriteContext = spriteCanvas.getContext("2d")!;
// size of the sprite images
spriteCanvas.width = SIZE;
spriteCanvas.height = SIZE;

export interface BaseSprite {
  frontHead: ImageData | null;
  frontBody: ImageData | null;
  frontRightThigh: ImageData | null;
  frontRightLeg: ImageData | null;
  frontRightShoulder: ImageData | null;
  frontRightArm: ImageData | null;
  frontLeftThigh: ImageData | null;
  frontLeftLeg: ImageData | null;
  frontLeftShoulder: ImageData | null;
  frontLeftArm: ImageData | null;
  backHead: ImageData | null;
  backBody: ImageData | null;
  backRightThigh: ImageData | null;
  backRightLeg: ImageData | null;
  backRightShoulder: ImageData | null;
  backRightArm: ImageData | null;
  backLeftThigh: ImageData | null;
  backLeftLeg: ImageData | null;
  backLeftShoulder: ImageData | null;
  backLeftArm: ImageData | null;
}

function parseSprite(image: Blob): Promise<BaseSprite> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(image);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      spriteContext.clearRect(0, 0, SIZE, SIZE);
      spriteContext.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // read the pixels
      // TODO: use constants for positions

      const frontHeadData = spriteContext.getImageData(10, 4, 106, 82);
      const frontRightShoulderData = spriteContext.getImageData(5, 94, 14, 37);
      const frontRightArmData = spriteContext.getImageData(5, 131, 14, 41);
      const frontLeftShoulderData = spriteContext.getImageData(107, 94, 14, 37);
      const frontLeftArmData = spriteContext.getImageData(107, 131, 14, 41);

      const backHeadData = spriteContext.getImageData(131, 4, 106, 82);
      const backLeftShoulderData = spriteContext.getImageData(134, 94, 14, 37);
      const backLeftArmData = spriteContext.getImageData(134, 131, 14, 41);
      const backRightShoulderData = spriteContext.getImageData(236, 94, 14, 37);
      const backRightArmData = spriteContext.getImageData(236, 131, 14, 41);

      let frontBodyData = spriteContext.getImageData(22, 93, 82, 139);
      let backBodyData = spriteContext.getImageData(151, 93, 82, 139);

      // Note to self: This is a relative position to the front body, not the entire image
      const pantCheckIndex = getIndexFromPosition(39, 78, 82);
      const pantCheck = frontBodyData.data[pantCheckIndex * 4 + 3] === 0;
      let frontRightThighData: ImageData | null = null;
      let frontRightLegData: ImageData | null = null;
      let frontLeftThighData: ImageData | null = null;
      let frontLeftLegData: ImageData | null = null;
      let backRightThighData: ImageData | null = null;
      let backRightLegData: ImageData | null = null;
      let backLeftThighData: ImageData | null = null;
      let backLeftLegData: ImageData | null = null;

      if (pantCheck) {
        frontRightThighData = spriteContext.getImageData(32, 169, 23, 36);
        frontRightLegData = spriteContext.getImageData(32, 205, 23, 27);
        frontLeftThighData = spriteContext.getImageData(69, 169, 25, 36);
        frontLeftLegData = spriteContext.getImageData(69, 205, 25, 27);

        backLeftThighData = spriteContext.getImageData(161, 169, 25, 36);
        backLeftLegData = spriteContext.getImageData(161, 205, 25, 27);
        backRightThighData = spriteContext.getImageData(198, 169, 23, 36);
        backRightLegData = spriteContext.getImageData(198, 205, 23, 27);

        frontBodyData = spriteContext.getImageData(22, 93, 82, 76);
        backBodyData = spriteContext.getImageData(151, 93, 82, 76);
      }

      const cache: BaseSprite = {
        frontHead: frontHeadData,
        frontBody: frontBodyData,
        frontRightThigh: frontRightThighData,
        frontRightLeg: frontRightLegData,
        frontRightShoulder: frontRightShoulderData,
        frontRightArm: frontRightArmData,
        frontLeftThigh: frontLeftThighData,
        frontLeftLeg: frontLeftLegData,
        frontLeftShoulder: frontLeftShoulderData,
        frontLeftArm: frontLeftArmData,
        backHead: backHeadData,
        backBody: backBodyData,
        backRightThigh: backRightThighData,
        backRightLeg: backRightLegData,
        backRightShoulder: backRightShoulderData,
        backRightArm: backRightArmData,
        backLeftThigh: backLeftThighData,
        backLeftLeg: backLeftLegData,
        backLeftShoulder: backLeftShoulderData,
        backLeftArm: backLeftArmData,
      };
      resolve(cache);
    };
  });
}

const recolorCache: Map<string, Promise<Texture>> = new Map();

export interface RecolorSpriteOpts {
  id: string;
  part: keyof BaseSprite;
  skinColor: number;
  mainColor: number;
  treatWhiteAsMain: boolean;
}

export function recolorSprite({
  id,
  part,
  skinColor,
  mainColor,
  treatWhiteAsMain,
}: RecolorSpriteOpts): Promise<Texture> {
  const key = `${id}-${part}-${skinColor}-${mainColor}`;
  if (recolorCache.has(key)) return Promise.resolve(recolorCache.get(key)!);
  const data = Assets.get<BaseSprite>(`sprite/${id}`)[part]!;
  const pixels = compressImageData(data);
  const skinColorList = convertToColorList(skinColor);
  const mainColorList = convertToColorList(mainColor);
  for (const pixel of pixels) {
    const { r, g, b, a } = pixel;
    // check for patterns
    if (a === 0) continue;
    if (r === 255 && g === 0 && b === 255) {
      if (treatWhiteAsMain) {
        pixel.r = mainColorList[0];
        pixel.g = mainColorList[1];
        pixel.b = mainColorList[2];
        continue;
      }
    }
    if (r === b && b === g) {
      // ignore black
      if (r + b + g === 0) continue;
      // skin color
      const pixelDiff = [
        baseSkinColorableList[0] - r,
        baseSkinColorableList[1] - g,
        baseSkinColorableList[2] - b,
      ];
      pixel.r = constrain(skinColorList[0] + pixelDiff[0], 0, 255);
      pixel.g = constrain(skinColorList[1] + pixelDiff[1], 0, 255);
      pixel.b = constrain(skinColorList[2] + pixelDiff[2], 0, 255);
    } else if (r === 0 && g !== 0 && b !== 0) {
      // main color
      const pixelDiff = [
        baseRecolorableList[0] - r,
        baseRecolorableList[1] - g,
        baseRecolorableList[2] - b,
      ];
      pixel.r = constrain(mainColorList[0] + pixelDiff[0], 0, 255);
      pixel.g = constrain(mainColorList[1] + pixelDiff[1], 0, 255);
      pixel.b = constrain(mainColorList[2] + pixelDiff[2], 0, 255);
    }
  }
  const output = decompressPixels(pixels, data.width, data.height);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = data.width;
  canvas.height = data.height;
  context.putImageData(output, 0, 0);
  const base64 = canvas.toDataURL();
  const image = new Image();
  image.src = base64;
  const promise = new Promise<Texture>((resolve) => {
    image.onload = () => {
      const baseTexture = new BaseTexture(image);
      baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const texture = new Texture(baseTexture);
      resolve(texture);
    };
  });
  recolorCache.set(key, promise);
  return promise;
}

interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

function compressImageData(data: ImageData): Pixel[] {
  const pixels: Pixel[] = [];
  for (let i = 0; i < data.data.length; i += 4) {
    pixels.push({
      r: data.data[i],
      g: data.data[i + 1],
      b: data.data[i + 2],
      a: data.data[i + 3],
    });
  }
  return pixels;
}

function decompressPixels(
  pixels: Pixel[],
  width = SIZE,
  height = SIZE,
): ImageData {
  const output = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    output[i * 4] = pixel.r;
    output[i * 4 + 1] = pixel.g;
    output[i * 4 + 2] = pixel.b;
    output[i * 4 + 3] = pixel.a;
  }
  return new ImageData(output, width, height);
}

export function convertToColorList(color: number): number[] {
  return [color >> 16, (color >> 8) & 0xff, color & 0xff];
}

export function getIndexFromPosition(
  x: number,
  y: number,
  size = SIZE,
): number {
  return y * size + x;
}

export function getPositionFromIndex(
  index: number,
  size = SIZE,
): [number, number] {
  return [index % size, Math.floor(index / size)];
}

export function registerSpriteParsingExtension(): void {
  const spriteParser: LoaderParser = {
    test(url): boolean {
      const { pathname } = new URL(url);
      return pathname.endsWith(".sprite");
    },
    async load<T>(url: string): Promise<T> {
      const pathname = new URL(url).pathname;
      const id = pathname.match(/character-(\d+)[.]/)![1];
      return {
        blob: await fetch(url).then((res) => res.blob()),
        id: id,
      } as T;
    },
    async testParse(asset: unknown): Promise<boolean> {
      if (!((asset as { blob?: Blob })?.blob instanceof Blob)) return false;
      return true;
    },
    async parse<T>(asset: { blob: Blob; id: string }): Promise<T> {
      const data = await parseSprite(asset.blob);
      return data as T;
    },
  };
  const spriteParserExtension: ExtensionFormatLoose = {
    name: "sprite-parser",
    type: ExtensionType.LoadParser,
    ref: spriteParser,
    priority: LoaderParserPriority.High,
  };
  extensions.add(spriteParserExtension);
}
