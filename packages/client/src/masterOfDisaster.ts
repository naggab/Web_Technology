import { GameDetails, PlayerInGameI, GameIdType } from "@apirush/common";
import { Player } from "./screens/game/game-playground";
import { ServerSession } from "./serverSession";

type PlayerInGame = PlayerInGameI & {
  playgroundRef: Player;
};

type ClientState =
  | "loading"
  | "error"
  | "welcome-start"
  | "welcome-stats"
  | "welcome-join-game"
  | "welcome-create-game"
  | "pre-game"
  | "in-game"
  | "in-game-task"
  | "post-game";

export class MasterOfDisaster {
  private static instance_: MasterOfDisaster;
  private state_: ClientState = "welcome-start";
  activeGame: GameDetails | null = null;
  myPlayer: PlayerInGame | null = null;
  foreignPlayers: Map<number, PlayerInGame>;
  readonly serverSession: ServerSession;

  constructor(sess: ServerSession) {
    this.serverSession = sess;
  }

  static getInstance() {
    return this.instance_;
  }

  static async setup() {
    const conn = new ServerSession();
    return conn
      .connect()
      .then(() => {
        MasterOfDisaster.instance_ = new MasterOfDisaster(conn);
        return true;
      })
      .catch((e) => {
        console.error("unable to connect to server");
        throw new Error("unable to connect");
      });
  }

  get state() {
    return this.state_;
  }

  setState(newState: ClientState) {
    this.state_ = newState;
    /** TODO:
       - change view
       - server rpc calls
       */
  }

  joinGame(gameId: GameIdType, playerName: string) {}

  createGame(gameName: string, playerName: string) {}
}
