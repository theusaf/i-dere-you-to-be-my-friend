import { AssetsManifest } from "pixi.js";

export const assetList: AssetsManifest = {
  bundles: [
    {
      name: "images-other",
      assets: [
        { src: "./assets/images/logo-banner.png", alias: "logo/banner" },
      ],
    },
    {
      name: "images-ui",
      assets: [
        { src: "./assets/images/ui/phone.png", alias: "ui/phone" },
        { src: "./assets/images/ui/scroll.png", alias: "ui/scroll" },
        { src: "./assets/images/ui/apps/bag.png", alias: "ui/apps/bag" },
        {
          src: "./assets/images/ui/apps/contacts.png",
          alias: "ui/apps/contacts",
        },
        {
          src: "./assets/images/ui/apps/credits.png",
          alias: "ui/apps/credits",
        },
        { src: "./assets/images/ui/apps/me.png", alias: "ui/apps/me" },
        { src: "./assets/images/ui/apps/party.png", alias: "ui/apps/party" },
        {
          src: "./assets/images/ui/apps/settings.png",
          alias: "ui/apps/settings",
        },
      ],
    },
    {
      name: "images-map",
      assets: [
        { src: "./assets/images/map_icons/dirt.png", alias: "icon/map/dirt" },
        { src: "./assets/images/map_icons/grass.png", alias: "icon/map/grass" },
        { src: "./assets/images/map_icons/rock.png", alias: "icon/map/rock" },
        { src: "./assets/images/map_icons/sand.png", alias: "icon/map/sand" },
        { src: "./assets/images/map_icons/wood.png", alias: "icon/map/wood" },
        {
          src: "./assets/images/map_icons/thick_grass.png",
          alias: "icon/map/thick_grass",
        },
        {
          src: "./assets/images/map_icons/water1.png",
          alias: "icon/map/water1",
        },
        {
          src: "./assets/images/map_icons/water2.png",
          alias: "icon/map/water2",
        },
      ],
    },
    {
      name: "images-map-structures",
      assets: [
        {
          src: "./assets/images/map_structures/store_stall.png",
          alias: "icon/structure/store_stall",
        },
        {
          src: "./assets/images/map_structures/store_stall_2.png",
          alias: "icon/structure/store_stall_2",
        },
        {
          src: "./assets/images/map_structures/hospital.png",
          alias: "icon/structure/hospital",
        },
        {
          src: "./assets/images/map_structures/supermarket.png",
          alias: "icon/structure/supermarket",
        },
      ],
    },
    {
      name: "data-sprites",
      assets: [
        { src: "./assets/character/character-1.sprite", alias: "sprite/1" },
        { src: "./assets/character/character-2.sprite", alias: "sprite/2" },
        { src: "./assets/character/character-3.sprite", alias: "sprite/3" },
        { src: "./assets/character/character-4.sprite", alias: "sprite/4" },
      ],
    },
    {
      name: "data-map",
      assets: [
        { src: "./assets/maps/0,0.map", alias: "map/0,0" },
        { src: "./assets/maps/0,-1.map", alias: "map/0,-1" },
        { src: "./assets/maps/-1,0.map", alias: "map/-1,0" },
        { src: "./assets/maps/1,0.map", alias: "map/1,0" },
      ],
    },
    {
      name: "data-map-special",
      assets: [
        {
          src: "./assets/maps/special/default.yaml",
          alias: "map/special/default",
        },
        { src: "./assets/maps/special/-1,0.yaml", alias: "map/special/-1,0" },
        { src: "./assets/maps/special/0,-1.yaml", alias: "map/special/0,-1" },
        { src: "./assets/maps/special/0,0.yaml", alias: "map/special/0,0" },
      ],
    },
    {
      name: "game-data",
      assets: [
        {
          src: "./assets/game/attacks.yaml",
          alias: "game/moves",
        },
        {
          src: "./assets/game/types.yaml",
          alias: "game/types",
        },
        {
          src: "./assets/game/rewards.yaml",
          alias: "game/rewards",
        },
      ],
    },
  ],
};

export function getAllBundles() {
  return assetList.bundles.map((bundle) => bundle.name);
}
