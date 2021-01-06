import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/gameList";

class JoinGameScreen extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Enter Existing Game");
  }
  async getHtml() {
    return templateHTML;
  }
}
customElements.define("join-game-screen", JoinGameScreen);
export default JoinGameScreen;
