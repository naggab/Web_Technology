import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";
import "../../components/textBox";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { Button } from "../../components/button";
import { StatsStorage } from "../../statsStorage";



class StatsScreen extends AbstractScreen {
  _userName_input: any;
  _mod: MasterOfDisaster;


  constructor() {
    super();
    document.title = "Stats";
  }

  onMounted(){
    this._userName_input = this.shadowRoot.querySelector("#userName");
    this._userName_input.setHint(this._mod.getString().welcome_start.userName);

  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("stats-screen", StatsScreen);

export default StatsScreen;
