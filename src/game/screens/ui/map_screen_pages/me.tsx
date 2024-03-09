import { HealthBar } from "../../../../engine/components/health_bar";
import { NumberSpan } from "../../../../engine/components/numer_span";
import { Character, getGenderedString } from "../../../util/character";

export function MePagePhone({ me }: { me: Character }): JSX.Element {
  const { gender, name, love, xPower } = me;
  const requiredXP = me.getRequiredXP();
  return (
    <div className="flex items-center flex-col h-full overflow-x-auto">
      <h3 className="text-xl underline">About Me</h3>
      <div className="text-left w-full">
        <p>Name: {name}</p>
        <p>
          Pronouns:{" "}
          {getGenderedString({
            gender: gender,
            type: "pronoun",
            name: name,
          })}
          /
          {getGenderedString({
            gender: gender,
            type: "object",
            name: name,
          })}
        </p>
        <p>
          Love: <NumberSpan>{love}</NumberSpan>
        </p>
        <div>
          <HealthBar percentage={xPower / requiredXP} />
          <p>
            X Points:{" "}
            <NumberSpan>
              {xPower}/{requiredXP}
            </NumberSpan>
          </p>
        </div>
      </div>
    </div>
  );
}
