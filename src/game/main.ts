import { GameManager } from "../engine/screen";
import { LoadingScreen } from "./screens/loading_screen";
import { registerMapParsingExtension } from "./util/map";
import { registerYAMLParserExtension } from "./util/yaml";

export function main(gameManager: GameManager) {
  registerYAMLParserExtension();
  registerMapParsingExtension();
  gameManager.changeScreen(new LoadingScreen());
}
