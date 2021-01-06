import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/gameList";

export default class extends AbstractScreen {
  constructor() {
    super();
    this.setTitle("Enter Existing Game");
  }
  async getHtml() {
    return templateHTML;
  }
}
