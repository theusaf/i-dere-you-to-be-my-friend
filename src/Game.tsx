import { useContext } from "react";
import { GameManagerContext } from "./App";

function Game() {
  const gameManager = useContext(GameManagerContext),
    ui = gameManager?.currentScreen?.getUI();
  return (
    <>
      <div id="pixi-ui" className="absolute w-full h-full pointer-events-none">
        <div className="above-canvas">{ui?.main}</div>
        <div className="full-screen absolute w-full h-full">${ui?.screen}</div>
      </div>
    </>
  );
}

export default Game;
