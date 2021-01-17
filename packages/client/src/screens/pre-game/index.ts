import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/playerList";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
import Container from "../../components/container";
class PreGameScreen extends AbstractScreen {
  startButton_: Button;
  startInfo_: HTMLParagraphElement;
  _container: Container;

  constructor() {
    super();
    this.setTitle("Lobby");
  }

  onMounted(): void | Promise<void> {
    this.startButton_ = this.shadowRoot.querySelector("#start_now_button");
    this.startInfo_ = this.shadowRoot.querySelector(".start_info");
    this._container = this.shadowRoot.querySelector("apirush-container");
    this._container.showArrow();
    const mod = MasterOfDisaster.getInstance();
    if (mod.myPlayer && mod.myPlayer.isAdmin) {
      this.startButton_.classList.remove("hidden");
      this.startInfo_.classList.add("hidden");
    }
    this.startButton_.onclick = () => {
      mod.startGame();
    };
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("pre-game-screen", PreGameScreen);

export default PreGameScreen;
