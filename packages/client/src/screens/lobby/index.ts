import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

export default class Lobby extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Lobby");
  }
  async getHtml() {
    return templateHTML;
  }
}
