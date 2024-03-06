import { useState } from "react";
import { Unselectable } from "./unselectable";
import { TextActionButton } from "./action_button";

export function FriendContract({
  initialName,
  contractee,
  onContractSigned,
}: {
  initialName: string;
  contractee: string;
  onContractSigned: (name: string) => void;
}): JSX.Element {
  const [name, setName] = useState<string>(initialName);
  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen p-8 pointer-events-none z-20"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        className="m-auto h-full pointer-events-auto relative"
        style={{
          aspectRatio: "72/128",
        }}
      >
        <div className="h-full absolute top-0 left-0 z-10">
          <img src="./assets/images/ui/scroll.png" className="h-full" />
        </div>
        <div className="z-20 absolute top-0 left-0 w-full h-full p-4 text-white text-center flex flex-col content-between">
          <div className="flex-1 overflow-y-auto">
            <Unselectable>
              <h3 className="text-2xl mb-2">Friendship Contract</h3>
              <p>
                I affirm that by signing this contract, I am to become a FRIEND
                of {contractee}.
              </p>
              <p>
                As a friend, I will dutifully carry out combat for my FRIEND,{" "}
                {contractee}, with my life at stake. Neither I, nor any relative
                will sue my FRIEND for any loss of life or other damages. As
                compensation for being a friend, my FRIEND will provide me with
                a good time and an exciting adventure.
              </p>
              <p>
                I am obligated to drop everything I do when my FRIEND calls me
                to go on an adventure.
              </p>
            </Unselectable>
          </div>
          <div className="overflow-x-auto">
            Signed,{" "}
            <div className="flex gap-2">
              <input
                className="flex-1 outline-none bg-transparent text-xl border-b-white border-b-2 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextActionButton
                className="cursor-pointer"
                onClick={() => onContractSigned(name)}
              >
                Confirm
              </TextActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
