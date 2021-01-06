import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/inputBox";
import { TextBox } from "../../components/inputBox";

export default class extends AbstractScreen {
  _inputBox: TextBox;
  constructor() {
    super();
    this._inputBox = document.querySelector("text-box");
    this.setTitle("Create New Game");
  }

  async getHtml() {
    return templateHTML;
  }
}
