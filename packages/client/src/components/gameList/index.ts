import { MasterOfDisaster } from "../../masterOfDisaster";

export class GameList extends HTMLElement {
  mOD: MasterOfDisaster = (<any>window).MOD;

  constructor() {
    super();
  }
}

customElements.define("game-list", GameList);
