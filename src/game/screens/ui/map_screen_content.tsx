import { useEffect, useRef, useState } from "react";
import { PixelImage } from "../../../engine/components/pixel_image";
import { Unselectable } from "../../../engine/components/unselectable";
import { MapScreen, MapScreenEvents } from "../map_screen";
import {
  CutsceneActionAnimate,
  MapSpecialActionBattle,
} from "../../util/map_types";
import { BattleScreen } from "../battle_screen";
import { GameAnimation, easeMethod } from "../../util/animation";
import {
  SettingsPageLarge,
  SettingsPagePhone,
} from "./map_screen_pages/settings";
import { Battle } from "../../util/battle";
import { chance } from "../../util/chance";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";
import { FriendContract } from "../../../engine/components/contract";
import { CharacterSpriteAnimation } from "../../../engine/character_sprite";
import { Direction } from "../../util/direction";
import { CreditsPageLarge, CreditsPagePhone } from "./map_screen_pages/credits";

interface MapScreenContentProps {
  state: MapScreen;
}

enum EnterBattleAnimationState {
  none,
  running,
  done,
}

export function MapScreenContent({
  state,
}: MapScreenContentProps): JSX.Element {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [blankScreen, setBlankScreen] = useState(false);
  const [contractVisible, setContractVisible] = useState(false);
  const [contractName, setContractName] = useState("");
  const [dialog, setDialog] = useState("");
  const [battleStartState, setBattleStartState] = useState(
    EnterBattleAnimationState.none,
  );
  const contractCallback = useRef<() => void>(() => {});
  const dialogCallback = useRef<() => void>(() => {});
  const [battleData, setBattleData] = useState<MapSpecialActionBattle | null>(
    null,
  );
  const { gameManager } = state;

  useEffect(() => {
    const battleStartListener = ((
      data: CustomEvent<MapSpecialActionBattle>,
    ) => {
      setPhoneVisible(false);
      setBattleData(data.detail);
      setBattleStartState(EnterBattleAnimationState.running);
    }) as EventListener;
    const dialogListener = ((event: CustomEvent<string>) => {
      setDialog(
        (event as CustomEvent<string>).detail
          .replace(/§player.name§/g, gameManager.gameData.you.name)
          .replace(/§friend.name§/g, gameManager.gameData.mainNPC.name),
      );
      dialogCallback.current = () => {
        setDialog("");
        dialogCallback.current = () => {};
        gameManager.cutsceneIndex++;
      };
    }) as EventListener;
    const animateListener = ((event: CustomEvent<CutsceneActionAnimate>) => {
      const animateData = event.detail;
      const npc = gameManager.gameData.specialNPCs[animateData.id];
      const animation = new GameAnimation(
        {
          x: animateData.start[0],
          y: animateData.start[1],
        },
        {
          x: animateData.end[0],
          y: animateData.end[1],
        },
        animateData.time,
      );
      let lastTime = performance.now();
      const sprite = state.mapNPCS[animateData.id].sprite;
      sprite.setAnimation(CharacterSpriteAnimation.running);
      sprite.animationContext.direction = Direction.down;
      const animateLoop = (time: number) => {
        if (animation.isDone) {
          sprite.setAnimation(CharacterSpriteAnimation.idle);
          gameManager.cutsceneIndex++;
          return;
        }
        const progress = animation.update(time - lastTime);
        npc.position[0] = progress.x;
        npc.position[1] = progress.y;
        lastTime = time;
        requestAnimationFrame(animateLoop);
      };
      requestAnimationFrame(animateLoop);
    }) as EventListener;
    const blankScreenListener = ((event: CustomEvent<boolean>) => {
      setBlankScreen((event as CustomEvent<boolean>).detail);
      setTimeout(() => {
        gameManager.cutsceneIndex++;
      }, 1000);
    }) as EventListener;
    const contractListener = ((event: CustomEvent<string>) => {
      const npcId = event.detail;
      const npc = gameManager.gameData.specialNPCs[npcId];
      setContractName(npc.name);
      setContractVisible(true);
      contractCallback.current = () => {
        gameManager.gameData.addCharacter(npc);
        setContractVisible(false);
        contractCallback.current = () => {};
        gameManager.cutsceneIndex++;
      };
    }) as EventListener;
    state.eventNotifier.addEventListener(
      MapScreenEvents.battleStart,
      battleStartListener,
    );
    state.eventNotifier.addEventListener(
      MapScreenEvents.blankScreen,
      blankScreenListener,
    );
    state.eventNotifier.addEventListener(
      MapScreenEvents.dialog,
      dialogListener,
    );
    state.eventNotifier.addEventListener(
      MapScreenEvents.animate,
      animateListener,
    );
    state.eventNotifier.addEventListener(
      MapScreenEvents.contract,
      contractListener,
    );
    return () => {
      state.eventNotifier.removeEventListener(
        MapScreenEvents.battleStart,
        battleStartListener,
      );
      state.eventNotifier.removeEventListener(
        MapScreenEvents.blankScreen,
        blankScreenListener,
      );
      state.eventNotifier.removeEventListener(
        MapScreenEvents.dialog,
        dialogListener,
      );
      state.eventNotifier.removeEventListener(
        MapScreenEvents.animate,
        animateListener,
      );
      state.eventNotifier.removeEventListener(
        MapScreenEvents.contract,
        contractListener,
      );
    };
  }, [
    state.eventNotifier,
    gameManager.cutsceneIndex,
    gameManager.gameData,
    state.mapNPCS,
  ]);

  return (
    <>
      <div
        className={`absolute h-full w-full top-0 left-0 bg-black transition-opacity z-40 duration-700 ${
          blankScreen
            ? "opacity-100 pointer-events-auto"
            : "pointer-events-none opacity-0"
        }`}
      ></div>
      {dialog && (
        <div className="absolute h-full w-full top-0 left-0 z-50 pointer-events-auto flex flex-col">
          <div className="text-white text-2xl flex-1 px-20 py-10 flex flex-row content-center items-center">
            <AnimatedTextController
              key={dialog}
              className="text-center flex-1 grid content-center"
              onCompleteAction={dialogCallback.current}
            >
              {dialog}
            </AnimatedTextController>
          </div>
        </div>
      )}
      {contractVisible && (
        <FriendContract
          initialName={contractName}
          contractee={gameManager.gameData.you.name}
          onContractSigned={contractCallback.current}
        />
      )}
      <div
        className={`grid grid-rows-8 relative h-full ${phoneVisible ? "pointer-events-auto" : ""}`}
        onClick={phoneVisible ? () => setPhoneVisible(false) : undefined}
      >
        {phoneVisible && <PhoneLargeDisplay />}
        {battleStartState === EnterBattleAnimationState.running && (
          <BattleAnimationDisplay
            key={chance.guid()}
            onDone={() => {
              const { gameData } = state.gameManager;
              setBattleStartState(EnterBattleAnimationState.done);
              const battle = Battle.fromBattleData(
                battleData!,
                state.gameManager,
              );
              gameData.battle = battle;
              battle.noteIntro();
              state.gameManager.gameData.save();
              state.gameManager.changeScreen(new BattleScreen());
            }}
          />
        )}
        <div className="row-span-2 row-start-1 col-start-1"></div>
        <div className="row-span-3 row-start-6 grid grid-cols-12 col-start-1">
          <div className="col-span-2 px-4 relative h-full">
            {!phoneVisible &&
              battleStartState === EnterBattleAnimationState.none && (
                <PhoneWidget onClick={() => setPhoneVisible(true)} />
              )}
          </div>
        </div>
      </div>
    </>
  );
}

