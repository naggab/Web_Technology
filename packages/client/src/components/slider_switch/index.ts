






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
