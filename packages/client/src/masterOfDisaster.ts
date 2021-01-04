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
  private state_: ClientState = "loading";
  activeGame: GameDetails | null = null;
  myPlayer: PlayerInGame | null = null;
  foreignPlayers: Map<number, PlayerInGame>;
  readonly serverSession: ServerSession;

  constructor() {
    this.serverSession = new ServerSession();
    this.serverSession
      .connect()
      .then(() => {
        this.setState("welcome-start");
      })
      .catch((e) => {
        console.error("unable to connect to server");
        this.setState("error");
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

(<any>window).MOD = new MasterOfDisaster();
