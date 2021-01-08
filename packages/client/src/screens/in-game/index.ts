import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "./game-playground/index";

export class InGameScreen extends AbstractScreen {
  async getHtml() {
    return templateHTML;
  }
}

customElements.define("game-screen", InGameScreen);
