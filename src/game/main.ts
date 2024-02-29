import { GameManager } from "../engine/screen";
import { BattleScreen } from "./screens/battle_screen";

export function main(gameManager: GameManager) {
  gameManager.changeScreen(new BattleScreen());
}
