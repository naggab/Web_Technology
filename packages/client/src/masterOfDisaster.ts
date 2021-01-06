import { GameDetails, PlayerInGameI, GameIdType } from "@apirush/common";
import { Player } from "./screens/game/game-playground";
import { ServerSession } from "./serverSession";

type PlayerInGame = PlayerInGameI & {
  playgroundRef: Player;
};

export type ClientState =
  | "loading"
  | "error"
  | "welcome-start"
  | "welcome-stats"
  | "welcome-join-game"
  | "welcome-create-game"
  | "pre-game"
  | "in-game"
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

  private setState(newState: ClientState) {
    this.state_ = newState;
    /** TODO:
       - change view
       - server rpc calls
       */
  }

  userWantsToJoin(playerName: string) {
    // TODO HELLO
  }

  userWantsToCreate(playerName: string) {
    // TODO HELLO
  }

  joinGame(gameId: GameIdType) {
    // TODO JOIN_GAME
  }

  createGame(gameName: string) {
    // TODO CREATE_GAME
  }

  startGame() {
    // TODO START_GAME
  }

  openTask(id: string): Promise<boolean> {
    throw new Error("not implemented");
    // taskManger -> get task
    // display task
    // count time elapsed
    // store time in StatsStorage
    // check if all tasks finished
  }
}
