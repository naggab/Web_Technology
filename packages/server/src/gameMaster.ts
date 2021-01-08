import { ERR_GAME_NOT_EXISTENT, ERR_PLAYER_NOT_EXISTENT } from "./constants";
import { PlayerInGame, PlayerInLobby, PlayersMap, ServerEventNotifyCb } from "./types";
import { GameIdType, PlayerIdType } from "@apirush/common/src/types";
import { Event, EventOp, ServerEventOp } from "@apirush/common/src/events";
import { GameI } from "./gameI";
import { findNextId } from "./utils";
import { Game } from "./game";
import { GameMasterI } from "./gameMasterI";

export class GameMaster implements GameMasterI {
  static GameConstructor = Game;

  games: Map<string, GameI>;
  unassignedPlayers: PlayersMap;

  constructor() {
    this.games = new Map<GameIdType, GameI>();

    const game1 = new GameMaster.GameConstructor("game_1", "Game1", this);
    this.games.set("game_1", game1);
    const game2 = new GameMaster.GameConstructor("game_2", "Game2", this);
    this.games.set("game_2", game2);

    this.unassignedPlayers = new Map<PlayerIdType, PlayerInLobby>();
  }

  getGameList() {
    return Array.from(this.games.values())
      .filter((game) => game.state !== "post-game")
      .map((game) => game.details);
  }

  getGame(id: GameIdType): GameI {
    if (!this.games.has(id)) {
      throw ERR_GAME_NOT_EXISTENT();
    }
    return this.games.get(id);
  }

  createGameAndJoin(name: string, creator: PlayerInLobby) {
    const creatorPlayer = this.unassignedPlayers.get(creator.id);
    if (!creatorPlayer) {
      throw ERR_PLAYER_NOT_EXISTENT();
    }
    this.unassignedPlayers.delete(creatorPlayer.id);

    const id = findNextId(this.games, "game_");
    const game = new GameMaster.GameConstructor(id, name, this);
    this.games.set(game.id, game);
    const player = game.addPlayer(creatorPlayer, false);
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
        if (game.hasPlayer(newId)) {
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
      throw ERR_PLAYER_NOT_EXISTENT();
    }
    this.unassignedPlayers.delete(player.id);
  }

  addPlayerToGame(gameId: GameIdType, playerId: PlayerIdType): PlayerInGame {
    const game = this.getGame(gameId);
    const player = this.unassignedPlayers.get(playerId);
    if (!player) {
      throw ERR_PLAYER_NOT_EXISTENT();
    }
    this.unassignedPlayers.delete(playerId);
    return game.addPlayer(player);
  }

  removePlayerFromGame(gameId: GameIdType, playerId: PlayerIdType) {
    const game = this.getGame(gameId);
    if (!game.hasPlayer(playerId)) {
      throw ERR_PLAYER_NOT_EXISTENT();
    }
    const player = game.getPlayer(playerId);
    game.removePlayer(playerId);

    if (game.hasNoPlayers()) {
      this.games.delete(game.id);
      this.emitOnGameRemoved(game);
    }
    this.unassignedPlayers.set(playerId, player);
  }

  // Callbacks / Notifications
  private emitOnGameAdded(game: GameI) {
    const evt: Event<ServerEventOp.GAME_ADDED> = {
      op: ServerEventOp.GAME_ADDED,
      payload: game.details,
    };
    this.emitEventToUnassigned(evt);
  }
  onGameStateUpdate(game: GameI) {
    const evt: Event<ServerEventOp.GAME_STATE_UPDATED> = {
      op: ServerEventOp.GAME_STATE_UPDATED,
      payload: game.details,
    };
    this.emitEventToUnassigned(evt);
  }
  private emitOnGameRemoved(game: GameI) {
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
      game.forEachPlayer((player) => {
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
