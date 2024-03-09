import { useEffect, useState } from "react";
import { LoadingScreen } from "../loading_screen";
import { Unselectable } from "../../../engine/components/unselectable";
import { MainMenuScreen } from "../main_menu_screen";

export function LoadingScreenContent({
  data,
}: {
  data: LoadingScreen;
}): JSX.Element {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const checker = setInterval(() => {
      if (data.progress >= 1) {
        setIsReady(true);
        clearInterval(checker);
      }
    }, 250);
    return () => clearInterval(checker);
  }, [data.progress]);

  return (
    <div
      className="pointer-events-auto h-full flex flex-col items-center relative"
      onClick={() => {
        if (data.progress >= 1) {
          data.gameManager.changeScreen(new MainMenuScreen());
        }
      }}
    >
      <div className="m-auto flex-1 flex flex-row items-center relative text-center text-white">
        <Unselectable>
          <span className="text-6xl">Loading...</span>
        </Unselectable>
        <Unselectable
          className={`absolute w-full text-xl bottom-40 transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
          style={{
            transitionDelay: "2s",
          }}
        >
          <span>Click to Start...</span>
        </Unselectable>
      </div>
      <div className="absolute bottom-0 left-0 p-2 text-white">
        Copyright 2024 <a href="https://theusaf.org">theusaf</a>,
        <a href="https://好きな.みんな">好きな.みんな Games</a>
      </div>
    </div>
  );
}
