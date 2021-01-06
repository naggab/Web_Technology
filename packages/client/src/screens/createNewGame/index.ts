import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/inputBox";
import { TextBox } from "../../components/inputBox";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { CommandOp } from "@apirush/common/src";

class CreateNewGameScreen extends AbstractScreen {
  _inputBox: TextBox;
  _createButton: Button;
  constructor() {
    super();
  }

  onMounted(): void | Promise<void> {
    this._inputBox = this.shadowRoot.querySelector("text-box");
    this._createButton = this.shadowRoot.querySelector("#enter-existing-game-button");
    this._createButton.onclick = async () => {
      const inputEl = this._inputBox.shadowRoot.querySelector("input");
      const gameName = inputEl.value;
      const mod = MasterOfDisaster.getInstance();
      await mod.serverSession.sendRPC(CommandOp.HELLO, { name: "Tester" });
      const result = await mod.serverSession.sendRPC(CommandOp.CREATE_GAME, { name: gameName });
      console.log("ok", result);
    };
    this.setTitle("Create New Game");
  }

  async getHtml() {
    return templateHTML;
  }
}
customElements.define("create-new-game-screen", CreateNewGameScreen);
export default CreateNewGameScreen;
