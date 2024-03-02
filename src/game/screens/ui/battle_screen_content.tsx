import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";
import { TextActionButton } from "../../../engine/components/action_button";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";
import { GameManager } from "../../../engine/screen";
import { MapScreen } from "../map_screen";

export interface BattleScreenContentProps {
  state: BattleScreen;
}

export function BattleScreenContent({
  state,
}: BattleScreenContentProps): JSX.Element {
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.state == BattleScreenState.battle) {
      } else {
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-rows-5 h-full text-white">
      <EnemyView />
      <UserView gameManager={state.gameManager} />
    </div>
  );
}

function EnemyView() {
  return (
    <div className="grid grid-cols-7">
      <div className="col-span-3 m-4 bg-slate-500 outline outline-4 outline-neutral-400 overflow-y-auto p-2 pointer-events-auto">
        <span>
          <h3 className="text-xl">INSERT ENEMY NAME</h3>
          <span>{/* type icons here */}</span>
        </span>
        <div className="grid grid-cols-5">
          <HealthBar className="col-span-4 m-auto" percentage={44 / 50} />
          <p className="text-center">44/50</p>
        </div>
        <div>{/* other icons here */}</div>
      </div>
    </div>
  );
}

interface UserViewProps {
  gameManager: GameManager;
}

function UserView({ gameManager }: UserViewProps): JSX.Element {
  return (
    <div className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2">
      <div className="flex w-full h-full">
        <UserStatsView />
        <UserViewButtonController gameManager={gameManager} />
      </div>
    </div>
  );
}

enum UserViewControllerState {
  index,
  fight,
  friends,
  actions,
  run,
}

function UserViewButtonController({ gameManager }: UserViewProps): JSX.Element {
  const [state, setState] = useState(UserViewControllerState.index);
  const className = "align-middle flex flex-col place-content-center";

  let buttons: JSX.Element;
  let message: string;
  switch (state) {
    case UserViewControllerState.index:
      buttons = <IndexButtons className={className} setState={setState} />;
      message = "What do you want to do?";
      break;
    case UserViewControllerState.fight:
      buttons = <FightButtons />;
      message = "Fight";
      break;
    case UserViewControllerState.friends:
      buttons = <FriendsButtons />;
      message = "Friends";
      break;
    case UserViewControllerState.actions:
      buttons = <ActionsButton />;
      message = "Actions";
      break;
    case UserViewControllerState.run:
      message = "";
      buttons = (
        <AnimatedTextController
          className="w-full"
          onCompleteAction={() => {
            gameManager.changeScreen(new MapScreen());
          }}
        >
          Your power of friendship is too weak.
        </AnimatedTextController>
      );
      break;
  }

  return (
    <div
      className="pl-2 flex flex-col h-full pointer-events-auto text-2xl"
      style={{
        flex: 4,
      }}
    >
      <span>
        {![UserViewControllerState.index, UserViewControllerState.run].includes(
          state,
        ) && (
          <>
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="mr-2 cursor-pointer"
              onClick={() => setState(UserViewControllerState.index)}
            />
          </>
        )}
        {state !== UserViewControllerState.run && (
          <span className="text-xl">{message}</span>
        )}
      </span>
      {buttons}
    </div>
  );
}

function UserStatsView({
  style,
}: {
  style?: React.CSSProperties;
}): JSX.Element {
  return (
    <div
      className="border-r-4 pr-2 flex flex-col transition-transform duration-300"
      style={{
        ...style,
        flex: 2,
      }}
    >
      <h3 className="text-2xl pointer-events-auto">INSERT CHARACTER NAME</h3>
      <HealthBar percentage={44 / 50} />
      <p className="font-numerals pointer-events-auto">
        <span>44/50</span>
        <span>{/* effect icons here */}</span>
      </p>
      <div className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse">
        <p>Example Log 1</p>
        <p>Example Log 2</p>
      </div>
    </div>
  );
}

interface UserViewButtonProps {
  className: string;
  setState: React.Dispatch<React.SetStateAction<UserViewControllerState>>;
}

function IndexButtons({ className, setState }: UserViewButtonProps) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 text-center h-full">
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.fight)}
      >
        Fight
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.friends)}
      >
        Friends
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.actions)}
      >
        Actions & Items
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.run)}
      >
        Run
      </TextActionButton>
    </div>
  );
}

function FriendsButtons() {
  const className = "w-32";
  return (
    <div className="h-full overflow-x-auto grid grid-cols-1">
      <div className="gap-2 text-center h-full grid grid-flow-col grid-rows-1">
        <TextActionButton className={className}>
          Selected Friend
        </TextActionButton>
        <TextActionButton className={className}>Friend 2</TextActionButton>
        <TextActionButton className={className}>Friend 3</TextActionButton>
        <TextActionButton className={className}>Friend 4</TextActionButton>
        <TextActionButton className={className}>Friend 5</TextActionButton>
        <TextActionButton className={className}>Friend 6</TextActionButton>
        <TextActionButton className={className}>Friend 7</TextActionButton>
        <TextActionButton className={className}>Friend 8</TextActionButton>
      </div>
    </div>
  );
}

function ActionsButton() {
  return (
    <div className="text-center h-full overflow-y-auto">
      <h4 className="text-left">Actions</h4>
      <div className="flex gap-2">
        <TextActionButton className="min-w-24">Rizz</TextActionButton>
        <TextActionButton className="min-w-24">Pass</TextActionButton>
      </div>
      <h4 className="text-left">Items</h4>
      <div className="grid grid-cols-4 gap-2">
        <TextActionButton>Item</TextActionButton>
        <TextActionButton>Item</TextActionButton>
        <TextActionButton>Item</TextActionButton>
        <TextActionButton>Item</TextActionButton>
        <TextActionButton>Item</TextActionButton>
        <TextActionButton>Item</TextActionButton>
      </div>
    </div>
  );
}

function FightButtons() {
  const className = "min-h-14";
  return (
    <div className="grid grid-cols-3 gap-2 text-center h-full">
      <TextActionButton className={className}>Attack 1</TextActionButton>
      <TextActionButton className={className}>Attack 2</TextActionButton>
      <TextActionButton className={className}>Debuff 1</TextActionButton>
      <TextActionButton className={className}>Buff 1</TextActionButton>
      <TextActionButton className={className}>Attack 3</TextActionButton>
      <TextActionButton className={className}>Attack 4</TextActionButton>
    </div>
  );
}
