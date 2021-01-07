import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/playerList";
export default class Lobby extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Lobby");
  }
  async getHtml() {
    return templateHTML;
  }
}

customElements.define("game-lobby", Lobby);
