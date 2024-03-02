import { AssetsManifest } from "pixi.js";

export const assetList: AssetsManifest = {
  bundles: [
    {
      name: "images-other",
      assets: [{ src: "/assets/images/logo-banner.png", alias: "logo/banner" }],
    },
    {
      name: "images-ui",
      assets: [{ src: "/assets/images/ui/phone.png", alias: "ui/phone" }],
    },
    {
      name: "images-map",
      assets: [
        { src: "/assets/images/map_icons/dirt.png", alias: "icon/map/dirt" },
        { src: "/assets/images/map_icons/grass.png", alias: "icon/map/grass" },
        { src: "/assets/images/map_icons/rock.png", alias: "icon/map/rock" },
        { src: "/assets/images/map_icons/sand.png", alias: "icon/map/sand" },
        { src: "/assets/images/map_icons/wood.png", alias: "icon/map/wood" },
        {
          src: "/assets/images/map_icons/thick_grass.png",
          alias: "icon/map/thick_grass",
        },
        {
          src: "/assets/images/map_icons/water1.png",
          alias: "icon/map/water1",
        },
        {
          src: "/assets/images/map_icons/water2.png",
          alias: "icon/map/water2",
        },
      ],
    },
    {
      name: "data-map",
      assets: [{ src: "/assets/maps/0,0.map", alias: "map/0,0" }],
    },
    {
      name: "game-data",
      assets: [
        {
          src: "/assets/game/attacks.yaml",
          alias: "game/attacks",
        },
        {
          src: "/assets/game/types.yaml",
          alias: "game/types",
        },
      ],
    },
  ],
};

export function getAllBundles() {
  return assetList.bundles.map((bundle) => bundle.name);
}
