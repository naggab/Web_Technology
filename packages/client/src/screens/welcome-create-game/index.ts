import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/inputBox";
import {TextBox} from "../../components/inputBox";
import {Button} from "../../components/button";
import {MasterOfDisaster} from "../../masterOfDisaster";
import {CommandOp} from "@apirush/common/src";

class WelcomeCreateGame extends AbstractScreen {
    _inputBox: any;
    _createButton: Button;
    _mod: MasterOfDisaster;

    constructor() {
        super();
        this.setTitle("Create New Game");

    }

    onMounted() {
        this._mod = MasterOfDisaster.getInstance();
        this._inputBox = this.shadowRoot.querySelector("text-box");


        this._createButton = this.shadowRoot.querySelector("#create-game-button");
        this._inputBox = this._inputBox.shadowRoot.querySelector("input").value;

        this._createButton.onclick = this.createGame.bind(this);
    }

    async createGame() {
        await this._mod.createGame(this._inputBox);

    }

    async getHtml() {
        return templateHTML;
    }
}

customElements.define("create-new-game-screen", WelcomeCreateGame);
export default WelcomeCreateGame;
