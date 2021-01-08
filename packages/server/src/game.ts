import { PlayerInGame, PlayerInLobby, PlayersInGameMap } from "./types";
import {
  Coordinate,
  Event,
  EventOp,
  GameDetails,
  GameEventOp,
  GameIdType,
  GameState,
  PlayerIdType,
  PlayerInGameI,
} from "@apirush/common";
import { GameMaster } from "./gameMaster";
import { ERR_PLAYER_NOT_EXISTENT, PLAYER_COLORS } from "./constants";
import { GameI } from "./gameI";
import { MapStorage } from "@apirush/common/src/maps";

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export class Game implements GameI {
  readonly id: GameIdType;
  readonly gm: GameMaster;
  readonly name: string;
  readonly seed: number;
  players: PlayersInGameMap;
  readonly map: keyof typeof MapStorage;

  private state_: GameState;

  constructor(id: GameIdType, name: string, gm: GameMaster) {
    this.id = id;
    this.name = name;
    this.gm = gm;
    this.seed = getRandomInt(0, 5000);
    this.players = new Map<PlayerIdType, PlayerInGame>();
    const availableMaps = Object.keys(MapStorage);
    this.map = availableMaps[this.seed % availableMaps.length] as any;
  }

  getAllPlayers(): PlayerInGameI[] {
    return Array.from(this.players.values());
  }

  forEachPlayer(cb: (player: any) => void): void {
    this.players.forEach(cb);
  }

  hasPlayer(id: number): boolean {
    return this.players.has(id);
  }
  getPlayer(id: number): PlayerInGame {
    return this.players.get(id);
  }
  hasNoPlayers(): boolean {
    return this.players.size === 0;
  }

  get state() {
    return this.state_;
  }

  start() {
    this.state_ = "in-game";
    this.emitOnGameStarted();
  }

  finish(winner: PlayerIdType) {
    this.state_ = "post-game";
    this.emitOnGameFinished(winner);
    this.gm.onGameStateUpdate(this);
  }

  abort() {
    this.state_ = "post-game";
    this.emitOnGameAborted();
  }

  get details(): GameDetails {
    return {
      id: this.id,
      name: this.name,
      maxPlayersCount: 5,
      playersCount: this.players.size,
      seed: this.seed,
      state: this.state,
      map: this.map,
    };
  }

  findFreeColor() {
    for (let i = 0; i < PLAYER_COLORS.length; i++) {
      let isUnused = true;
      for (let [_, player] of this.players) {
        if (player.color === PLAYER_COLORS[i]) {
          isUnused = false;
        }
      }
      if (isUnused) {
        return PLAYER_COLORS[i];
      }
    }
    return PLAYER_COLORS[0];
  }

  findNextBibNumber() {
    let bibNumber = 1;
    while (true) {
      let isUnused = true;
      for (let [_, player] of this.players) {
        if (player.bibNumber === bibNumber) {
          isUnused = false;
        }
      }
      if (isUnused) {
        return bibNumber;
      }
      bibNumber++;
    }
  }

  addPlayer(details: PlayerInLobby, sendUpdate: boolean = true): PlayerInGame {
    const bibNumber = this.findNextBibNumber(); // minVal: 1
    const position = MapStorage[this.map].spawns[bibNumber - 1];
    const player: PlayerInGame = {
      ...details,
      color: this.findFreeColor(),
      bibNumber,
      position,
    };
    if (this.players.size == 0) {
      player.isAdmin = true;
    }

    this.players.set(details.id, player);
    if (sendUpdate) {
      this.emitOnPlayerJoined(player);
      this.gm.onGameStateUpdate(this);
    }

    return player;
  }

  removePlayer(id: PlayerIdType) {
    this.players.delete(id);
    this.emitOnPlayerLeft(id);
    this.gm.onGameStateUpdate(this);
  }

  movePlayer(id: PlayerIdType, p: Coordinate) {
    const player = this.players.get(id);
    if (!player) {
      throw ERR_PLAYER_NOT_EXISTENT();
    }
    player.position = p;
    this.emitOnPlayerMoved(id, p);
  }

  // Events
  emitOnPlayerJoined(details: PlayerInGame) {
    const evt: Event<GameEventOp.PLAYER_JOINED> = {
      op: GameEventOp.PLAYER_JOINED,
      payload: details,
    };

    this.emitEvent(evt, (player) => player.id !== details.id);
  }
  emitOnPlayerLeft(id: PlayerIdType) {
    const evt: Event<GameEventOp.PLAYER_LEFT> = {
      op: GameEventOp.PLAYER_LEFT,
      payload: { id },
    };

    this.emitEvent(evt, (player) => player.id !== id);
  }
  emitOnPlayerMoved(id: PlayerIdType, position: Coordinate) {
    const evt: Event<GameEventOp.PLAYER_MOVED> = {
      op: GameEventOp.PLAYER_MOVED,
      payload: { id, position },
    };

    this.emitEvent(evt, (player) => player.id !== id);
  }
  emitOnGameStarted() {
    const evt: Event<GameEventOp.GAME_STARTED> = {
      op: GameEventOp.GAME_STARTED,
      payload: {},
    };

    this.emitEvent(evt);
  }
  emitOnGameAborted() {
    const evt: Event<GameEventOp.GAME_ABORTED> = {
      op: GameEventOp.GAME_ABORTED,
      payload: {},
    };

    this.emitEvent(evt);
  }
  emitOnGameFinished(winner: PlayerIdType) {
    const evt: Event<GameEventOp.GAME_FINISHED> = {
      op: GameEventOp.GAME_FINISHED,
      payload: { winner },
    };

    this.emitEvent(evt);
  }

  private emitEvent<Op extends EventOp>(evt: Event<Op>, filter?: (p: PlayerInGame) => boolean) {
    if (!filter) {
      filter = () => true;
    }
    const receivers = Array.from(this.players.values());
    receivers.filter(filter).forEach((player) => {
      player.notify(evt);
    });
  }
}
