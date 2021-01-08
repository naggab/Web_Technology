import templateHTML from "./template.html";
import { Button } from "../../components/button";
import AbstractScreen from "../AbstractScreen";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { router } from "../../router";

class WelcomeScreen extends AbstractScreen {
  _joinGameButton: Button;
  _createGameButton: Button;
  _mod: MasterOfDisaster;
  _userName_input: any;
  _debug = true;

  constructor() {
    super();
    document.title = "Welcome";
  }

  onMounted() {
    this._mod = MasterOfDisaster.getInstance();

    this._joinGameButton = this.shadowRoot.querySelector("#join-game-button") as Button;
    this._createGameButton = this.shadowRoot.querySelector("#create-game-button") as Button;
    this._userName_input = this.shadowRoot.querySelector("#userName");

    this._joinGameButton.onclick = this.joinGame.bind(this);
    this._createGameButton.onclick = this.createGame.bind(this);
    let _showAllTasks: Button = this.shadowRoot.querySelector("#show-all-tasks");

    if (this._debug) {
      _showAllTasks.classList.remove("hidden");
      _showAllTasks.onclick = this.showAllTasks;
    }
  }
  showAllTasks() {
    router("all-tasks");
  }

  async joinGame() {
    let userName = this._userName_input.value;
    userName = "Tester";
    try {
      if (userName) {
        await this._mod.userWantsToJoin(userName);
      } else {
        alert("Username is missing!");
      }
    } catch (e) {
      console.error("joinGame", e);
    }
  }

  async createGame() {
    let userName = this._userName_input.value;
    userName = "Tester";

    try {
      if (userName) {
        await this._mod.userWantsToCreate(userName);
      } else {
        alert("Username is missing!");
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
