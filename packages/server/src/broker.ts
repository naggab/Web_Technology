import WebSocket from "ws";
import {
  GameEventOp,
  CommandOps,
  ErrorResponse,
  CommandRequest,
  CommandResponse,
  Respondable,
  Event,
  EventOp,
  ErrorResponseBody,
  ServerEventOp,
} from "@apirush/common";
import { GameMaster } from "./gameMaster";
import { CLEANUP_SCHEDULE, ERR_PLAYER_ALREADY_GREETED, ERR_PLAYER_DID_NOT_GREET } from "./constants";
import { PlayerInGame, PlayerInLobby } from "./types";
import { Game } from "./game";
import { findNextId } from "./utils";

class Connection {
  readonly ws: WebSocket;
  readonly broker: Broker;
  ok: boolean;

  player: PlayerInLobby | PlayerInGame | null;
  game: Game | null;

  constructor(ws: WebSocket, br: Broker) {
    this.ws = ws;
    this.broker = br;
    this.ok = true;
    this.player = null;
    this.game = null;
  }

  onMessage(msg: WebSocket.Data) {
    console.log(`broker: onMessage`);
    let req: CommandRequest;
    try {
      req = JSON.parse(msg.toString()) as CommandRequest;
    } catch (e) {
      console.error("unable to parse message, will be ignored");
      return;
    }
    let responseBody: Omit<CommandResponse, "id">;
    try {
      responseBody = this.executeRPC(req);
    } catch (e) {
      this.respondWith({
        id: req.id,
        error: e.toString(),
      });
      return;
    }
    this.respondWith({
      id: req.id,
      // @ts-ignore
      op: responseBody.op,
      result: responseBody.result,
    });
  }

  get hasGreeted() {
    return !!this.player;
  }

  ensureGreeted() {
    if (!this.hasGreeted) {
      throw ERR_PLAYER_DID_NOT_GREET;
    }
  }

  get hasJoinedGame() {
    return !!this.game;
  }

  ensureJoinedGame() {
    if (!this.hasJoinedGame) {
      throw ERR_PLAYER_DID_NOT_GREET;
    }
  }

  executeRPC(req: Exclude<CommandRequest, "id">) {
    switch (req.op) {
      case CommandOps.HELLO: {
        if (this.hasGreeted) {
          throw ERR_PLAYER_ALREADY_GREETED;
        }
        this.player = this.broker.gm.createPlayer(req.params.name, this.sendEvent.bind(this));
        return {
          op: req.op,
          result: { id: this.player.id },
        };
      }
      case CommandOps.LIST_GAMES: {
        const games = this.broker.gm.getGameList();
        return {
          op: req.op,
          result: { games },
        };
      }
      case CommandOps.CREATE_GAME: {
        this.ensureGreeted();
        const { game, player } = this.broker.gm.createGameAndJoin(req.params.name, this.player);
        this.game = game;
        this.player = player;
        return {
          op: req.op,
          result: { game: this.game.details, player: this.player },
        };
      }
      case CommandOps.JOIN_GAME: {
        this.ensureGreeted();
        const { id } = req.params;
        this.player = this.broker.gm.addPlayerToGame(id, this.player.id);
        return {
          op: req.op,
          result: { player: this.player },
        };
      }
      case CommandOps.MOVE: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.movePlayer(this.player.id, req.params.position);
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.START_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.start();
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.ABORT_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.abort();
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.DECLARE_WIN: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.finish(this.player.id);
        return {
          op: req.op,
          result: {},
        };
      }
    }
  }

  leave() {
    if (this.hasJoinedGame) {
      this.broker.gm.removePlayerFromGame(this.game.id, this.player.id);
      this.game = null;
    }
    if (this.hasGreeted) {
      this.broker.gm.removePlayer(this.player.id);
      this.player = null;
    }
  }

  sendEvent<T extends EventOp>(evt: Event<T>) {}

  respondWith(res: (CommandResponse | ErrorResponseBody) & Respondable) {
    const dataStr = JSON.stringify(res);
    this.ws.send(dataStr);
  }
}

export class Broker {
  gm: GameMaster;
  connections: Map<string, Connection>;
  cleanupTimer: NodeJS.Timeout | null;

  constructor(gm: GameMaster) {
    this.gm = gm;
    this.connections = new Map<string, Connection>();
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
    this.cleanupTimer = setTimeout(this.scheduledCleanup, CLEANUP_SCHEDULE);
  }

  public onConnected(ws: WebSocket) {
    const connection = new Connection(ws, this);
    const id = findNextId(this.connections, "conn_");
    this.connections.set(id, connection);
    ws.on("pong", () => {
      connection.ok = true;
    });

    ws.on("message", (rawMsg) => {
      connection.onMessage(rawMsg);
    });

    ws.on("close", () => {
      connection.ok = false;
      connection.leave();
    });
  }

  /**
   * cleanup all websockets, players and games
   */
  public async terminate() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.gm.closeAll();

    this.connections.forEach((conn) => {
      conn.leave();
      conn.ws.close();
    });
    this.connections.clear();
  }
}
