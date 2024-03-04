import { GameManager } from "../../engine/game_manager";
import { chance } from "./chance";
import { Character, getGenderedString } from "./character";
import { ActiveStatusEffect, StatusEffect } from "./effects";
import { GameData } from "./game_data";
import { MapSpecialActionBattle } from "./map_types";
import { MoveData, TraitData, TraitKind, getMovesets } from "./moves";
import {
  DereType,
  ADV_BOOST,
  DISADV_BOOST,
  calculateDamageMultiplier,
} from "./types";

interface BattleData {
  opponentLeader: Character;
  opponentTeam?: Character[];
  playerTeam: Character[];
  rewardTable: string | null;
  gameData: GameData;
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
  gameData: GameData;

  activeOpponent: Character | null = null;
  activePlayer: Character | null = null;
  logs: string[] = [];

  constructor({
    opponentLeader,
    opponentTeam,
    playerTeam,
    rewardTable,
    gameData,
  }: BattleData) {
    super();
    this.opponentLeader = opponentLeader;
    this.opponentTeam = opponentTeam ?? [opponentLeader];
    this.playerTeam = playerTeam;
    this.rewardTable = rewardTable ?? null;
    this.gameData = gameData;
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

  // rewards

  getRewards() {
    if (this.rewardTable === null) {
      this.addLog("The opponent disappeared, leaving nothing behind.");
      return;
    }
  }

  getExperience(opponent: Character, character: Character) {
    // TODO: handle other bonuses in the future
    const xpGained = character.calculateGainedXP(opponent.love);
    this.addLog(`${character.name} gained ${xpGained} x points!`);
    const initialLove = character.love;
    character.addXP(xpGained);
    const afterLove = character.love;
    if (initialLove !== afterLove) {
      this.addLog(
        `${getGenderedString({
          gender: character.gender,
          type: "possesive",
          name: character.name,
        })} love grew by a factor of ${afterLove - initialLove}!`,
      );
    }
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
      const characterIsPlayer = character === playerCopy;
      const moveSimulation = this.simulateMove(
        characterIsPlayer ? playerMove : opponentMove,
        characterIsPlayer ? playerCopy : opponentCopy,
        characterIsPlayer ? opponentCopy : playerCopy,
        characterIsPlayer ? this.activePlayer! : this.activeOpponent!,
        characterIsPlayer ? this.activeOpponent! : this.activePlayer!,
      );
      playback.push(...moveSimulation);
    }

    playback.push(
      ...this.simulateEndOfTurnEffects(
        playerCopy,
        opponentCopy,
        this.activePlayer!,
        this.activeOpponent!,
      ),
    );

    return playback;
  }

  simulateEndOfTurnEffects(
    player: Character,
    opponent: Character,
    realPlayer: Character,
    realOpponent: Character,
  ): BattlePlayback {
    const playback: BattlePlayback = [];
    const playerEffects = player.statusEffects;
    const opponentEffects = opponent.statusEffects;
    const applyEffects = (
      effects: ActiveStatusEffect[],
      target: Character,
      realTarget: Character,
    ) => {
      if (target.hp <= 0) return;
      for (const effect of effects) {
        switch (effect.effect) {
          case StatusEffect.bleeding: {
            target.hp -= 5;
            playback.push([
              `${target.name} lost some blood from bleeding.`,
              () => {
                realTarget.hp -= 5;
              },
            ]);
            break;
          }
          case StatusEffect.elated: {
            target.hp -= 2;
            playback.push([
              `${target.name} damages ${getGenderedString({
                gender: target.gender,
                type: "objectself",
                name: target.name,
              })} from excessive recklessness.`,
              () => {
                realTarget.hp -= 2;
              },
            ]);
            break;
          }
          case StatusEffect.poisoned: {
            const duration = effect.duration;
            target.hp -= 2 + duration;
            playback.push([
              `${target.name} was hurt by poison.`,
              () => {
                realTarget.hp -= 2 + duration;
              },
            ]);
            break;
          }
        }
        if (target.hp <= 0) {
          playback.push(...this.handleKnockout(target, realTarget, false));
          break;
        }
        effect.duration -= 1;
        if (effect.duration < 0) {
          playback.push([
            `${target.name}'s ${effect.effect} effect wore off.`,
            () => {},
          ]);
        }
      }
      target.statusEffects = effects.filter((effect) => effect.duration > 0);
      playback.push([
        "",
        () => {
          realTarget.statusEffects = effects.filter(
            (effect) => effect.duration >= 0,
          );
        },
      ]);
    };
    applyEffects(playerEffects, player, realPlayer);
    applyEffects(opponentEffects, opponent, realOpponent);
    return playback;
  }

