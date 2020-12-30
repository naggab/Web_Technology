
const template = document.createElement('template');

template.innerHTML = template.innerHTML=`<style>:host {
  margin-bottom: 10px;
  margin-top: 10px;
  margin-left: -10px;
  display: block;
}

.form-field {
  display: table;
  width: 200px;
  height: 40px;
  }

label,
input {
  display: table-cell;
  width: 200px;
  height: 30px;
  padding-left: 10px;
  
  border-radius: 25px;
  border-color: white;
  color: white;
  background: transparent;

}

label {
  padding-right: 0px;
  color: white;

}

.error {
  display: block;
}

.hidden {
  display: none;
}

</style>

<div class="form-field">
    <label></label>
    <input type="text" />
</div>`;


export class TextBox extends HTMLElement {
    label: any;
    $input: any;
    static get observedAttributes() {
      return ["label", "type", "error-message"];
    }
  
    constructor() {
      super();
      const shadowRoot = this.attachShadow({ mode: "open" });
  
      this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
        case "label":
            this.label.innerText = newValue;
            break;
        case "type":
            this.$input.type = newValue;
            break;
        default:
            break;
    }
  }
  
    
  }
  
  window.customElements.define('text-box', TextBox);
  