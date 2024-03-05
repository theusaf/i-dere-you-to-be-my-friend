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

function parseSprite(image: Blob) {
  const url = URL.createObjectURL(image);
  const img = new Image();
  img.src = url;
  img.onload = () => {
    spriteContext.clearRect(0, 0, SIZE, SIZE);
    spriteContext.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const frontHeadData = spriteContext.getImageData(10, 4, 106, 82);
    const frontBodyData = spriteContext.getImageData(22, 93, 82, 139);
    const frontRightShoulderData = spriteContext.getImageData(5, 94, 14, 37);
    const frontRightArmData = spriteContext.getImageData(5, 131, 14, 41);
    const frontLeftShoulderData = spriteContext.getImageData(107, 94, 14, 37);
    const frontLeftArmData = spriteContext.getImageData(107, 131, 14, 41);

    const backHeadData = spriteContext.getImageData(131, 4, 106, 82);
    const backBodyData = spriteContext.getImageData(151, 93, 82, 139);
    const backLeftShoulderData = spriteContext.getImageData(134, 94, 14, 37);
    const backLeftArmData = spriteContext.getImageData(134, 131, 14, 41);
    const backRightShoulderData = spriteContext.getImageData(236, 94, 14, 37);
    const backRightArmData = spriteContext.getImageData(236, 131, 14, 41);
  };
}

function parseSpriteHead(data: ImageData) {}

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
    parse<T>(asset: Blob): Promise<T> {
      // TODO: parse the sprite
      return Promise.resolve({} as T);
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
