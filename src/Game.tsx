import { useContext } from "react";
import { GameManagerContext } from "./App";

function Game() {
  const gameManager = useContext(GameManagerContext);
  return (
    <>
      <div id="pixi-ui" className="absolute w-full h-full pointer-events-none">
        <div className="above-canvas"></div>
        <div className="full-screen absolute w-full h-full">
          {gameManager?.currentScreen?.getUI()}
        </div>
      </div>
    </>
  );
}

export default Game;
