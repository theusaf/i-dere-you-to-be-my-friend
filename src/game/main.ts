import { GameManager } from "../engine/game_manager";
import { LoadingScreen } from "./screens/loading_screen";
import { registerMapParsingExtension } from "./util/map";
import { registerPixelTextureExtension } from "./util/texture_pixel";
import { registerYAMLParserExtension } from "./util/yaml";

export function main(gameManager: GameManager) {
  registerYAMLParserExtension();
  registerMapParsingExtension();
  registerPixelTextureExtension();
  gameManager.changeScreen(new LoadingScreen());
}
