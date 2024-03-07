import { useEffect, useState } from "react";
import { getSaveList, isSaveCompatible, load } from "../../../util/saves";
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
  const [saves, setSaves] = useState<RawGameDataContent[]>([]);
  useEffect(() => {
    const saveList = getSaveList().then((list) => {
      return Promise.all(
        list.map(
          async (save) =>
            (await load<RawGameDataContent>(save)) as RawGameDataContent,
        ),
      );
    });
    saveList.then((saves) => {
      setSaves(
        saves.filter((save) => {
          return isSaveCompatible(save.version ?? "0.0.1");
        }),
      );
    });
  }, []);
  return (
    <div className="overflow-x-auto h-full w-full flex row-span-3 col-span-5 row-start-3 pb-4 pt-10 px-2">
      <div className="bg-slate-500 rounded p-4 flex flex-row gap-4">
        <div
          className="flex flex-col items-center h-full cursor-pointer w-36 bg-slate-600 rounded"
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
              key={save.saveId}
              className="flex flex-col items-center p-4 h-full cursor-pointer w-36 bg-slate-600 rounded"
              onClick={async () => {
                onSaveSelected(save);
              }}
            >
              <div
                style={{
                  wordBreak: "break-all",
                }}
              >
                <h3 className="text-xl">{save.you.name}</h3>
                <p className="text-center">&amp;</p>
                <h3 className="text-xl">{save.mainNPC.name}</h3>
                <hr />
                <p>Lov. {save.you.love}</p>
                <p>Friends: {save.friends.length}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
