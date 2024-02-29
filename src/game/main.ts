import { GameManager } from "../engine/screen";
import { LoadingScreen } from "./screens/loading_screen";
import { MainMenuScreen } from "./screens/main_menu_screen";

export function main(gameManager: GameManager) {
  gameManager.changeScreen(new MainMenuScreen());
}
