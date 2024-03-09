import {
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  Texture,
  extensions,
} from "pixi.js";

const extractionCanvas = document.createElement("canvas");
const extractionContext = extractionCanvas.getContext("2d")!;

export enum MapTile {
  unknown = "unknown",
  grass = "grass",
  tallgrass = "tallgrass",
  water = "water",
  pavedRoad = "pavedRoad",
  dirtRoad = "dirtRoad",
  bridge = "bridge",
  sand = "sand",
  building = "building",
  glass = "glass",
  tile = "tile",
  stonebrick = "stonebrick",
  interactable = "interactable",
}

export const mapTileStrings = {
  unknown: MapTile.unknown,
  grass: MapTile.grass,
  tallgrass: MapTile.tallgrass,
  water: MapTile.water,
  pavedRoad: MapTile.pavedRoad,
  dirtRoad: MapTile.dirtRoad,
  bridge: MapTile.bridge,
  sand: MapTile.sand,
  building: MapTile.building,
  glass: MapTile.glass,
  tile: MapTile.tile,
  stonebrick: MapTile.stonebrick,
  interactable: MapTile.interactable,
};

export const mapTiles = {
  0x2ab34b: MapTile.grass,
  0x287039: MapTile.tallgrass,
  0x1f6cd4: MapTile.water,
  0x65625d: MapTile.pavedRoad,
  0x83580e: MapTile.dirtRoad,
  0xf2b141: MapTile.bridge,
  0xe1d334: MapTile.sand,
  0x838383: MapTile.building,
  0x45dcde: MapTile.glass,
  0xe7e7e7: MapTile.tile,
  0xa0a0a0: MapTile.stonebrick,
  0x000000: MapTile.interactable,
};

// Hardcoded. Represents the width and height of the map.
export const MAP_SIZE = 128;

export interface MapData {
  width: number;
  height: number;
  texture: Texture;
  tiles: MapTile[];
}

export function registerMapParsingExtension(): void {
  const mapParser: LoaderParser = {
    test(url): boolean {
      const { pathname } = new URL(url);
      return pathname.endsWith(".map");
    },
    async load<T>(url: string): Promise<T> {
      return (await fetch(url).then((res) => res.blob())) as T;
    },
    async testParse(asset: unknown): Promise<boolean> {
      if (!(asset instanceof Blob)) return false;
      return true;
    },
    parse<T>(asset: Blob): Promise<T> {
      return new Promise((resolve) => {
        const image = new Image();
        image.src = URL.createObjectURL(asset);
        image.addEventListener("load", () => {
          const mapData: MapData = {
            width: image.width,
            height: image.height,
            texture: Texture.from(image),
            tiles: [],
          };
          extractionCanvas.width = image.width;
          extractionCanvas.height = image.height;
          extractionContext.drawImage(image, 0, 0);
          const imageData = extractionContext.getImageData(
            0,
            0,
            image.width,
            image.height,
          );
          for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i + 3] === 0) {
              mapData.tiles.push(MapTile.unknown);
            } else {
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              const color = (r << 16) + (g << 8) + b;
              mapData.tiles.push(
                mapTiles[color as keyof typeof mapTiles] ?? MapTile.unknown,
              );
            }
          }
          return resolve(mapData as T);
        });
      });
    },
  };
  const mapParserExtension: ExtensionFormatLoose = {
    name: "map-parser",
    type: ExtensionType.LoadParser,
    ref: mapParser,
    priority: LoaderParserPriority.High,
  };
  extensions.add(mapParserExtension);
}
