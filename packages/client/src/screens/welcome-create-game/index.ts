import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import "../../components/PopUp";
import { PopUp } from "../../components/PopUp";
import Container from "../../components/container";

class WelcomeCreateGame extends AbstractScreen {
  _gameName_input: any;
  _createGameButton: Button;
  _mod: MasterOfDisaster;
  _modal: PopUp;
  _container: Container;

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

    this._container = this.shadowRoot.querySelector("apirush-container");
    this._container.showArrow();
    this.shadowRoot.querySelector("#title").innerHTML = this._mod.getString().welcome_create.title;
    this.shadowRoot.querySelector("#choose-game").innerHTML = this._mod.getString().welcome_create.gameName;
    this._gameName_input.setHint(this._mod.getString().welcome_create.gameNameHint);
    this._createGameButton.setLabel(this._mod.getString().welcome_create.createGame);
    this.setRandomName();
  }

  async setRandomName() {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon");
    //const response = await fetch("https://randomuser.me/api/");
    let data = await response.json();
    //data = data.results[0].name;
    data = data.results[Math.floor(Math.random() * data.results.length)];
    //this._userName_input.setValue(data.first + " " + data.last);
    this._gameName_input.setValue(data.name);
  }

  async createGame() {
    const gameName = this._gameName_input.getValue();
    if (gameName) {
      await this._mod.createGame(gameName);
    } else {
      this._modal.openModal("warning", this._mod.getString().welcome_create.noGameName);
    }
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("create-new-game-screen", WelcomeCreateGame);
export default WelcomeCreateGame;
