import * as PIXI from "pixi.js";
import { useRef, useEffect, useState, forwardRef, useReducer } from "react";
import Game from "./Game";
import { GameManager } from "./engine/game_manager";
import { main } from "./game/main";
import { GameManagerContext } from "./game/util/game_manager_context";

const PixiRenderer = forwardRef<HTMLCanvasElement>((props, ref) => {
  return <canvas ref={ref} {...props} className="bg-white" />;
});

function App() {
  const pixiAppRef = useRef<HTMLCanvasElement>(null),
    [gameManager, setGameManager] = useState<GameManager | null>(null),
    [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (pixiAppRef.current) {
      const app = new PIXI.Application({
        backgroundAlpha: 0,
        antialias: true,
        resolution: 1,
        autoDensity: true,
        width: 1920,
        height: 1080,
        view: pixiAppRef.current,
      });
      const callback = () => forceUpdate();
      const gameManager = new GameManager(app, callback);
      (window as unknown as any).debugGame = gameManager;
      (window as unknown as any).debugAssets = PIXI.Assets;
      main(gameManager);
      setGameManager(gameManager);
    }
  }, [pixiAppRef]);

  return (
    <GameManagerContext.Provider value={gameManager}>
      <div
        id="pixi-engine"
        className="w-full h-full relative flex justify-center flex-col"
      >
        <PixiRenderer ref={pixiAppRef} />
        <Game />
      </div>
    </GameManagerContext.Provider>
  );
}

export default App;
