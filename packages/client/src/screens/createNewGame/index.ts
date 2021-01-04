import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

export default class extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Create New Game");
  }
  async getHtml() {
    return templateHTML;
  }
}
