import { Assets } from "pixi.js";

export enum DereType {
  bakadere = "bakadere",
  tsundere = "tsundere",
  yandere = "yandere",
  sdere = "sdere",
  kuudere = "kuudere",
  mdere = "mdere",
  gandere = "gandere",
  bokodere = "bokodere",
  deredere = "deredere",
  normal = "normal",
}

export interface DereTypeData {
  name: string;
  resists: DereType[];
  weak_to: DereType[];
}

export function getTypeData(type: DereType): DereTypeData {
  const types = Assets.get<Record<DereType, DereTypeData>>("game/types");
  return types[type];
}

export function calculateDamageMultiplier(
  attackType: DereType,
  defenderTypes: DereType[],
): number {
  let multiplier = 1;
  for (const defenderType of defenderTypes) {
    const typeData = getTypeData(defenderType);
    if (typeData.resists.includes(attackType)) {
      multiplier *= 0.75;
    } else if (typeData.weak_to.includes(attackType)) {
      multiplier *= 1.5;
    }
  }
  return multiplier;
}