interface BattleAnimationDisplayProps {
  onDone: () => void;
}

enum BattleAnimationState {
  flash,
  initial,
  closing,
}

function BattleAnimationDisplay({
  onDone,
}: BattleAnimationDisplayProps): JSX.Element {
  const [size, setSize] = useState(100);
  const [state, setState] = useState(BattleAnimationState.flash);
  const animation = useRef<GameAnimation | null>(null);
  if (animation.current === null) {
    animation.current = new GameAnimation(
      { distance: 0 },
      { distance: 2 },
      500,
      easeMethod.linear,
    );
  }
  const currentAnimation = animation.current;

  useEffect(() => {
    let lastTime = performance.now();
    let shouldStop = false;
    const animationRunner = (time: number) => {
      if (currentAnimation.isDone || shouldStop) return;
      setSize(currentAnimation.update(time - lastTime).distance);
      if (currentAnimation.isDone) {
        if (state === BattleAnimationState.flash) {
          animation.current = new GameAnimation(
            { distance: 100 },
            { distance: 15 },
            1000,
            easeMethod.easeOutBack,
          );
          shouldStop = true;
          setState(BattleAnimationState.initial);
          setSize(100);
        } else if (state === BattleAnimationState.initial) {
          animation.current = new GameAnimation(
            { distance: 15 },
            { distance: 0 },
            500,
            easeMethod.easeInBack,
          );
          shouldStop = true;
          setState(BattleAnimationState.closing);
        } else {
          shouldStop = true;
          onDone();
        }
      }
      lastTime = time;
      requestAnimationFrame(animationRunner);
      return () => (shouldStop = true);
    };
    requestAnimationFrame(animationRunner);
  }, [currentAnimation, state, onDone]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("Animation timed out!");
      onDone();
    }, 5000);
    return () => clearTimeout(timeout);
  }, [onDone]);

  const mask = (
    <svg className="absolute w-full h-full z-50">
      <defs>
        <mask id="battle-hole">
          <rect width="100%" height="100%" fill="white" />
          <circle
            cx="50%"
            cy="50%"
            r={`${state === BattleAnimationState.flash ? 100 - size * 4 : size}%`}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="#000222"
        mask="url(#battle-hole)"
      />
    </svg>
  );

  return (
    <>
      {state === BattleAnimationState.flash ? (
        <div
          className="absolute w-full h-full z-50"
          style={{
            opacity: (size % 1) * 0.9,
            backgroundColor: "#000222",
          }}
        >
          {mask}
        </div>
      ) : (
        mask
      )}
    </>
  );
}

