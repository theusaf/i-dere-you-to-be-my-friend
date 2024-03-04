import { ColorSchemeString } from "../../game/util/style";
import { DereType, getTypeData } from "../../game/util/types";

const TypeIconColors: Record<DereType, [string, string]> = {
  [DereType.bakadere]: ["#ff2919", ColorSchemeString.dark],
  [DereType.tsundere]: ["#e67e00", ColorSchemeString.dark],
  [DereType.yandere]: ["#871200", ColorSchemeString.dark],
  [DereType.sdere]: ["#cc00b4", ColorSchemeString.dark],
  [DereType.kuudere]: ["#1d29ab", ColorSchemeString.dark],
  [DereType.mdere]: ["#e5ff00", ColorSchemeString.dark],
  [DereType.gandere]: ["#737373", ColorSchemeString.dark],
  [DereType.bokodere]: ["#6b472b", ColorSchemeString.dark],
  [DereType.deredere]: ["#f26bd9", ColorSchemeString.dark],
  [DereType.normal]: ["white", ColorSchemeString.dark],
};

export function TypeIcon({ type }: { type: DereType }): JSX.Element {
  const color = TypeIconColors[type];
  return (
    <span
      className="border-2 rounded px-3 pt-1"
      style={{
        color: color[0],
        borderColor: color[0],
        backgroundColor: color[1],
      }}
    >
      {getTypeData(type).name}
    </span>
  );
}
