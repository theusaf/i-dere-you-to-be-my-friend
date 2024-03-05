import {
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  extensions,
} from "pixi.js";

const SIZE = 256;

const baseRecolorable = 0x00ff13;
const baseSkinColorable = 0x828282;
const baseEyes = 0xffffff; // only applies to the head

const spriteCanvas = document.createElement("canvas");
const spriteContext = spriteCanvas.getContext("2d")!;
// size of the sprite images
spriteCanvas.width = SIZE;
spriteCanvas.height = SIZE;

export interface BaseSpriteCache {
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

const baseSpriteCache: Map<string, BaseSpriteCache> = new Map();

function parseSprite(image: Blob, id: string): Promise<void> {
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

      const pantCheckIndex = getIndexFromPosition(61, 171, 82);
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

      const cache: BaseSpriteCache = {
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
      baseSpriteCache.set(id, cache);
      resolve();
    };
  });
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

function decompressPixels(pixels: Pixel[]): ImageData {
  const output = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    output[i * 4] = pixel.r;
    output[i * 4 + 1] = pixel.g;
    output[i * 4 + 2] = pixel.b;
    output[i * 4 + 3] = pixel.a;
  }
  return new ImageData(output, SIZE, SIZE);
}

export function convertToColorList(color: number): number[] {
  return [color >> 16, (color >> 8) & 0xff, color & 0xff];
}

function getIndexFromPosition(x: number, y: number, size = SIZE): number {
  return y * size + x;
}

function getPositionFromIndex(index: number, size = SIZE): [number, number] {
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
    parse<T>(asset: { blob: Blob; id: string }): Promise<T> {
      return Promise.resolve(parseSprite(asset.blob, asset.id) as T);
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
