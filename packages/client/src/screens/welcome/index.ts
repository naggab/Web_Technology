import templateHTML from "./template.html";
import { Button } from "../../components/button";
import AbstractScreen from "../AbstractScreen";




export default class extends AbstractScreen{

  enter_exitsting_game_button: Button;
  create_new_game_button: Button;

  constructor() {
    super();
    document.title = "Welcome";
  }

  setProperties(){
      this.enter_exitsting_game_button = document.querySelector("#enter-existing-game-button") as Button;
      this.create_new_game_button = document.querySelector("#create-new-game-button") as Button;



    this.enter_exitsting_game_button.onclick = this.enterGame.bind(this);
    this.create_new_game_button.onclick = this.createNew.bind(this);
  }
  async createNew(){
      window.location.href = "/newGame";
  }
  async enterGame(){
    window.location.href = "/joinGame";
  }
  async getHtml(){
    return templateHTML;
  }
}
