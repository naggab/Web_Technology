import templateHTML from "./template.html";
import {Button} from "../../components/button";
import AbstractScreen from "../AbstractScreen";
import {MasterOfDisaster} from "../../masterOfDisaster";

class WelcomeScreen extends AbstractScreen {
    _joinGameButton: Button;
    _createGameButton: Button;
    _mod: MasterOfDisaster;
    _userName_input: any;

    constructor() {
        super();
        document.title = "Welcome";

    }

    onMounted() {

        this._mod = MasterOfDisaster.getInstance();

        this._joinGameButton = this.shadowRoot.querySelector("#join-game-button") as Button;
        this._createGameButton = this.shadowRoot.querySelector("#create-game-button") as Button;
        this._userName_input = this.shadowRoot.querySelector("#userName");

        this._joinGameButton.onclick = this.joinGame.bind(this);
        this._createGameButton.onclick = this.createGame.bind(this);

    }


    async joinGame() {
        let userName = this._userName_input.value;
        userName = "Tester";
        try {
            if (userName) {
                await this._mod.userWantsToJoin(userName);
            } else {
                alert("Username is missing!");
            }
        } catch (e) {
            console.error("joinGame", e);
        }
    }

    async createGame() {
        let userName = this._userName_input.value;
        userName = "Tester";

        try {
            if (userName) {
                await this._mod.userWantsToCreate(userName);
            } else {
                alert("Username is missing!");
            }
        } catch (e) {
            console.error(e);
        }
    }

    async getHtml() {
        return templateHTML;
    }
}

customElements.define("welcome-screen", WelcomeScreen);

export default WelcomeScreen;
