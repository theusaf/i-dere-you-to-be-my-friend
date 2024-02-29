import { GameManager } from "../engine/screen";
import { LoadingScreen } from "./screens/loading_screen";

export function main(gameManager: GameManager) {
  gameManager.changeScreen(new LoadingScreen());
}
