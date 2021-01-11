import templateHTML from "./template.html";
import { Button } from "../../components/button";
import AbstractScreen from "../AbstractScreen";
import "../../components/textBox";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { router } from "../../router";
import "../../components/PopUp";
import { PopUp } from "../../components/PopUp";

class WelcomeScreen extends AbstractScreen {
  _joinGameButton: Button;
  _createGameButton: Button;
  _showStats_button: Button;
  _mod: MasterOfDisaster;
  _userName_input: any;
  _modal: PopUp;

  constructor() {
    super();
    document.title = "Welcome";
  }

  onMounted() {
    this._mod = MasterOfDisaster.getInstance();

    this._joinGameButton = this.shadowRoot.querySelector("#join-game-button") as Button;
    this._createGameButton = this.shadowRoot.querySelector("#create-game-button") as Button;
    this._showStats_button = this.shadowRoot.querySelector("#show-stats") as Button;
    this._userName_input = this.shadowRoot.querySelector("#userName");
    this._modal = this.shadowRoot.querySelector("apirush-popup");

    this._joinGameButton.onclick = this.joinGame.bind(this);
    this._createGameButton.onclick = this.createGame.bind(this);
    this._showStats_button.onclick = this.showStats.bind(this);

    let _showAllTasks: Button = this.shadowRoot.querySelector("#show-all-tasks");

    if (this._mod.debugMode) {
      _showAllTasks.classList.remove("hidden");
      _showAllTasks.onclick = this.showAllTasks;
    }

    this._joinGameButton.setLabel(this._mod.getLanguage().welcome_start.enterGame);
    this._createGameButton.setLabel(this._mod.getLanguage().welcome_start.createGame);
    this._showStats_button.setLabel(this._mod.getLanguage().welcome_start.showStats);
    this._userName_input.setHint(this._mod.getLanguage().welcome_start.userName);
    this.shadowRoot.querySelector("#title").innerHTML = this._mod.getLanguage().welcome_start.title;
    this.shadowRoot.querySelector("#subtitle").innerHTML = this._mod.getLanguage().welcome_start.subTitle;
  }
  showAllTasks() {
    router("all-tasks");
  }
  async showStats() {
    await this._mod.showStats();
  }

  async joinGame() {
    const userName = this._userName_input.getValue();

    try {
      if (userName) {
        await this._mod.userWantsToJoin(userName);
      } else {
        this._modal.openModal("warning", this._mod.getLanguage().welcome_start.noUserName);
      }
    } catch (e) {
      console.error("joinGame", e);
    }
  }

  async createGame() {
    const userName = this._userName_input.getValue();
    try {
      if (userName) {
        await this._mod.userWantsToCreate(userName);
      } else {
        this._modal.openModal("warning", this._mod.getLanguage().welcome_start.noUserName);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("welcome-screen", WelcomeScreen);

export default WelcomeScreen;
