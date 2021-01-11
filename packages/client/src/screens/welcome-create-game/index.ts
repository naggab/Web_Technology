import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";

import { router } from "../../router";
import "../../components/PopUp";
import { PopUp } from "../../components/PopUp";

class WelcomeCreateGame extends AbstractScreen {
  _gameName_input: any;
  _createGameButton: Button;
  _mod: MasterOfDisaster;
  _modal: PopUp;

  constructor() {
    super();
    this.setTitle("Create New Game");
  }

  onMounted() {
    this._mod = MasterOfDisaster.getInstance();
    this._gameName_input = this.shadowRoot.querySelector("text-box");
    this._createGameButton = this.shadowRoot.querySelector("#create-game-button");
    this._createGameButton.onclick = this.createGame.bind(this);
    this._modal = this.shadowRoot.querySelector("apirush-popup");

    this.shadowRoot.querySelector("#title").innerHTML = this._mod.getLanguage().welcome_create.title;
    this.shadowRoot.querySelector("#choose-game").innerHTML = this._mod.getLanguage().welcome_create.gameName;
    this._gameName_input.setHint(this._mod.getLanguage().welcome_create.gameNameHint);
    this._createGameButton.setLabel(this._mod.getLanguage().welcome_create.createGame);
  }

  async createGame() {
    const gameName = this._gameName_input.getValue();
    if (gameName) {
      await this._mod.createGame(gameName);
    } else {
      this._modal.openModal("warning", this._mod.getLanguage().welcome_create.noGameName);
    }
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("create-new-game-screen", WelcomeCreateGame);
export default WelcomeCreateGame;
