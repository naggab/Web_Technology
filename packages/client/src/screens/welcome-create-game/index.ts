import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";

class WelcomeCreateGame extends AbstractScreen {
  _gameName_input: any;
  _createGameButton: Button;
  _mod: MasterOfDisaster;

  constructor() {
    super();
    this.setTitle("Create New Game");
  }

  onMounted() {
    this._mod = MasterOfDisaster.getInstance();
    this._gameName_input = this.shadowRoot.querySelector("text-box");

    this._createGameButton = this.shadowRoot.querySelector("#create-game-button");

    this._createGameButton.onclick = this.createGame.bind(this);
  }

  async createGame() {
    const gameName = this._gameName_input.getValue();
    if (gameName) {
      await this._mod.createGame(gameName);
    } else {
      alert("Game name is missing!!!");
    }
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("create-new-game-screen", WelcomeCreateGame);
export default WelcomeCreateGame;
