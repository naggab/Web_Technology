import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";
import "../../components/playerList";
import { Button } from "../../components/button";
import { MasterOfDisaster } from "../../masterOfDisaster";
export default class Lobby extends AbstractScreen {
  startButton_: Button;
  startInfo_: HTMLParagraphElement;

  constructor() {
    super();
    this.setTitle("Lobby");
  }

  onMounted(): void | Promise<void> {
    this.startButton_ = this.shadowRoot.querySelector("#start_now_button");
    this.startInfo_ = this.shadowRoot.querySelector(".start_info");
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

customElements.define("game-lobby", Lobby);
