import { GameManager } from "../../engine/game_manager";
import { chance } from "./chance";
import { Character } from "./character";
import { MapSpecialActionBattle } from "./map_types";

interface BattleData {
  opponentLeader: Character;
  opponentTeam?: Character[];
  playerTeam: Character[];
  rewardTable: string | null;
}

export enum BattleEvents {
  change = "change",
}

/**
 * Represents a battle between the player and an enemy.
 *
 * Handles data and gameplay logic.
 */
export class Battle extends EventTarget implements BattleData {
  opponentLeader: Character;
  opponentTeam: Character[];
  playerTeam: Character[];
  rewardTable: string | null;

  activeOpponent: Character | null = null;
  activePlayer: Character | null = null;
  logs: string[] = [];

  constructor({
    opponentLeader,
    opponentTeam,
    playerTeam,
    rewardTable,
  }: BattleData) {
    super();
    this.opponentLeader = opponentLeader;
    this.opponentTeam = opponentTeam ?? [opponentLeader];
    this.playerTeam = playerTeam;
    this.rewardTable = rewardTable ?? null;
  }

  triggerChange() {
    this.dispatchEvent(new CustomEvent(BattleEvents.change));
  }

  getNextOpponent(): Character | null {
    const nextValidOpponent = this.opponentTeam.find((character) =>
      this.isCharacterValidBattleCandidate(character),
    );
    return nextValidOpponent ?? null;
  }

  getNextPlayer(): Character | null {
    const nextValidPlayer = this.playerTeam.find((character) =>
      this.isCharacterValidBattleCandidate(character),
    );
    return nextValidPlayer ?? null;
  }

  isCharacterValidBattleCandidate(character: Character): boolean {
    return !character.isDead && character.hp > 0;
  }

  static fromBattleData(
    data: MapSpecialActionBattle,
    gameManager: GameManager,
  ): Battle {
    const { against, reward_table, level, size } = data;
    const playerLove = gameManager.gameData.you.love;
    let enemyLeader: Character;
    let enemyTeam: Character[] = [];
    let love: number | null = null;
    if (level === null) {
      love = chance.integer({ min: playerLove - 1, max: playerLove + 2 });
    }
    if (against === "random") {
      const enemySize = Array.isArray(size)
        ? chance.integer({ min: size[0], max: size[1] })
        : size;
      for (let i = 0; i < enemySize; i++) {
        love = Array.isArray(level)
          ? chance.integer({ min: level[0], max: level[1] })
          : level;
        const enemy = Character.createRandomCharacter(love ?? 1);
        enemyTeam.push(enemy);
      }
      if (enemyTeam.length === 1) {
        enemyLeader = enemyTeam[0];
      } else {
        enemyLeader = Character.createRandomCharacter(love ?? 1);
      }
    } else {
      throw new Error("Not implemented");
    }
    // TODO: remove this later when we have a way to add friends
    if (gameManager.gameData.activeFriends.length === 0) {
      gameManager.gameData.activeFriends.push(
        Character.createRandomCharacter(1),
      );
    }
    return new Battle({
      playerTeam: gameManager.gameData.activeFriends,
      opponentLeader: enemyLeader,
      opponentTeam: enemyTeam,
      rewardTable: reward_table,
    });
  }
}
