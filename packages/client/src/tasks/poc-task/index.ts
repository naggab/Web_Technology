import viewHtml from "./view.html";
import { default as GamePlayground, Player } from "../game-playground";
import { GameSession } from "../../gameSession";
import { Task, TaskOpts } from "../../task";
import { GameEvent, GameEventOp } from "@apirush/common";

export default class POCTask extends Task {
  gamePlayground: GamePlayground;
  gameSession: GameSession;

  currentPlayerId: number;

  otherPlayers: Map<number, Player>;

  constructor(opts: TaskOpts) {
    super(opts);
    this.otherPlayers = new Map();
    this.gamePlayground = new GamePlayground({ finishCb: () => {} });
    this.gameSession = new GameSession("Player");
    this.onStateUpdateReceived = this.onStateUpdateReceived.bind(this);
    this.onPlayerMoveReceived = this.onPlayerMoveReceived.bind(this);
    this.sendPlayerMove = this.sendPlayerMove.bind(this);
    this.onPlayerJoined = this.onPlayerJoined.bind(this);
    this.onPlayerLeave = this.onPlayerLeave.bind(this);
  }

  onMounted() {
    console.log(POCTask.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    this.shadowRoot.appendChild(this.gamePlayground);
    this.gamePlayground.getCurrentPlayer().attachCallback(this.sendPlayerMove);

    this.gameSession.subscribe(GameEventOp.CURRENT_STATE, this.onStateUpdateReceived);
    this.gameSession.subscribe(GameEventOp.PLAYER_MOVE, this.onPlayerMoveReceived);
    this.gameSession.subscribe(GameEventOp.PLAYER_JOIN, this.onPlayerJoined);
    this.gameSession.subscribe(GameEventOp.PLAYER_LEAVE, this.onPlayerLeave);

    this.gameSession
      .connect()
      .then(() => {
        console.log("connected!");
      })
      .catch((err) => {
        alert("unable to create a GameSession");
        console.error(err);
      });
  }

  addForeignPlayer(id: number, x: number = 5, y: number = 5, color: string = "#EFEFEF") {
    const newPlayer = this.gamePlayground.addPlayer(x, y, color, undefined, id);
    this.otherPlayers.set(id, newPlayer);
  }

  onPlayerLeave(event: GameEvent<GameEventOp.PLAYER_LEAVE>) {
    console.log("received other player leave", event.payload);
    const { id } = event.payload;
    if (!this.otherPlayers.has(id)) {
      return;
    }
    const player = this.otherPlayers.get(id);
    const layer = player.layer;
    player.model.remove();
    player.model.destroy();
    layer.batchDraw();
    this.otherPlayers.delete(id);
  }

  onPlayerJoined(event: GameEvent<GameEventOp.PLAYER_JOIN>) {
    console.log("received other player join", event.payload);
    const { id, color, position = { x: 5, y: 5 } } = event.payload;
    this.addForeignPlayer(id, position.x, position.y, color);
  }

  onStateUpdateReceived(event: GameEvent<GameEventOp.CURRENT_STATE>) {
    this.currentPlayerId = event.payload.yourPlayerId;
    const { x, y } = this.gamePlayground.getCurrentPlayer();
    this.sendPlayerMove(x, y);
    event.payload.players.forEach((info) => {
      const { id, color, position = { x: 5, y: 5 } } = info;
      this.addForeignPlayer(id, position.x, position.y, color);
    });
  }

  onPlayerMoveReceived(event: GameEvent<GameEventOp.PLAYER_MOVE>) {
    console.log("received other player move", event.payload);
    const { playerId, x, y } = event.payload;
    if (!this.otherPlayers.has(playerId)) {
      return;
    }
    const player = this.otherPlayers.get(playerId);
    player.moveTo(x, y);
  }

  sendPlayerMove(x: number, y: number) {
    this.gameSession.send({
      op: GameEventOp.PLAYER_MOVE,
      payload: {
        playerId: this.currentPlayerId,
        x,
        y,
      },
    });
  }

  onUnmounting() {
    console.log(POCTask.name, "disconnected from DOM");
    this.gameSession.disconnect();
  }
}

customElements.define("poc-task", POCTask);
