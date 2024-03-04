import { GameManager } from "../../engine/game_manager";
import { chance } from "./chance";
import {
  ActiveStatusEffect,
  Character,
  StatusEffect,
  getGenderedString,
} from "./character";
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

export type BattlePlayback = [string, () => void][];

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

  /**
   * Calculates the outcome of a turn.
   *
   * @returns An array of strings and functions representing the logs of the turn and a function to execute the steps.
   */
  simulateTurn(playerMove: MoveData): BattlePlayback {
    const playback: BattlePlayback = [];
    const playerCopy = this.activePlayer!.clone();
    const opponentCopy = this.activeOpponent!.clone();
    const opponentMove = this.getOpponentMove();

    // calculate base speed
    let playerSpeed = this.calculateMoveBaseSpeed(playerCopy, playerMove);
    let opponentSpeed = this.calculateMoveBaseSpeed(opponentCopy, opponentMove);

    // calculate speed from effects
    playerSpeed = this.calculateEffectSpeed(playerCopy, playerSpeed);
    opponentSpeed = this.calculateEffectSpeed(opponentCopy, opponentSpeed);

    // determine order
    const orderOfPlayers = [];
    if (playerSpeed >= opponentSpeed) {
      orderOfPlayers.push(playerCopy, opponentCopy);
    } else {
      orderOfPlayers.push(opponentCopy, playerCopy);
    }

    for (const character of orderOfPlayers) {
      const moveSimulation = this.simulateMove(
        character === playerCopy ? playerMove : opponentMove,
        character === playerCopy ? playerCopy : opponentCopy,
        character === playerCopy ? opponentCopy : playerCopy,
      );
      playback.push(...moveSimulation);
    }

    return playback;
  }

  simulateMove(
    move: MoveData,
    user: Character,
    opponent: Character,
  ): BattlePlayback {
    const playback: BattlePlayback = [];
    const movesets = getMovesets();

    // check for stun
    if (this.hasEffect(StatusEffect.stunned, user)) {
      playback.push([`${user.name} is stunned and can't move!`, () => {}]);
      return playback;
    }

    // check for confusion
    if (this.hasEffect(StatusEffect.confused, user)) {
      playback.push([`${user.name} is confused...`, () => {}]);
      if (chance.bool({ likelihood: 50 })) {
        move = movesets._confusion;
      }
    }

    return playback;
  }

  // might be used for speed-changing effects, but currently just does stun
  calculateEffectSpeed(user: Character, speed: number): number {
    if (this.hasEffect(StatusEffect.stunned, user)) {
      return 0;
    }
    return speed;
  }

  hasEffect(effect: StatusEffect, character: Character): boolean {
    return character.statusEffects.some((activeEffect) => {
      return activeEffect.effect === effect;
    });
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
