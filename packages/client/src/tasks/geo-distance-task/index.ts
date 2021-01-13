import viewHtml from "./view.html";
import { Task } from "../../task";
import { Button } from "../../components/button";
import { concat, times, toNumber } from "lodash";
import { Collection } from "konva/types/Util";
import { MasterOfDisaster } from "../../masterOfDisaster";
import { debugPrint } from "../../screens/in-game/game-playground";
import { Coordinate } from "@apirush/common";
import { TextBox } from "../../components/textBox";

class City {
  cityName: string;
  cityLat: number;
  cityLon: number;

  constructor(cityName: string, cityLat: number, cityLon: number) {
    this.cityName = cityName;
    this.cityLat = cityLat;
    this.cityLon = cityLon;
  }
}

export default class GeoDistanceTask extends Task {
  infoElement: HTMLElement;
  cityInfo: HTMLElement;
  checkButton: Button;
  distanceInput: TextBox;
  cities: City[];
  position: Position;
  tolerance: number;
  firstClick: boolean;
  result: boolean;

  constructor(props) {
    super(props);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.infoElement = this.shadowRoot.querySelector(".info") as HTMLElement;
    this.checkButton = this.shadowRoot.getElementById("check-button") as Button;
    this.cityInfo = this.shadowRoot.getElementById("city-info") as HTMLElement;
    this.firstClick = true;
    this.populateCities();
    this.tolerance = 250; //km
    this.result = false;

    this.attachGeoAPI();

    this.checkButton.addEventListener("click", (c) => {
      c.preventDefault();
      if (!this.position) this.changeButton();
      if (this.firstClick) {
        this.distanceInput = this.shadowRoot.getElementById("distance-input") as TextBox;
        const seed = MasterOfDisaster.getInstance().getGameSeed();
        const index = seed % this.cities.length;
        console.log(this.position);
        console.log("Current lat: " + this.position.coords.latitude + ", lon: " + this.position.coords.longitude);
        console.log("Target lat: " + this.cities[index].cityLat + ", lon: " + this.cities[index].cityLon);
        var calcDist = this.calcCrow(
          this.position.coords.latitude,
          this.position.coords.longitude,
          this.cities[index].cityLat,
          this.cities[index].cityLon,
        );
        console.log("Calculated distance: " + calcDist);
        console.log("Input: " + this.distanceInput.getValue());
        var dif = calcDist - toNumber(this.distanceInput.getValue());
        console.log("Dif: " + dif);

        if (Math.abs(dif) > this.tolerance) {
          this.infoElement.innerHTML = "Task failed! Try again.";
          console.log("Task failed.");
          this.result = false;
        } else {
          this.infoElement.innerHTML = "Task complete! Well done.";
          console.log("Task complete.");
          this.result = true;
        }
        this.changeButton();
      } else {
        this.finish(this.result);
      }
    });
  }
  onUnmounting(): void | Promise<void> {}

  changeButton() {
    this.firstClick = false;
    this.checkButton.setAttribute("label", "Back");
  }

  showError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.infoElement.innerHTML = "User denied the request for Geolocation.";
        break;
      case error.POSITION_UNAVAILABLE:
        this.infoElement.innerHTML = "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        this.infoElement.innerHTML = "The request to get user location timed out.";
        break;
      case error.UNKNOWN_ERROR:
        this.infoElement.innerHTML = "An unknown error occurred.";
        break;
    }
    this.changeButton();
  }

  populateCities() {
    this.cities = [];
    this.cities.push(new City("Amsterdam, Netherlands", 52.22, 4.53));
    this.cities.push(new City("Ankara, Turkey", 39.55, 32.55));
    this.cities.push(new City("Athens, Greece", 37.58, 23.43));
    this.cities.push(new City("Barcelona, Spain", 41.23, 2.9));
    this.cities.push(new City("Berlin, Germany", 52.3, 13.25));
    this.cities.push(new City("Brussels, Belgium", 50.52, 4.22));
    this.cities.push(new City("Bucharest, Romania", 44.25, 26.7));
  }

  attachGeoAPI() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition.bind(this), this.showError.bind(this));
    } else {
      this.infoElement.innerHTML = "Geolocation is not enabled.";
    }
  }

  showPosition(position: Position) {
    const seed = MasterOfDisaster.getInstance().getGameSeed();
    const index = seed % this.cities.length;
    this.cityInfo.innerHTML = "City: " + this.cities[index].cityName;
    this.position = position;
  }
  calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // km
    var dLat = this.toRad(lat2 - lat1);
    var dLon = this.toRad(lon2 - lon1);
    var lat1 = this.toRad(lat1);
    var lat2 = this.toRad(lat2);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }

  toRad(Value) {
    return (Value * Math.PI) / 180;
  }
}

customElements.define("geo-distance-task", GeoDistanceTask);
