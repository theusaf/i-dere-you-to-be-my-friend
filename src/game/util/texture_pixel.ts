import {
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  SCALE_MODES,
  Texture,
  extensions,
} from "pixi.js";

export function registerPixelTextureExtension(): void {
  const pixelTextureParser: LoaderParser = {
    async testParse(asset: unknown): Promise<boolean> {
      return asset instanceof Texture;
    },
    parse<T>(asset: Texture): T {
      asset.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      return asset as T;
    },
  };
  const pixelTextureExtension: ExtensionFormatLoose = {
    name: "texture-pixel-parser",
    type: ExtensionType.LoadParser,
    ref: pixelTextureParser,
    priority: LoaderParserPriority.Normal,
  };

  extensions.add(pixelTextureExtension);
}
