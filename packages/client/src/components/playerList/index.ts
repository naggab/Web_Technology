import { MasterOfDisaster } from "../../masterOfDisaster";

import templateHTML from "./template.html";
import {
  CommandOp,
  Event,
  GameEventOp,
  GameIdType,
  PlayerIdType,
  PlayerInGameI,
  ServerEventOp,
} from "@apirush/common/src";
import { List } from "../list";

export class PlayerList extends List<PlayerInGameI> {
  mod: MasterOfDisaster;

  entryContentTemplate_: HTMLTemplateElement;

  constructor() {
    super();
    this.onPlayerJoined = this.onPlayerJoined.bind(this);
    this.onPlayerLeft = this.onPlayerLeft.bind(this);
    this.entryContentTemplate_ = document.createElement("template");
    this.entryContentTemplate_.innerHTML = templateHTML;
  }

  connectedCallback() {
    this.mod = MasterOfDisaster.getInstance();
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.refreshPlayerEntries();
    this.mod.serverSession.subscribe(GameEventOp.PLAYER_JOINED, this.onPlayerJoined);
    this.mod.serverSession.subscribe(GameEventOp.PLAYER_LEFT, this.onPlayerLeft);
  }
  disconnectedCallback() {
    this.mod = (<any>window).MOD;
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.mod.serverSession.unsubscribe(GameEventOp.PLAYER_JOINED, this.onPlayerJoined);
    this.mod.serverSession.unsubscribe(GameEventOp.PLAYER_LEFT, this.onPlayerLeft);
  }

  getEntryContentTemplate(): HTMLTemplateElement {
    return this.entryContentTemplate_;
  }
  applyEntryData(entryEl: HTMLElement, data: PlayerInGameI) {
    entryEl.querySelector(".name").textContent = data.name;
    const playerBibNumberField = entryEl.querySelector(".bibNumber") as HTMLElement;
    playerBibNumberField.textContent = `${data.bibNumber}`;
  }

  onPlayerJoined({ payload }: Event<GameEventOp.PLAYER_JOINED>) {
    this.addEntry(payload);
  }
  onPlayerLeft({ payload }: Event<GameEventOp.PLAYER_LEFT>) {
    this.removeEntry(payload.id);
  }

  async refreshPlayerEntries() {
    this.container_.innerHTML = "";
    const { players } = await this.mod.serverSession.sendRPC(CommandOp.LIST_PLAYERS, {});
    players.forEach((player) => {
      this.addEntry(player);
    });
  }
}

customElements.define("player-list", PlayerList);
