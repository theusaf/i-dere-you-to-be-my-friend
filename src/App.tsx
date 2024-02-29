import * as PIXI from "pixi.js";
import { createContext, useRef, useEffect, useState, forwardRef } from "react";
import Game from "./Game";

const PixiAppContext = createContext<PIXI.Application | null>(null);

const PixiRenderer = forwardRef<HTMLCanvasElement>((props, ref) => {
  return <canvas ref={ref} {...props} className="bg-white" />;
});

function App() {
  const pixiAppRef = useRef<HTMLCanvasElement>(null),
    [pixiApp, setPixiApp] = useState<PIXI.Application | null>(null);

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

      setPixiApp(app);
    }
  }, [pixiAppRef]);

  return (
    <PixiAppContext.Provider value={pixiApp}>
      <div
        id="pixi-engine"
        className="w-full h-full relative flex justify-center flex-col"
      >
        <PixiRenderer ref={pixiAppRef} />
        <Game />
      </div>
    </PixiAppContext.Provider>
  );
}

export default App;
