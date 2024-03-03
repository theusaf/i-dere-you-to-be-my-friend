import { chance } from "./chance";
import { getRandomMoves } from "./moves";
import { DereType } from "./types";

export interface worldMapData {
  playerX: number;
  playerY: number;
}

export class GameData {
  worldMapData: worldMapData;
  battleData?: Battle;

  constructor() {
    this.worldMapData = {
      playerX: 64,
      playerY: 64,
    };
  }
}

interface BattleData {
  opponentLeader: Character;
  opponentTeam?: Character[];
  playerTeam: Character[];
  rewardTable?: string;
}

export class Battle implements BattleData {
  opponentLeader: Character;
  opponentTeam: Character[];
  playerTeam: Character[];
  rewardTable?: string;

  constructor({
    opponentLeader,
    opponentTeam,
    playerTeam,
    rewardTable,
  }: BattleData) {
    this.opponentLeader = opponentLeader;
    this.opponentTeam = opponentTeam ?? [opponentLeader];
    this.playerTeam = playerTeam;
    this.rewardTable = rewardTable;
  }
}

export interface CharacterStats {
  /**
   * Base speed to determine action order.
   */
  speed: number;
  /**
   * The character constitution.
   *
   * Affects health gain and resistances.
   */
  constitution: number;
  maxHealth: number;
}

export enum Gender {
  she = "she",
  they = "they",
  he = "he",
  none = "none",
}

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

export interface CharacterInfo {
  hp?: number;
  name?: string;
  types?: DereType[];
  isDead?: boolean;
  xPower?: number;
  love?: number;
  stats?: CharacterStats;
  statusEffects?: { effect: StatusEffect; duration: number }[];
  gender?: Gender;
  knownMoves?: string[];
}

export class Character implements CharacterInfo {
  hp: number;
  name: string;
  types: DereType[];
  isDead: boolean;
  /**
   * The character's love for their friend
   *
   * Basically the character's level
   * This can be decreased...
   */
  love: number;
  /**
   * The character's experience points
   */
  xPower: number;
  stats: CharacterStats;
  gender: Gender;
  knownMoves: string[];
  statusEffects: { effect: StatusEffect; duration: number }[];

  constructor({
    hp,
    name,
    types,
    isDead,
    xPower,
    love,
    stats,
    gender,
    knownMoves,
    statusEffects,
  }: CharacterInfo) {
    this.hp = hp ?? 1;
    this.name = name ?? "Unnamed";
    this.types = types ?? [];
    this.isDead = isDead ?? false;
    this.xPower = xPower ?? 0;
    this.love = love ?? 1;
    this.stats = stats ?? { speed: 1, constitution: 1, maxHealth: 10 };
    this.gender = gender ?? Gender.they;
    this.knownMoves = knownMoves ?? [];
    this.statusEffects = statusEffects ?? [];
  }

  static createRandomCharacter(love: number = 1): Character {
    const name = chance.name({
      gender: chance.pickone(["male", "female", undefined]),
      full: true,
      nationality: "en",
      prefix: chance.bool({ likelihood: 10 }),
      suffix: chance.bool({ likelihood: 5 }),
    });
    const types = chance.pickset(
      Object.values(DereType),
      chance.integer({ min: 1, max: 2 }),
    );
    let minMovesByLove = Math.floor(love / 2);
    if (minMovesByLove < 2) minMovesByLove = 2;
    if (minMovesByLove > 6) minMovesByLove = 6;
    const numMoves = chance.integer({ min: minMovesByLove, max: 6 });
    const moves = getRandomMoves(types, numMoves);
    const character = new Character({
      love: 1,
      name,
      types,
      stats: {
        speed: chance.integer({ min: 1, max: 3 }),
        constitution: chance.integer({ min: 1, max: 3 }),
        maxHealth: chance.integer({ min: 10, max: 13 }),
      },
      knownMoves: moves.map((move) => move.name),
    });
    for (let i = 1; i < love; i++) {
      character.loveUp();
    }
    return character;
  }

  loveUp(): (keyof CharacterStats)[] {
    this.love++;
    this.stats.maxHealth += this.stats.constitution;
    const statKeys = Object.keys(this.stats) as (keyof CharacterStats)[];
    const upgradeStats = chance.pickset(
      statKeys,
      chance.integer({ min: 1, max: statKeys.length }),
    );
    for (const stat of upgradeStats) {
      this.stats[stat]++;
    }
    return upgradeStats;
  }

  loveDown(): (keyof CharacterStats)[] {
    this.love--;
    this.stats.maxHealth -= this.stats.constitution;
    const statKeys = (
      Object.keys(this.stats) as (keyof CharacterStats)[]
    ).filter((stat) => this.stats[stat] > 1);
    const upgradeStats = chance.pickset(
      statKeys,
      chance.integer({ min: 1, max: statKeys.length }),
    );
    for (const stat of upgradeStats) {
      this.stats[stat]++;
    }
    return upgradeStats;
  }
}
