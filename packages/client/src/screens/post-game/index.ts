import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";

class PostGameScreen extends AbstractScreen {
  constructor() {
    super();
    document.title = "Post-Game";
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("post-game-screen", PostGameScreen);

export default PostGameScreen;
