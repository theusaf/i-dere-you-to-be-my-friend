import { TraitData } from "./moves";

export enum StatusEffect {
  // negative
  poisoned = "poisoned",
  bleeding = "bleeding",
  confused = "confused",
  stunned = "stunned",
  weakened = "weakened",
  vulnerable = "vulnerable",
  reload = "reload",
  // positive
  strengthened = "strengthened",
  toughened = "toughened",
  elated = "elated",
  criticalUp = "criticalUp",
  damageReflect = "damageReflect",
}

export interface ActiveStatusEffect {
  effect: StatusEffect;
  /**
   * Due to some bad design, when zero, it means that the effect will be removed at the end of the next turn after becoming zero
   */
  duration: number;
  traitData?: TraitData;
}
