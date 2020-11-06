import WebSocket from "ws";
import { GameEvent, GameEventOp } from "@apirush/common";

type PlayerIdType = number;

type PlayerEntry = {
  id: PlayerIdType;
  name: string;
  color: string;
  ws: WebSocket;
  connectionOk: boolean;
  position?: {
    x: number;
    y: number;
  };
};

type PlayerDetails = Omit<PlayerEntry, "id" | "connectionOk">;

type GameIdType = number;

type GameEntry = {
  id: GameIdType;
  players: PlayerMap;
};

type PlayerMap = Map<PlayerIdType, PlayerEntry>;

type GamesMap = Map<GameIdType, GameEntry>;

function seekUnusedNumericId<T>(map: Map<number, T>) {
  let i = 0;
  while (map.has(i)) {
    i++;
  }
  return i;
}

const CLEANUP_SCHEDULE = 5000; // 5 seconds

export class Broker {
  games: GamesMap;

  cleanupTimer: NodeJS.Timeout | null;

  constructor() {
    this.games = new Map<GameIdType, GameEntry>();
    this.scheduledCleanup = this.scheduledCleanup.bind(this);
    this.cleanupTimer = setTimeout(this.scheduledCleanup, CLEANUP_SCHEDULE);
  }

  /**
   * to make sure all WebSockets are cleaned up every players WebSocket is checked regularly.
   * initially every players `connectionOk` value is set to false and we ping() every websocket.
   * Every still working WebSocket will return a pong (see Broker.setupPlayerListeners()) and
   * set `connectionOk` to true again. Every player which has a `connectionOk` of false
   * after 5 seconds is considered offline and will be removed.
   */
  private scheduledCleanup() {
    this.cleanupTimer = null;
    this.games.forEach((game) => {
      game.players.forEach((player) => {
        if (!player.connectionOk) {
          this.onPlayerDisconnected(game, player);
          return;
        }
        player.connectionOk = false;
        player.ws.ping();
      });
    });
    this.cleanupTimer = setTimeout(this.scheduledCleanup, CLEANUP_SCHEDULE);
  }

  /**
   * simple helper to create a game if it does not exist or return the existing game based on the gameId
   */
  private getOrCreateGame(id: GameIdType): GameEntry {
    if (this.games.has(id)) {
      return this.games.get(id);
    }
    const newGame: GameEntry = {
      id,
      players: new Map<PlayerIdType, PlayerEntry>(),
    };
    this.games.set(newGame.id, newGame);
    console.log(`broker: new game created (id: ${newGame.id})`);
    return newGame;
  }

  private static addPlayerToGame(game: GameEntry, details: PlayerDetails): PlayerEntry {
    const player: PlayerEntry = {
      ...details,
      connectionOk: true,
      id: seekUnusedNumericId(game.players),
    };
    game.players.set(player.id, player);
    return player;
  }

  /**
   * send a message to a single player
   */
  private static sendMsgToPlayer(player: PlayerEntry, msg: WebSocket.Data | object) {
    if (typeof msg === "object") {
      player.ws.send(JSON.stringify(msg));
      return;
    }
    player.ws.send(msg);
  }

  /**
   * send a message to a every player in every game
   */
  private broadcastAll(msg: WebSocket.Data | object) {
    this.games.forEach((game) => {
      game.players.forEach((player) => {
        Broker.sendMsgToPlayer(player, msg);
      });
    });
  }

  /**
   * send a message to a every player in a single game, excluding its sender
   */
  private static broadcastMsgForGame(game: GameEntry, sender: PlayerEntry | null, msg: WebSocket.Data | object) {
    game.players.forEach((player) => {
      if (player === sender) {
        return;
      }
      Broker.sendMsgToPlayer(player, msg);
    });
  }

  /**
   * handle a message received from a player.
   * currently only relays every message to other players in the same game
   */
  private static onMessageFromPlayer(game: GameEntry, sender: PlayerEntry, msg: WebSocket.Data) {
    try {
      const event = JSON.parse(msg.toString()) as GameEvent;
      if (event.op === GameEventOp.PLAYER_MOVE) {
        const castedEvt = event as GameEvent<GameEventOp.PLAYER_MOVE>;
        sender.position = {
          x: castedEvt.payload.x,
          y: castedEvt.payload.y,
        };
      }
    } catch (e) {
      console.error("unable to parse message, only relaying it");
    }

    console.log(`broker: replaying message from player ${sender.id}`);
    Broker.broadcastMsgForGame(game, sender, msg);
  }

  /**
   * handle player disconnects
   * sends a PLAYER_LEAVE to every other player in the same game.
   * if number of players in one game == 0 -> game is deleted
   */
  private onPlayerDisconnected(game: GameEntry, player: PlayerEntry) {
    const msg: GameEvent<GameEventOp.PLAYER_LEAVE> = {
      op: GameEventOp.PLAYER_LEAVE,
      payload: {
        id: player.id,
        name: player.name,
        color: player.color,
      },
    };
    game.players.delete(player.id);

    if (game.players.size === 0) {
      console.log(`broker: game ${game.id} closed.`);
      this.games.delete(game.id);
      return;
    }
    console.log(`broker: game ${game.id}: player (id: ${player.id}) left, ${game.players.size} players remaining`);
    Broker.broadcastMsgForGame(game, null, msg);
  }

  /**
   * bind listeners to a players websocket after it has been established
   */
  private setupPlayerListeners(game: GameEntry, player: PlayerEntry) {
    const { ws } = player;
    ws.on("pong", () => {
      player.connectionOk = true;
    });

    ws.on("message", (rawMsg) => {
      Broker.onMessageFromPlayer(game, player, rawMsg);
    });

    ws.on("close", () => {
      player.connectionOk = false;
      this.onPlayerDisconnected(game, player);
    });
  }

  /**
   * handle player connecting to a game:
   * sends a PLAYER_JOIN to every other player in the game and
   * sends a CURRENT_STATE to the new player to get him uptodate.
   */
  public onPlayerConnected(gameId: GameIdType, playerDetails: PlayerDetails) {
    console.log("broker: new player connected:", { name: playerDetails.name });
    const game = this.getOrCreateGame(gameId);
    const otherPlayers = Array.from(game.players.values());
    const player = Broker.addPlayerToGame(game, playerDetails);
    this.setupPlayerListeners(game, player);

    const joinMsg: GameEvent<GameEventOp.PLAYER_JOIN> = {
      op: GameEventOp.PLAYER_JOIN,
      payload: {
        id: player.id,
        name: player.name,
        color: player.color,
      },
    };
    Broker.broadcastMsgForGame(game, player, joinMsg);
    const currentStateMsg: GameEvent<GameEventOp.CURRENT_STATE> = {
      op: GameEventOp.CURRENT_STATE,
      payload: {
        yourPlayerId: player.id,
        players: otherPlayers.map((otherPlayer) => ({
          id: otherPlayer.id,
          name: otherPlayer.name,
          color: otherPlayer.color,
          position: otherPlayer.position,
        })),
      },
    };
    Broker.sendMsgToPlayer(player, currentStateMsg);
  }

  /**
   * cleanup all websockets, players and games
   */
  public async terminate() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    const msg: GameEvent<GameEventOp.SERVER_SHUTDOWN> = {
      op: GameEventOp.SERVER_SHUTDOWN,
      payload: {},
    };
    this.broadcastAll(msg);
    this.games.forEach((game) => {
      game.players.forEach((player) => {
        player.ws.close();
      });
    });
    this.games.clear();
  }
}
