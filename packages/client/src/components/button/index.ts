import templateHTML from "./template.html";
import { LitElement, html } from 'lit-element';

type ButtonStyleType = "red" | "green" | "transparent" | "white";

export class Button extends HTMLElement {
  _a: HTMLAnchorElement;

  static get observedAttributes() {
    return ["label", "styleType"];
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._a = shadowRoot.querySelector("a");
  }

  get label() {
    if (this.innerHTML) {
      return this.innerHTML;
    }
    return this.getAttribute("label") || "";
  }

  get styleType(): ButtonStyleType[] {
    const styleList = this.getAttribute("styleType");
    return (styleList.split(",") as ButtonStyleType[]) || ["white"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log("attributeChangedCallback");
    switch (name) {
      case "label":
        this._a.innerHTML = newValue;
        break;
      case "styleType":
        this._a.classList.add(...this.styleType);
      default:
        break;
    }
  }
  connectedCallback() {
    this._a.innerHTML = this.label;
    this._a.classList.add(...this.styleType);
  }
}

customElements.define("apirush-button", Button);







export class toggleSwitch extends HTMLElement {
  constructor () {
    super();
  }
  
  get leftposition() {
    return this.hasAttribute('leftposition');
  }
  get value() {
    return this.hasAttribute('value');
  }
  get checked() {
    return this.hasAttribute('checked');
  }

  connectedCallback () {
    let shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = `
      <style>


        .text-block1 {
          position: relative;
          bottom: 0px;
          right: -12px;
          top: -11px;
          background-color: transparent;
          color: white;
          z-index: 3;
        }

        .text-block2 {
          position: relative;
          bottom: 0px;
          right: -105px;
          top: -46px;
          background-color: transparent;
          color: white;
          z-index: 2;
        }

        .switch {
          position: relative;
          display: inline-block;

          width: 150px;
          height: 28px;
        }
        
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          border-radius: 25px;
          content: "ON";
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: black;
          -webkit-transition: .4s;
          transition: .4s;
          z-index: 1;
        }
        
        .slider:before {
          position: absolute;
          border-radius: 25px;
          font-family: "Roboto";
          font-weight: bold;
          text-align: center;
          content: "ON";
          height: 26px;
          width: 90px;
          left: 1px;
          bottom: 1px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }

        input:checked + .slider {
        background-color: black;
        z-index: 2;

        }
        
        input:checked + .slider:before {
          -webkit-transform: translateX(58px);
          -ms-transform: translateX(58px);
          transform: translateX(58px);
          font-weight: bold;

          text-align: center;

          content: "OFF";


        }


        
        
      </style>
      <label id='switchCmp' class="switch">

      <div class="text-block1">
      <p>ON</p>
      </div>

      <div class="text-block2">
      <p>OFF</p>
      </div>

        <input type="checkbox">
        <span id='switch' class="slider"></span>
      </label>

      <span id='label'></span>`;

    
     
    }

  }

window.customElements.define('toggle-switch', toggleSwitch);

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
