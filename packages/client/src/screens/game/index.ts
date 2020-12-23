import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "./game-playground/index";

export class Game extends AbstractScreen {
  async getHtml() {
    return templateHTML;
  }
}