interface PhoneWidgetProps {
  onClick: () => void;
}

function PhoneWidget({ onClick }: PhoneWidgetProps) {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <div
      className={`pointer-events-auto h-full items-end relative transition-all ${isHovering ? "top-2/3" : "top-3/4"}`}
      onClick={() => onClick()}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
    >
      <Unselectable className="flex flex-col h-full items-end">
        <PixelImage
          src="./assets/images/ui/phone.png"
          className="flex-1 m-auto"
        />
      </Unselectable>
    </div>
  );
}

function PhoneLargeDisplay() {
  const [page, setPage] = useState("index");
  const className = "h-full drop-shadow-md shadow-black";
  const apps = ["contacts", "party", "me", "bag", "settings", "credits"];
  const appIndex = apps.map((app) => (
    <div
      key={app}
      className="w-full h-full cursor-pointer"
      onClick={() => {
        setPage(app);
      }}
    >
      <Unselectable className="w-full h-full">
        <PixelImage
          src={`./assets/images/ui/apps/${app}.png`}
          className={className}
        />
      </Unselectable>
    </div>
  ));
  const pages: Record<string, JSX.Element | JSX.Element[]> = {
    index: appIndex,
    settings: <SettingsPagePhone />,
    credits: <CreditsPagePhone />,
  };
  const pageContents: Record<string, JSX.Element | JSX.Element[]> = {
    settings: <SettingsPageLarge />,
    credits: <CreditsPageLarge />,
  };
  return (
    <div className="row-span-8 row-start-1 col-start-1 flex items-start flex-row p-4 z-10">
      <div
        className="h-full flex-auto relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PixelImage src="./assets/images/ui/phone.png" className="h-full" />
        <div className="absolute h-full w-full top-0 left-0 p-6 grid grid-rows-12 text-white">
          <span className="text-sm flex items-center pb-2">XX:XX</span>
          <div
            className={`h-full row-span-10 row-start-2 ${page === "index" ? "grid" : ""} grid-rows-7 grid-cols-3 items-center relative`}
          >
            {page !== "index" && (
              <span
                className="absolute top-0 left-0 cursor-pointer"
                onClick={() => setPage("index")}
              >
                <Unselectable>Back</Unselectable>
              </span>
            )}
            <span className="col-span-3 text-center text-4xl">
              <Unselectable>{page === "index" ? "Hello!" : ""}</Unselectable>
            </span>
            {pages[page]}
          </div>
        </div>
      </div>
      <div
        className="ml-4 w-full h-full"
        style={{
          flex: 4,
        }}
      >
        {pageContents[page]}
      </div>
    </div>
  );
}
