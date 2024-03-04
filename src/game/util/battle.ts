import { GameManager } from "../../engine/game_manager";
import { chance } from "./chance";
import { Character, getGenderedString } from "./character";
import { MapSpecialActionBattle } from "./map_types";
import { MoveData, getMovesets } from "./moves";
import { DereType, TYPE_ADV_BOOST, TYPE_DISADV_BOOST } from "./types";

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

  addLog(log: string) {
    this.logs.push(log);
  }

  /**
   * Triggers a change event to notify listeners that the battle has been updated.
   *
   * Typically called by outside classes.
   */
  triggerChange() {
    this.dispatchEvent(new CustomEvent(BattleEvents.change));
  }

  // start of battle

  noteIntro(): void {
    const isEnemyAlone = this.opponentTeam.length === 1;
    const { name } = this.opponentLeader;
    this.addLog(
      isEnemyAlone
        ? `A wild ${name} appeared!`
        : `${name}'s friend group appeared!`,
    );
  }

  updateNextOpponent(): void {
    const isEnemyAlone = this.opponentTeam.length === 1;
    const { name, gender } = this.opponentLeader;
    this.activeOpponent = this.getNextOpponent();
    // TODO: handle null (end of battle)
    this.addLog(
      isEnemyAlone
        ? `${name} may have no friends, but ${getGenderedString({
            gender: gender,
            type: "pronoun",
            name: name,
          })} can still fight!`
        : `${name} sends out ${getGenderedString({
            gender: gender,
            type: "possesive",
            name: name,
          })} friend, ${this.activeOpponent!.name}!`,
    );
  }

  updateNextPlayer(): void {
    const nextPlayer = this.getNextPlayer();
    this.activePlayer = nextPlayer;
    // TODO: handle null (end of battle)
    this.addLog(`You got this, ${nextPlayer!.name}!`);
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

  // combat simulations

  simulateMove(playerMove: MoveData) {
    const {
      statusEffects: statusEffectsPlayer,
      hp: hpPlayer,
      moveUses: moveUsesPlayer,
      stats: statsPlayer,
    } = this.activePlayer!;
    const {
      statusEffects: statusEffectsOpponent,
      hp: hpOpponent,
      moveUses: moveUsesOpponent,
      stats: statsOpponent,
      knownMoves: knownMovesOpponent,
    } = this.activeOpponent!;

    // calculate speed
    let playerSpeed = this.calculateMoveBaseSpeed(
      this.activePlayer!,
      playerMove,
    );
  }

  getOpponentMove(): MoveData {
    const { knownMoves } = this.activeOpponent!;
    const move = chance.pickone(knownMoves);
    return getMovesets()[move];
  }

  calculateMoveBaseSpeed(character: Character, move: MoveData) {
    const { types } = character;
    const { speed: moveSpeed, type: moveType } = move;
    let speed = character.stats.speed;
    if (types.includes(move.type)) {
      speed += moveSpeed * TYPE_ADV_BOOST;
    } else if (moveType === DereType.normal) {
      speed += moveSpeed;
    } else {
      speed += moveSpeed * TYPE_DISADV_BOOST;
    }
    return speed;
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
    if (gameManager.gameData.friends.length === 0) {
      const character = Character.createRandomCharacter(1);
      character.isActive = true;
      gameManager.gameData.friends.push(character);
    }
    return new Battle({
      playerTeam: gameManager.gameData.activeFriends,
      opponentLeader: enemyLeader,
      opponentTeam: enemyTeam,
      rewardTable: reward_table,
    });
  }
}