  // TODO: Extract effects and traits out into defined effects using mappings
  simulateMove(
    move: MoveData,
    user: Character,
    opponent: Character,
    realUser: Character,
    realOpponent: Character,
  ): BattlePlayback {
    const playback: BattlePlayback = [];
    const movesets = getMovesets();

    if (user.hp <= 0) return playback;

    // check for stun
    if (this.hasEffect(StatusEffect.stunned, user)) {
      playback.push([`${user.name} is stunned and can't move!`, () => {}]);
      return playback;
    }

    // check for reload
    if (this.hasEffect(StatusEffect.reload, user)) {
      playback.push([`${user.name} is reloading...`, () => {}]);
      return playback;
    }

    // check for confusion
    if (this.hasEffect(StatusEffect.confused, user)) {
      playback.push([`${user.name} is confused...`, () => {}]);
      if (chance.bool({ likelihood: 50 })) {
        move = movesets._confusion;
      }
    }

    // execute the move
    const { might, type, targets, traits } = move;
    const target = targets === "self" ? user : opponent;
    const realTarget = targets === "self" ? realUser : realOpponent;

    let critChance = 1 / 20,
      isCrit = false,
      typeMultiplier = calculateDamageMultiplier(type, target.types),
      damage = typeMultiplier * might,
      numberOfMultiHits = 0;

    // calculate modifier changes from traits
    for (const trait of traits) {
      let traitName: TraitKind;
      if (typeof trait === "string") traitName = trait;
      else traitName = trait.name;
      switch (traitName) {
        case TraitKind.critical: {
          const { chance: triggerChance } = this.extractTraitData(trait);
          critChance += triggerChance!;
          break;
        }
        case TraitKind.multi_hit: {
          const { chance: triggerChance, amount } =
            this.extractTraitData(trait);
          let multiplier = 1;
          for (let i = 0; i < amount!; i++) {
            if (
              chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
            ) {
              multiplier++;
            }
          }
          damage *= multiplier;
          numberOfMultiHits = multiplier - 1;
          break;
        }
      }
    }

    // calculate modifier changes from effects
    for (const effect of user.statusEffects) {
      switch (effect.effect) {
        case StatusEffect.strengthened: {
          damage *= ADV_BOOST;
          break;
        }
        case StatusEffect.elated: {
          damage *= 2;
          break;
        }
        case StatusEffect.weakened: {
          damage *= DISADV_BOOST;
          break;
        }
        case StatusEffect.criticalUp: {
          critChance += effect.traitData?.chance ?? 0.25;
          break;
        }
      }
    }
    for (const effect of opponent.statusEffects) {
      switch (effect.effect) {
        case StatusEffect.vulnerable: {
          damage *= ADV_BOOST;
          break;
        }
        case StatusEffect.toughened: {
          damage *= DISADV_BOOST;
          break;
        }
      }
    }

    // calculate critical hit
    if (chance.bool({ likelihood: Math.min(critChance * 100, 100) })) {
      isCrit = true;
      damage *= 2;
    }

    const moveIds = user.knownMoves;
    const moveId = moveIds.find((id) => movesets[id] === move)!;

    user.moveUses[moveId] -= 1;
    playback.push([
      `${user.name} used ${move.name}!`,
      () => {
        realUser.moveUses[moveId] -= 1;
      },
    ]);

    if (damage > 0) {
      damage += user.stats.strength;
      // calculate miss
      if (chance.bool({ likelihood: Math.min(target.stats.agility, 100) })) {
        playback.push(["However, the attack missed!", () => {}]);
      } else {
        // apply damage
        target.hp -= Math.ceil(damage);
        if (isCrit) {
          playback.push(["It's a critical hit!", () => {}]);
        }
        const message =
          typeMultiplier === ADV_BOOST
            ? "It's super effective!"
            : typeMultiplier === DISADV_BOOST
              ? "It's not very effective..."
              : `${target.name} was hurt. Ouch.`;
        if (numberOfMultiHits > 0) {
          playback.push([`It hit ${numberOfMultiHits + 1} times!`, () => {}]);
        }
        playback.push([
          message,
          () => {
            realTarget.hp -= Math.ceil(damage);
          },
        ]);

        // check ko
        if (target.hp <= 0) {
          playback.push(...this.handleKnockout(target, realTarget, isCrit));
        } else {
          // apply target effects
          for (const effect of target.statusEffects) {
            if (effect.effect === StatusEffect.damageReflect) {
              user.hp -= Math.ceil(damage * 0.5);
              playback.push([
                `${target.name} reflected some damage!`,
                () => {
                  realUser.hp -= Math.ceil(damage * 0.5);
                },
              ]);
              if (user.hp <= 0) {
                playback.push(...this.handleKnockout(user, realUser, false));
                break;
              }
            }
          }
        }
      }
    }

    // handle move traits
    for (const trait of traits) {
      let traitName: TraitKind;
      if (typeof trait === "string") traitName = trait;
      else traitName = trait.name;
      switch (traitName) {
        case TraitKind.bleed: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.bleeding,
              duration: duration!,
            });
            playback.push([
              `${target.name} starts bleeding!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.bleeding,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.confuse: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.confused,
              duration: duration!,
            });
            playback.push([
              `${target.name} is confused!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.confused,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.critical_up: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.criticalUp,
              duration: duration!,
            });
            playback.push([
              `${target.name} critical rate increased!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.criticalUp,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.elation: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.elated,
              duration: duration!,
            });
            playback.push([
              `${target.name} becomes elated!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.elated,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.loading: {
          if (user.hp <= 0) break;
          const { chance: triggerChance } = this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            user.statusEffects.push({
              effect: StatusEffect.reload,
              duration: 1,
            });
            playback.push([
              `${user.name} needs to reload.`,
              () => {
                realUser.statusEffects.push({
                  effect: StatusEffect.reload,
                  duration: 1,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.poison: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.poisoned,
              duration: duration!,
            });
            playback.push([
              `${target.name} is poisoned!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.poisoned,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.reflect: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.damageReflect,
              duration: duration!,
            });
            playback.push([
              `${target.name} is reflecting damage!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.damageReflect,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.strengthen: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.strengthened,
              duration: duration!,
            });
            playback.push([
              `${target.name} is filled with a surge of power!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.strengthened,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.stun: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.stunned,
              duration: duration!,
            });
            playback.push([
              `${target.name} is stunned!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.stunned,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.toughen: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.toughened,
              duration: duration!,
            });
            playback.push([
              `${target.name} increases ${getGenderedString({
                gender: target.gender,
                type: "possesive",
                name: target.name,
              })} defense!`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.toughened,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.vulnerable: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.vulnerable,
              duration: duration!,
            });
            playback.push([
              `${target.name} shows their weak side.`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.vulnerable,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.weaken: {
          if (target.hp <= 0) break;
          const { chance: triggerChance, duration } =
            this.extractTraitData(trait);
          if (
            chance.bool({ likelihood: Math.min(triggerChance! * 100, 100) })
          ) {
            target.statusEffects.push({
              effect: StatusEffect.weakened,
              duration: duration!,
            });
            playback.push([
              `${target.name} loses some strength.`,
              () => {
                realTarget.statusEffects.push({
                  effect: StatusEffect.weakened,
                  duration: duration!,
                });
              },
            ]);
          }
          break;
        }
        case TraitKind.heal: {
          if (user.hp <= 0) break;
          let healAmount = 10;
          let triggerChance = 1;
          if (typeof trait === "object") {
            triggerChance = trait.chance ?? triggerChance;
            let amount = trait.amount ?? healAmount;
            if (Array.isArray(amount)) {
              amount = chance.pickone(amount);
            }
          }
          if (chance.bool({ likelihood: Math.min(triggerChance * 100, 100) })) {
            user.hp += healAmount;
            playback.push([
              `${user.name} healed ${healAmount} health`,
              () => {
                realUser.hp += healAmount;
              },
            ]);
          }
          break;
        }
      }
    }

    return playback;
  }

  extractTraitData(trait: TraitData | TraitKind): {
    chance?: number;
    duration?: number;
    amount?: number;
  } {
    let baseChance = 1;
    let baseDuration = 1;
    let baseAmount = 1;
    if (typeof trait === "object") {
      baseChance = trait.chance ?? baseChance;
      const traitDuration = trait.duration ?? baseDuration;
      if (Array.isArray(traitDuration)) {
        baseDuration = chance.pickone(traitDuration);
      } else {
        baseDuration = traitDuration;
      }
      const traitAmount = trait.amount ?? baseAmount;
      if (Array.isArray(traitAmount)) {
        baseAmount = chance.pickone(traitAmount);
      } else {
        baseAmount = traitAmount;
      }
    }
    return { chance: baseChance, duration: baseDuration, amount: baseAmount };
  }

  handleKnockout(
    character: Character,
    realCharacter: Character,
    isCrit: boolean,
  ): BattlePlayback {
    const playback: BattlePlayback = [];
    const hpUnder = Math.abs(character.hp);
    const isPlayer = realCharacter === this.activePlayer;
    let deathChance = 0.25 / character.love;
    if (isCrit) deathChance *= 4;
    deathChance += hpUnder / character.stats.maxHealth / 2;
    console.log(`Death Chance: ${deathChance * 100}%`);
    if (chance.bool({ likelihood: Math.min(deathChance * 100, 100) })) {
      character.isDead = true;
      const message = isPlayer
        ? `Oh no! ${character.name} died... ${getGenderedString({
            gender: character.gender,
            type: "pronoun",
            name: character.name,
          })} will live on in our hearts.`
        : `${character.name} died.`;
      playback.push([
        message,
        () => {
          realCharacter.isDead = true;
          if (isPlayer) {
            this.activePlayer = null;
          } else {
            this.activeOpponent = null;
          }
        },
      ]);
    } else {
      playback.push([
        `${character.name} fainted.`,
        () => {
          if (isPlayer) {
            this.activePlayer = null;
          } else {
            this.activeOpponent = null;
          }
        },
      ]);
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
    // TODO: in future, take into account remaining uses
    const { knownMoves } = this.activeOpponent!;
    const move = chance.pickone(knownMoves);
    return getMovesets()[move];
  }

  calculateMoveBaseSpeed(character: Character, move: MoveData) {
    const { types } = character;
    const { speed: moveSpeed, type: moveType } = move;
    let speed = character.stats.speed;
    if (types.includes(move.type)) {
      speed += moveSpeed * ADV_BOOST;
    } else if (moveType === DereType.normal) {
      speed += moveSpeed;
    } else {
      speed += moveSpeed * DISADV_BOOST;
    }
    return speed;
  }

  static fromBattleData(
    data: MapSpecialActionBattle,
    gameManager: GameManager,
  ): Battle {
    const { against, reward_table, size } = data;
    let { level } = data;
    const playerLove = gameManager.gameData.you.love;
    let enemyLeader: Character;
    let enemyTeam: Character[] = [];
    let love: number | null = null;
    if (level === null) {
      level = [chance.bool() ? Math.max(playerLove - 4, 1) : 1, playerLove + 2];
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
      gameData: gameManager.gameData,
    });
  }
}
