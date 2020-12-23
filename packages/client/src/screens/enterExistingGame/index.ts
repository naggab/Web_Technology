import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

export default class extends AbstractScreen{
  constructor() {
    super();
    this.setTitle("Enter Existing Game");
  }
  async getHtml(){
    return templateHTML;
  }
}

