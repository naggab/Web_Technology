import WebSocket from "ws";

type PlayerIdType = number;

type PlayerEntry = {
  id: PlayerIdType;
  name: string;
  color: string;
  ws: WebSocket;
  connectionOk: boolean;
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

  getOrCreateGame(id: GameIdType): GameEntry {
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

  private static sendMsgToPlayer(player: PlayerEntry, msg: WebSocket.Data | object) {
    if (typeof msg === "object") {
      player.ws.send(JSON.stringify(msg));
      return;
    }
    player.ws.send(msg);
  }

  private broadcastAll(msg: WebSocket.Data | object) {
    this.games.forEach((game) => {
      game.players.forEach((player) => {
        Broker.sendMsgToPlayer(player, msg);
      });
    });
  }

  private static broadcastMsgForGame(game: GameEntry, sender: PlayerEntry | null, msg: WebSocket.Data | object) {
    game.players.forEach((player) => {
      if (player === sender) {
        return;
      }
      Broker.sendMsgToPlayer(player, msg);
    });
  }

  private static onMessageFromPlayer(game: GameEntry, sender: PlayerEntry, msg: WebSocket.Data) {
    console.log(`broker: replaying message from player ${sender.id}`);
    Broker.broadcastMsgForGame(game, sender, msg);
  }
  private onPlayerDisconnected(game: GameEntry, player: PlayerEntry) {
    const msg = {
      op: "PLAYER_LEAVE",
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
    console.log(`broker: game ${game.id}: player ${player.id} left, ${game.players.size} players remaining`);
    Broker.broadcastMsgForGame(game, null, msg);
  }

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

  public onPlayerConnected(gameId: GameIdType, playerDetails: PlayerDetails) {
    console.log("broker: new player connected:", { name: playerDetails.name });
    const game = this.getOrCreateGame(gameId);
    const otherPlayers = Array.from(game.players.values());
    const player = Broker.addPlayerToGame(game, playerDetails);
    this.setupPlayerListeners(game, player);

    const joinMsg = {
      op: "PLAYER_JOIN",
      payload: {
        id: player.id,
        name: player.name,
        color: player.color,
      },
    };
    Broker.broadcastMsgForGame(game, player, joinMsg);
    const currentStateMsg = {
      op: "CURRENT_STATE",
      payload: {
        players: otherPlayers.map((otherPlayer) => ({
          id: otherPlayer.id,
          name: otherPlayer.name,
          color: otherPlayer.color,
        })),
      },
    };
    Broker.sendMsgToPlayer(player, currentStateMsg);
  }

  public async terminate() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    const msg = {
      op: "SERVER_SHUTDOWN",
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
