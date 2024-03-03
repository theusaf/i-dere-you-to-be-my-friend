import { useEffect, useRef, useState } from "react";
import { PixelImage } from "../../../engine/components/pixel_image";
import { Unselectable } from "../../../engine/components/unselectable";
import { MapScreen, MapScreenEvents } from "../map_screen";
import { MapSpecialActionBattle } from "../../util/map_types";
import { BattleScreen } from "../battle_screen";
import { GameAnimation, easeMethod } from "../../util/animation";

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
  const [battleStartState, setBattleStartState] = useState(
    EnterBattleAnimationState.none,
  );
  useEffect(() => {
    const battleStartListener = ((_: CustomEvent<MapSpecialActionBattle>) => {
      setPhoneVisible(false);
      setBattleStartState(EnterBattleAnimationState.running);
    }) as EventListener;
    state.eventNotifier.addEventListener(
      MapScreenEvents.battleStart,
      battleStartListener,
    );
    return () => {
      state.eventNotifier.removeEventListener(
        MapScreenEvents.battleStart,
        battleStartListener,
      );
    };
  }, []);

  return (
    <div
      className={`grid grid-rows-8 relative h-full ${phoneVisible ? "pointer-events-auto" : ""}`}
      onClick={phoneVisible ? () => setPhoneVisible(false) : undefined}
    >
      {phoneVisible && <PhoneLargeDisplay />}
      {battleStartState === EnterBattleAnimationState.running && (
        <BattleAnimationDisplay
          onDone={() => {
            setBattleStartState(EnterBattleAnimationState.done);
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
  const animation = useRef<GameAnimation>(
    new GameAnimation({ distance: 0 }, { distance: 2 }, 500, easeMethod.linear),
  );
  const currentAnimation = animation.current;
  if (!currentAnimation.isDone) {
    const lastTime = performance.now();
    requestAnimationFrame((time) => {
      setSize(currentAnimation.update(time - lastTime).distance);
      if (currentAnimation.isDone) {
        if (state === BattleAnimationState.flash) {
          animation.current = new GameAnimation(
            { distance: 100 },
            { distance: 15 },
            1000,
            easeMethod.easeOutBack,
          );
          setState(BattleAnimationState.initial);
          setSize(100);
        } else if (state === BattleAnimationState.initial) {
          animation.current = new GameAnimation(
            { distance: 15 },
            { distance: 0 },
            500,
            easeMethod.easeInBack,
          );
          setState(BattleAnimationState.closing);
        } else {
          onDone();
        }
      }
    });
  }

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
          src="/assets/images/ui/phone.png"
          className="flex-1 m-auto"
        />
      </Unselectable>
    </div>
  );
}

function PhoneLargeDisplay() {
  return (
    <div className="row-span-8 row-start-1 col-start-1 flex items-start flex-row p-4 z-10">
      <div
        className="h-full flex-auto relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PixelImage src="/assets/images/ui/phone.png" className="h-full" />
        <div className="absolute h-full w-full top-0 left-0 p-6 grid grid-rows-12 text-white">
          <span className="text-sm flex items-center pb-2">XX:XX</span>
          <div className="row-span-10 row-start-2 grid grid-rows-5 grid-cols-4">
            <span>PHONE</span>
          </div>
        </div>
      </div>
      <div
        className="ml-4"
        style={{
          flex: 4,
        }}
      ></div>
    </div>
  );
}
