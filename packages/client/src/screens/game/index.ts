import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "./game-playground/index";

export class GameScreen extends AbstractScreen {
  async getHtml() {
    return templateHTML;
  }
}

customElements.define("game-screen", GameScreen);
