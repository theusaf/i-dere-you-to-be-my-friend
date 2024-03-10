import { useState } from "react";
import { GameData } from "../../../util/game_data";
import { TextActionButton } from "../../../../engine/components/action_button";

export function DoctorPagePhone({ gameData }: { gameData: GameData }) {
  const [message, setMessage] = useState("");
  const { activeFriends } = gameData;
  const doctor = activeFriends.find((friend) => friend.id === "doctor");
  if (!doctor) {
    return (
      <div className="flex items-center flex-col h-full">
        <h2 className="text-2xl underline mb-2">Doctor</h2>
        <div>
          <em>The doctor is out.</em>
          <p>
            Tip: You can only use the doctor when they are travelling with you
            (in your active party).
          </p>
        </div>
      </div>
    );
  } else if (doctor.isDead) {
    return (
      <div className="flex items-center flex-col h-full">
        <h2 className="text-2xl underline mb-2">Doctor</h2>
        <div>
          <em>The doctor is out.</em>
          <p>May {doctor.name} rest in peace.</p>
          <p>Tip: Certain NPC abilities don't work if they are dead!</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center flex-col h-full">
        <h2 className="text-2xl underline mb-2">Doctor</h2>
        <TextActionButton
          onClick={() => {
            gameData.healActiveFriends(true);
            setMessage("Your friends have been healed at no cost!");
          }}
        >
          Get Checkup
        </TextActionButton>
        <div>{message}</div>
      </div>
    );
  }
}
