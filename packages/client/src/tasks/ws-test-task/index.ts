import viewHtml from "./view.html";
import { ServerSession } from "../../serverSession";
import { Task, TaskOpts } from "../../task";
import { Event, GameEventOp } from "@apirush/common";

export default class WsTestTask extends Task {
  nameInput: HTMLInputElement;
  connectButton: HTMLButtonElement;
  msgList: HTMLDivElement;

  movementInput: HTMLInputElement;
  movementSendButton: HTMLButtonElement;

  session: ServerSession | null = null;

  constructor(opts: TaskOpts) {
    super(opts);
    this.onConnectClicked = this.onConnectClicked.bind(this);
    this.onGameEvent = this.onGameEvent.bind(this);
    this.onSendActionClicked = this.onSendActionClicked.bind(this);
  }

  onGameEvent(ev: Event) {
    const entry = document.createElement("div");
    entry.innerText = JSON.stringify(ev);
    this.msgList.appendChild(entry);
  }

  async onConnectClicked() {
    if (this.session) {
      this.session.unsubscribeFromAll(this.onGameEvent);
      this.session.disconnect();
      this.session = null;
      this.connectButton.innerText = "Connect";
      return;
    }
    this.msgList.innerHTML = "";
    const name = this.nameInput.value;
    try {
      this.session = new ServerSession();
      this.session.subscribeToAll(this.onGameEvent);

      await this.session.connect();
    } catch (e) {
      alert("did not work, check console log");
      console.error(e);
      return;
    }
    this.connectButton.innerText = "Disconnect";
  }

  onSendActionClicked() {
    if (!this.session) {
      return;
    }

    const event: Event<GameEventOp.GAME_STARTED> = {
      op: GameEventOp.GAME_STARTED,
      payload: {},
    };

    this.session.send(event);
  }

  setupListeners() {
    this.connectButton.onclick = this.onConnectClicked;
    this.movementSendButton.onclick = this.onSendActionClicked;
  }

  onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.nameInput = this.shadowRoot.getElementById("player_name_input") as HTMLInputElement;
    this.connectButton = this.shadowRoot.getElementById("connect_button") as HTMLButtonElement;
    this.msgList = this.shadowRoot.getElementById("msg_list") as HTMLDivElement;
    this.movementInput = this.shadowRoot.getElementById("action_input") as HTMLInputElement;
    this.movementSendButton = this.shadowRoot.getElementById("action_send_button") as HTMLButtonElement;

    this.setupListeners();
  }

  onUnmounting() {}
}

customElements.define("ws-test-task", WsTestTask);
