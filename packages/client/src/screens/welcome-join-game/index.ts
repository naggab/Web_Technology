import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/gameList";
import { MasterOfDisaster } from "../../masterOfDisaster";

class WelcomeJoinGame extends AbstractScreen {
  _mod: MasterOfDisaster;
  constructor() {
    super();
    this.setTitle("Enter Existing Game");
  }
  onMounted() {
    this._mod = MasterOfDisaster.getInstance();
    const title = this.shadowRoot.querySelector("#title");

    title.innerHTML = this._mod.getLanguage().welcome_join.title;
  }

  async getHtml() {
    return templateHTML;
  }
}
customElements.define("join-game-screen", WelcomeJoinGame);
export default WelcomeJoinGame;
