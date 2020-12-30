import { CLEANUP_SCHEDULE, ERR_GAME_NOT_EXISTENT, ERR_PLAYER_NOT_EXISTENT } from "./constants";
import { GamesMap, PlayerInLobby, PlayersMap, ServerEventNotifyCb } from "./types";
import { GameIdType, PlayerIdType } from "@apirush/common/src/types";
import { Event, EventOp, ServerEventOp } from "@apirush/common/src/events";
import { Game } from "./game";
import { findNextId, seekUnusedNumericId } from "./utils";

export class GameMaster {
  games: GamesMap;
  unassignedPlayers: PlayersMap;

  constructor() {
    this.games = new Map<GameIdType, Game>();
    this.unassignedPlayers = new Map<PlayerIdType, PlayerInLobby>();
  }

  getGameList() {
    return Array.from(this.games.values()).map((game) => game.details);
  }

  getGame(id: GameIdType): Game {
    if (!this.games.has(id)) {
      throw ERR_GAME_NOT_EXISTENT;
    }
    return this.games.get(id);
  }

  createGameAndJoin(name: string, creator: PlayerInLobby) {
    const id = findNextId(this.games, "game_");
    const game = new Game(id, name, this);
    this.games.set(game.id, game);
    const player = this.addPlayerToGame(game.id, creator.id);
    this.emitOnGameAdded(game);
    return { game, player };
  }

  createPlayer(name: string, notifyCb: ServerEventNotifyCb) {
    let newId = 0;
    while (true) {
      if (this.unassignedPlayers.has(newId)) {
        newId++;
        continue;
      }
      for (var [_, game] of this.games) {
        if (game.players.has(newId)) {
          newId++;
        }
      }
      break;
    }

    const player = {
      name,
      id: newId,
      notify: notifyCb,
    };
    this.unassignedPlayers.set(player.id, player);
    return player;
  }

  removePlayer(id: PlayerIdType) {
    const player = this.unassignedPlayers.get(id);
    if (!player) {
      throw ERR_PLAYER_NOT_EXISTENT;
    }
    this.unassignedPlayers.delete(player.id);
  }

  addPlayerToGame(gameId: GameIdType, playerId: PlayerIdType) {
    const game = this.getGame(gameId);
    const player = this.unassignedPlayers.get(playerId);
    if (!player) {
      throw ERR_PLAYER_NOT_EXISTENT;
    }
    this.unassignedPlayers.delete(playerId);
    return game.addPlayer(player);
  }

  removePlayerFromGame(gameId: GameIdType, playerId: PlayerIdType) {
    const game = this.getGame(gameId);
    if (!game.players.has(playerId)) {
      throw ERR_PLAYER_NOT_EXISTENT;
    }
    const player = game.players.get(playerId);
    game.removePlayer(playerId);

    if (game.players.size === 0) {
      this.games.delete(game.id);
      this.emitOnGameRemoved(game);
    }
    this.unassignedPlayers.set(playerId, player);
  }

  // Callbacks / Notifications
  private emitOnGameAdded(game: Game) {
    const evt: Event<ServerEventOp.GAME_ADDED> = {
      op: ServerEventOp.GAME_ADDED,
      payload: game.details,
    };
    this.emitEventToUnassigned(evt);
  }
  onGameStateUpdate(game: Game) {
    const evt: Event<ServerEventOp.GAME_STATE_UPDATED> = {
      op: ServerEventOp.GAME_STATE_UPDATED,
      payload: game.details,
    };
    this.emitEventToUnassigned(evt);
  }
  private emitOnGameRemoved(game: Game) {
    const evt: Event<ServerEventOp.GAME_REMOVED> = {
      op: ServerEventOp.GAME_REMOVED,
      payload: { id: game.id },
    };
    this.emitEventToUnassigned(evt);
  }

  closeAll() {
    this.emitEventToAll({
      op: ServerEventOp.SERVER_SHUTDOWN,
      payload: {},
    });
  }

  private emitEventToAll<Op extends EventOp>(evt: Event<Op>) {
    this.unassignedPlayers.forEach((player) => {
      player.notify(evt);
    });

    this.games.forEach((game) => {
      game.players.forEach((player) => {
        player.notify(evt);
      });
    });
  }

  private emitEventToUnassigned<Op extends EventOp>(evt: Event<Op>) {
    this.unassignedPlayers.forEach((player) => {
      player.notify(evt);
    });
  }
}
