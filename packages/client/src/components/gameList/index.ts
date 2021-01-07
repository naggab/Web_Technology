import { MasterOfDisaster } from "../../masterOfDisaster";

import templateHTML from "./template.html";
import { CommandOp, Event, GameIdType, ServerEventOp } from "@apirush/common/src";
import { List } from "../list";

type GameEntryDetails = {
  id: string;
  name: string;
  playersCount: number;
  maxPlayersCount: number;
};

export class GameList extends List<GameEntryDetails> {
  mod: MasterOfDisaster;

  entryContentTemplate_: HTMLTemplateElement;

  constructor() {
    super();
    this.onGameAdded = this.onGameAdded.bind(this);
    this.onGameUpdated = this.onGameUpdated.bind(this);
    this.onGameRemoved = this.onGameRemoved.bind(this);
    this.entryContentTemplate_ = document.createElement("template");
    this.entryContentTemplate_.innerHTML = templateHTML;
  }

  connectedCallback() {
    this.mod = MasterOfDisaster.getInstance();
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.refreshGamesEntries();
    this.mod.serverSession.subscribe(ServerEventOp.GAME_ADDED, this.onGameAdded);
    this.mod.serverSession.subscribe(ServerEventOp.GAME_REMOVED, this.onGameRemoved);
    this.mod.serverSession.subscribe(ServerEventOp.GAME_STATE_UPDATED, this.onGameUpdated);
  }
  disconnectedCallback() {
    this.mod = (<any>window).MOD;
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_ADDED, this.onGameAdded);
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_REMOVED, this.onGameRemoved);
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_STATE_UPDATED, this.onGameUpdated);
  }

  getEntryContentTemplate(): HTMLTemplateElement {
    return this.entryContentTemplate_;
  }
  applyEntryData(entryEl: HTMLElement, data: GameEntryDetails) {
    entryEl.querySelector(".name").textContent = data.name;
    const playerCountField = entryEl.querySelector(".playerCount") as HTMLElement;
    if (data.playersCount >= data.maxPlayersCount) {
      playerCountField.style.color = "red";
    } else {
      playerCountField.style.color = "green";
    }
    playerCountField.textContent = `${data.playersCount}/${data.maxPlayersCount}`;
  }

  onGameAdded({ payload }: Event<ServerEventOp.GAME_ADDED>) {
    console.log("list: onGameAdded");
    this.addEntry(payload);
  }
  onGameRemoved({ payload }: Event<ServerEventOp.GAME_REMOVED>) {
    console.log("list: onGameRemoved");
    this.removeEntry(payload.id);
  }
  onGameUpdated({ payload }: Event<ServerEventOp.GAME_STATE_UPDATED>) {
    console.log("list: onGameUpdated");
    this.updateEntry(payload);
  }

  async refreshGamesEntries() {
    this.container_.innerHTML = "";
    const { games } = await this.mod.serverSession.sendRPC(CommandOp.LIST_GAMES, {});
    games.forEach((game) => {
      console.log("game-list: adding", game);
      this.addEntry(game);
    });
  }

  onEntryClicked(id: GameIdType) {
    this.mod.joinGame(id);
  }
}

customElements.define("game-list", GameList);
