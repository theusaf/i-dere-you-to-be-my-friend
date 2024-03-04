import { useEffect, useReducer, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";
import { TextActionButton } from "../../../engine/components/action_button";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";
import { GameManager } from "../../../engine/game_manager";
import { MapScreen } from "../map_screen";
import { ConfirmationButton } from "../../../engine/components/confirmation_button";
import { Character } from "../../util/character";
import { Battle } from "../../util/battle";

// TODO: clean up this code...
export interface BattleScreenContentProps {
  state: BattleScreen;
}

enum BattleScreenUIState {
  init,
}

export function BattleScreenContent({
  state,
}: BattleScreenContentProps): JSX.Element {
  const [showUI, setShowUI] = useState(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const { gameManager } = state;
  const { battle: battleData } = gameManager.gameData;
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.state == BattleScreenState.battle) {
        setShowUI(true);
      } else if (state.state == BattleScreenState.loadingOut) {
        setShowUI(false);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-rows-5 h-full text-white">
      <EnemyView show={showUI} activeEnemy={battleData!.activeOpponent} />
      <UserView gameManager={gameManager} show={showUI} />
    </div>
  );
}

interface ToggleableUIProps {
  show?: boolean;
}

interface EnemyViewProps extends ToggleableUIProps {
  activeEnemy: Character | null;
}

function EnemyView({ show, activeEnemy }: EnemyViewProps) {
  return (
    <div
      className="grid grid-cols-7 transition-transform duration-300"
      style={{
        transform: show && activeEnemy ? "translateX(0)" : "translateY(-100%)",
      }}
    >
      <div className="col-span-3 m-4 bg-slate-500 outline outline-4 outline-neutral-400 overflow-y-auto p-2 pointer-events-auto">
        {activeEnemy && (
          <>
            <span>
              <h3 className="text-xl">{activeEnemy.name}</h3>
              <span>{/* type icons here */}</span>
            </span>
            <div className="grid grid-cols-5">
              <HealthBar
                className="col-span-4 m-auto"
                percentage={activeEnemy.hp / activeEnemy.stats.maxHealth}
              />
              <p className="text-center">Lov. {activeEnemy.love}</p>
            </div>
            <div>{/* other icons here */}</div>
          </>
        )}
      </div>
    </div>
  );
}

interface UserViewProps extends ToggleableUIProps {
  gameManager: GameManager;
}

function UserView({ gameManager, show }: UserViewProps): JSX.Element {
  return (
    <div
      className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2 transition-transform duration-300"
      style={{
        transform: show ? "translateX(0)" : "translateY(100%)",
      }}
    >
      <div className="flex w-full h-full">
        <UserStatsView
          activeCharacter={gameManager.gameData.battle!.activePlayer}
          battle={gameManager.gameData.battle!}
        />
        <UserViewButtonController gameManager={gameManager} show={show} />
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
  logs,
  wait,
}

function UserViewButtonController({
  gameManager,
  show,
}: UserViewProps): JSX.Element {
  const [logIndex, setLogIndex] = useState(0);
  const [state, setState] = useState(UserViewControllerState.index);
  const className = "align-middle flex flex-col place-content-center";
  const logs = gameManager.gameData.battle!.logs;
  useEffect(() => {
    if (logs.length > logIndex) {
      setState(UserViewControllerState.logs);
    }
  }, [logs.length, logIndex]);

  console.log(logs, logIndex, state);

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
    case UserViewControllerState.wait:
      message = "...";
      buttons = <></>;
      break;
    case UserViewControllerState.logs:
      message = "";
      const log = logs[logIndex];
      buttons = show ? (
        <AnimatedTextController
          onComplete={() => {
            setTimeout(() => {
              if (logIndex < logs.length - 1) {
                setLogIndex(logIndex + 1);
              } else {
                setState(UserViewControllerState.index);
              }
            }, 1000);
          }}
        >
          {log}
        </AnimatedTextController>
      ) : (
        <></>
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
  activeCharacter,
  battle,
}: {
  style?: React.CSSProperties;
  activeCharacter: Character | null;
  battle: Battle;
}): JSX.Element {
  return (
    <div
      className="border-r-4 pr-2 flex flex-col transition-transform duration-300"
      style={{
        ...style,
        flex: 2,
      }}
    >
      <h3 className="text-2xl pointer-events-auto">{activeCharacter?.name}</h3>
      {activeCharacter && (
        <HealthBar
          percentage={activeCharacter.hp / activeCharacter.stats.maxHealth}
        />
      )}
      {activeCharacter && (
        <p className="font-numerals pointer-events-auto">
          <span>
            Lov. {activeCharacter.love} | {activeCharacter.hp}/
            {activeCharacter.stats.maxHealth}
          </span>
          <span>{/* effect icons here */}</span>
        </p>
      )}
      <div className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse">
        {battle.logs.map((log, i) => {
          return (
            <p key={i} className="text-sm">
              {log}
            </p>
          );
        })}
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
      <ConfirmationButton
        className={className}
        onClick={() => setState(UserViewControllerState.run)}
      >
        Run
      </ConfirmationButton>
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
