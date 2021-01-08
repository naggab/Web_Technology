import templateHTML from "./template.html";

interface MinimumEntryDetails {
  id: string | number;
}

const ID_ATTRIBUTE_NAME = "_id_";

export abstract class List<EntryData extends MinimumEntryDetails> extends HTMLElement {
  container_: HTMLDivElement;
  entryTemplate_: HTMLTemplateElement;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this.container_ = shadowRoot.querySelector(".list") as any;
    this.entryTemplate_ = shadowRoot.getElementById("list-entry-template") as any;
  }

  abstract getEntryContentTemplate(): HTMLTemplateElement;
  abstract applyEntryData(el: HTMLElement, data: EntryData);
  onEntryClicked?(id: EntryData["id"]);

  connectedCallback() {}
  disconnectedCallback() {}

  addEntry(data: EntryData) {
    const newHtmlFrag = this.entryTemplate_.content.cloneNode(true) as HTMLElement;
    const newHtml = newHtmlFrag.querySelector(".list-entry") as HTMLElement;

    const entryContentTemplate = this.getEntryContentTemplate();
    newHtml.appendChild(entryContentTemplate.content.cloneNode(true));
    if (this.onEntryClicked) {
      newHtml.onclick = () => this.onEntryClicked(data.id);
      newHtml.classList.add("list-entry-clickable");
    }
    newHtml.setAttribute(ID_ATTRIBUTE_NAME, `${data.id}`);
    this.applyEntryData(newHtml, data);
    this.container_.appendChild(newHtml);
  }

  private findEntry(id: EntryData["id"]): HTMLElement {
    const gameEntries = this.container_.children;
    for (let gameEntry of gameEntries) {
      if (gameEntry.getAttribute(ID_ATTRIBUTE_NAME) === `${id}`) {
        return gameEntry as HTMLElement;
      }
    }
    throw new Error("unable to find GameEntry with id: " + id);
  }

  removeEntry(id: EntryData["id"]) {
    this.findEntry(id).remove();
  }

  updateEntry(data: EntryData) {
    const gameEntry = this.findEntry(data.id);
    this.applyEntryData(gameEntry, data);
  }
}
