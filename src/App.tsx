import * as PIXI from "pixi.js";
import {
  createContext,
  useRef,
  useEffect,
  useState,
  forwardRef,
  useReducer,
} from "react";
import Game from "./Game";
import { GameManager } from "./engine/screen";
import { main } from "./game/main";

export const GameManagerContext = createContext<GameManager | null>(null);

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
      (window as unknown as any).debugPixi = app;
      const callback = () => forceUpdate();
      const gameManager = new GameManager(app, callback);
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
