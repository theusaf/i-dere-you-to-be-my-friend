import { useState } from "react";
import { TextActionButton } from "../../../../engine/components/action_button";
import { GameManager } from "../../../../engine/game_manager";
import { MainMenuScreen } from "../../main_menu_screen";

export function SavePagePhone({ gameManager }: { gameManager: GameManager }) {
  const [message, setMessage] = useState("");

  return (
    <div className="flex items-center flex-col h-full">
      <h2 className="text-2xl underline mb-2">Saves</h2>
      <TextActionButton
        className="mb-2"
        onClick={async () => {
          await gameManager.gameData.save();
          setMessage("Game Saved!");
        }}
      >
        Save Game
      </TextActionButton>
      <TextActionButton
        onClick={async () => {
          await gameManager.gameData.save();
          gameManager.changeScreen(new MainMenuScreen());
        }}
      >
        Save and Return to Menu
      </TextActionButton>
      <div>{message}</div>
    </div>
  );
}
