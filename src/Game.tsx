import { useContext, useState } from "react";
import { GameManagerContext } from "./game/util/game_manager_context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { SoundManager } from "./game/util/sounds";

function Game() {
  const [muted, setMuted] = useState(false);
  const gameManager = useContext(GameManagerContext),
    ui = gameManager?.currentScreen?.getUI();
  return (
    <>
      <div id="pixi-ui" className="absolute w-full h-full pointer-events-none">
        <div className="above-canvas overflow-hidden relative">
          {ui?.main}
          <div className="absolute top-0 right-0 p-2">
            <FontAwesomeIcon
              className="pointer-events-auto cursor-pointer"
              color="white"
              onClick={() => {
                setMuted(!muted);
                if (muted) {
                  SoundManager.unmuteAll();
                } else {
                  SoundManager.muteAll();
                }
              }}
              icon={muted ? faVolumeXmark : faVolumeHigh}
            />
          </div>
        </div>
        <div className="full-screen absolute w-full h-full">{ui?.screen}</div>
      </div>
    </>
  );
}

export default Game;
