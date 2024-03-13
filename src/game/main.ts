import { GameManager } from "../engine/game_manager";
import { LoadingScreen } from "./screens/loading_screen";
import { registerMapParsingExtension } from "./util/map";
import { registerWAVLoaderExtension } from "./util/sounds";
import { registerSpriteParsingExtension } from "./util/sprite";
import { registerPixelTextureExtension } from "./util/texture_pixel";
import { registerYAMLParserExtension } from "./util/yaml";

export function main(gameManager: GameManager) {
  registerYAMLParserExtension();
  registerMapParsingExtension();
  registerPixelTextureExtension();
  registerSpriteParsingExtension();
  registerWAVLoaderExtension();

  const originalWarn = window.console.warn.bind(window.console);
  window.console.warn = function (...data) {
    if (typeof data?.[0] === "string") {
      if (/[-]?\d+,[-]?\d+/.test(data[0])) return;
    }
    originalWarn(...data);
  };

  gameManager.changeScreen(new LoadingScreen());
}
