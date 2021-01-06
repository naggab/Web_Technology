import { MasterOfDisaster } from "../../masterOfDisaster";

import templateHTML from "./template.html";
import { CommandOp, Event, ServerEventOp } from "@apirush/common/src";

type GameEntryDetails = {
  id: string;
  name: string;
  playersCount: number;
  maxPlayersCount: number;
};

export class GameList extends HTMLElement {
  container_: HTMLDivElement;
  listEntryTemplate_: HTMLTemplateElement;

  mod: MasterOfDisaster;

  constructor() {
    super();
    this.onGameAdded = this.onGameAdded.bind(this);
    this.onGameUpdated = this.onGameUpdated.bind(this);
    this.onGameRemoved = this.onGameRemoved.bind(this);

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this.container_ = shadowRoot.querySelector(".game-list") as any;
    this.listEntryTemplate_ = shadowRoot.getElementById("game-list-entry-template") as any;
  }

  connectedCallback() {
    this.mod = MasterOfDisaster.getInstance();
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.refreshGamesEntries();
    this.mod.serverSession.subscribe(ServerEventOp.GAME_ADDED, this.onGameAdded);
    this.mod.serverSession.subscribe(ServerEventOp.GAME_REMOVED, this.onGameUpdated);
    this.mod.serverSession.subscribe(ServerEventOp.GAME_STATE_UPDATED, this.onGameRemoved);
  }
  disconnectedCallback() {
    this.mod = (<any>window).MOD;
    if (!this.mod) {
      throw new Error("unable to find MOD?!");
    }
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_ADDED, this.onGameAdded);
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_REMOVED, this.onGameUpdated);
    this.mod.serverSession.unsubscribe(ServerEventOp.GAME_STATE_UPDATED, this.onGameRemoved);
  }

  onGameAdded({ payload }: Event<ServerEventOp.GAME_ADDED>) {
    this.addGameEntry(payload);
  }
  onGameRemoved({ payload }: Event<ServerEventOp.GAME_REMOVED>) {
    this.removeGameEntry(payload.id);
  }
  onGameUpdated({ payload }: Event<ServerEventOp.GAME_STATE_UPDATED>) {
    this.updateGameEntry(payload);
  }

  async refreshGamesEntries() {
    this.container_.innerHTML = "";
    const { games } = await this.mod.serverSession.sendRPC(CommandOp.LIST_GAMES, {});
    games.forEach((game) => {
      console.log("game-list: adding", game);
      this.addGameEntry(game);
    });
  }

  addGameEntry(data: GameEntryDetails) {
    const newHtmlFrag = this.listEntryTemplate_.content.cloneNode(true) as HTMLElement;
    const newHtml = newHtmlFrag.querySelector(".game-list-entry") as HTMLElement;
    this.updateGameEntryFields(newHtml, data);
    this.container_.appendChild(newHtml);
  }

  findGameEntry(id: string): HTMLElement {
    const gameEntries = this.container_.children;
    for (let gameEntry of gameEntries) {
      if (gameEntry.getAttribute("gameid") === id) {
        return gameEntry as HTMLElement;
      }
    }
    throw new Error("unable to find GameEntry with id: " + id);
  }

  removeGameEntry(id: string) {
    this.findGameEntry(id).remove();
  }

  updateGameEntry(data: GameEntryDetails) {
    const gameEntry = this.findGameEntry(data.id);
    this.updateGameEntryFields(gameEntry, data);
  }

  updateGameEntryFields(entryEl: HTMLElement, data: GameEntryDetails) {
    console.log(entryEl);
    entryEl.setAttribute("gameid", data.id);
    entryEl.querySelector(".name").textContent = data.name;
    const playerCountField = entryEl.querySelector(".playerCount") as HTMLElement;
    if (data.playersCount >= data.maxPlayersCount) {
      playerCountField.style.color = "red";
    } else {
      playerCountField.style.color = "green";
    }
    playerCountField.textContent = `${data.playersCount}/${data.maxPlayersCount}`;
  }
}

customElements.define("game-list", GameList);
