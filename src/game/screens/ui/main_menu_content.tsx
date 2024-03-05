import { PixelImage } from "../../../engine/components/pixel_image";
import { Unselectable } from "../../../engine/components/unselectable";
import { useState } from "react";
import { getLatestSave } from "../../util/saves";
import { GameData, RawGameDataContent } from "../../util/game_data";
import { GameManager } from "../../../engine/game_manager";
import { MapScreen } from "../map_screen";
import { IndexPage } from "./main_menu_pages";
import { SavesPage } from "./main_menu_pages/saves";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { CreateSavePage } from "./main_menu_pages/create";
import { MainMenuScreen } from "../main_menu_screen";

export enum MainMenuPageState {
  index = "index",
  saves = "saves",
  newSave = "newSave",
}

export function MainMenuLogo() {
  return (
    <div className="grid grid-rows-5 h-full">
      <Unselectable className="h-full row-start-2 row-span-4">
        <PixelImage
          src="./assets/images/logo-banner.png"
          className="h-full m-auto"
        />
      </Unselectable>
    </div>
  );
}

export function MainMenuContent({
  gameManager,
  setScreenState,
  screen,
}: {
  gameManager: GameManager;
  setScreenState: (state: MainMenuPageState) => void;
  screen: MainMenuScreen;
}) {
  const [page, setPage] = useState<MainMenuPageState>(
    MainMenuPageState.newSave,
  );
  setScreenState(page);

  const onContinue = async () => {
    const latestSave = await getLatestSave<RawGameDataContent>();
    if (latestSave) {
      onSaveSelected(latestSave);
    } else {
      navigateToSaveList();
    }
  };
  const navigateToSaveList = () => setPage(MainMenuPageState.saves);
  const onSaveSelected = (save: RawGameDataContent) => {
    gameManager.gameData = GameData.fromMap(save);
    gameManager.gameData.save();
    gameManager.changeScreen(new MapScreen());
  };

  const pages: Partial<Record<MainMenuPageState, JSX.Element | JSX.Element[]>> =
    {
      [MainMenuPageState.index]: (
        <IndexPage
          navigateToSaveList={() => setPage(MainMenuPageState.saves)}
          onContinue={onContinue}
        />
      ),
      [MainMenuPageState.saves]: (
        <SavesPage
          onSaveSelected={onSaveSelected}
          onNewSave={() => {
            setPage(MainMenuPageState.newSave);
          }}
        />
      ),
      [MainMenuPageState.newSave]: (
        <CreateSavePage
        onSaveCreated={onSaveSelected}
        screen={screen}
         />
      ),
    };
  const pagesWithLogo: Set<MainMenuPageState> = new Set([
    MainMenuPageState.index,
    MainMenuPageState.saves,
  ]);

  return (
    <div className="grid-rows-5 grid-cols-5 h-full grid pointer-events-auto text-white">
      <div className="col-span-3 row-start-1 col-start-2 row-span-2">
        {pagesWithLogo.has(page) && <MainMenuLogo />}
        {page !== MainMenuPageState.index && (
          <span
            className="absolute left-0 cursor-pointer ml-4 pt-4"
            onClick={() => setPage(MainMenuPageState.index)}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="inline mr-2" />
            <Unselectable className="inline">BACK</Unselectable>
          </span>
        )}
      </div>
      {pages[page]}
    </div>
  );
}
