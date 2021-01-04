import templateHTML from "./template.html";
import { Button } from "../../components/button";
import AbstractScreen from "../AbstractScreen";

export default class extends AbstractScreen {
  constructor() {
    super();
    document.title = "Welcome";
  }

  async getHtml() {
    return templateHTML;
  }
}
