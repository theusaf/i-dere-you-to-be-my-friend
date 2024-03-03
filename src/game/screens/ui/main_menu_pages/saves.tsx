import { useEffect, useState } from "react";
import { getSaveList, load } from "../../../util/saves";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { RawGameDataContent } from "../../../util/game_data";

export function SavesPage({
  onSaveSelected,
  onNewSave,
}: {
  onSaveSelected: (save: RawGameDataContent) => void;
  onNewSave: () => void;
}): JSX.Element {
  const [saves, setSaves] = useState<string[]>([]);
  useEffect(() => {
    const saveList = getSaveList();
    saveList.then((saves) => {
      setSaves(saves);
    });
  }, []);
  return (
    <div className="overflow-x-auto h-full w-full flex flex-row row-span-3 col-span-5 row-start-3 gap-2 pb-4 pt-10 px-2">
      <div className="bg-slate-500 rounded p-4 w-36">
        <div
          className="flex flex-col items-center h-full cursor-pointer bg-slate-600 rounded"
          onClick={onNewSave}
        >
          <div className="m-auto flex items-center flex-col">
            <h3>New Save</h3>
            <FontAwesomeIcon icon={faPlusCircle} className="w-12 h-12" />
          </div>
        </div>
        {saves.map((save) => {
          return (
            <div
              key={save}
              className="flex flex-col items-center h-full cursor-pointer bg-slate-600 rounded"
              onClick={async () => {
                const saveData = await load<RawGameDataContent>(save);
                onSaveSelected(saveData!);
              }}
            >
              <div>{save}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
