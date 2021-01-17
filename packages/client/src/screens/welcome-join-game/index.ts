import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/gameList";
import { MasterOfDisaster } from "../../masterOfDisaster";
import Container from "../../components/container";

class WelcomeJoinGame extends AbstractScreen {
  _mod: MasterOfDisaster;
  _container: Container;
  constructor() {
    super();
    this.setTitle("Enter Existing Game");
  }
  onMounted() {
    this._mod = MasterOfDisaster.getInstance();
    const title = this.shadowRoot.querySelector("#title");
    this._container = this.shadowRoot.querySelector("apirush-container");
    this._container.showArrow();
    title.innerHTML = this._mod.getString().welcome_join.title;
  }

  async getHtml() {
    return templateHTML;
  }
}
customElements.define("join-game-screen", WelcomeJoinGame);
export default WelcomeJoinGame;
