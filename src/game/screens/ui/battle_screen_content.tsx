import { useEffect } from "react";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";

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
      <div className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2">
        <div className="flex w-full h-full">
          <div
            className="border-r-4 pr-2 flex flex-col"
            style={{
              flex: 2,
            }}
          >
            <h3 className="text-2xl pointer-events-auto">
              INSERT CHARACTER NAME
            </h3>
            <HealthBar percentage={44/50} />
            <p className="font-numerals pointer-events-auto">
              <span>44/50</span>
              <span>{/* effect icons here */}</span>
            </p>
            <div className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse">
              <p>Example Log 1</p>
              <p>Example Log 2</p>
            </div>
          </div>
          <div
            className="pl-2"
            style={{
              flex: 4,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
