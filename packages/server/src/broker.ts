import WebSocket from "ws";
import { CLEANUP_SCHEDULE } from "./constants";
import { findNextId } from "./utils";
import { GameMasterI } from "./gameMasterI";
import { Connection } from "./connection";

export class Broker {
  gm: GameMasterI;
  connections: Map<string, Connection>;
  cleanupTimer: NodeJS.Timeout | null;

  constructor(gm: GameMasterI) {
    this.gm = gm;
    this.connections = new Map<string, Connection>();
    this.scheduledCleanup();
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
    try {
      this.connections.forEach((conn) => {
        if (!conn.ok || conn.ws.readyState !== WebSocket.OPEN) {
          console.log(conn.player, "cleaning connection because it is not open anymore", conn.ok, conn.ws.readyState);
          conn.leave();
          return;
        }
        conn.ok = false;
        conn.ws.ping();
      });
    } catch (e) {
      console.error("error during scheduled cleanup", e);
    }
    this.cleanupTimer = setTimeout(this.scheduledCleanup.bind(this), CLEANUP_SCHEDULE);
  }

  public onConnected(ws: WebSocket) {
    const connection = new Connection(ws, this.gm);
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
      try {
        connection.leave();
      } catch (e) {}
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
      try {
        conn.leave();
        conn.ws.close();
      } catch (e) {}
    });
    this.connections.clear();
  }
}
