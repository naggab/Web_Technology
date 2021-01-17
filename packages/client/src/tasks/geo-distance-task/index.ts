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
  citiesFar: City[];
  position: Position;
  tolerance: number;
  firstClick: boolean;
  result: boolean;

  gameSeed: number;
  index: number;

  accurate: boolean;
  accuracy: number;

  modInstance: MasterOfDisaster;

  constructor(props) {
    super(props);
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    this.modInstance = MasterOfDisaster.getInstance();
    this.infoElement = this.shadowRoot.querySelector(".info") as HTMLElement;
    this.checkButton = this.shadowRoot.getElementById("check-button") as Button;
    this.cityInfo = this.shadowRoot.getElementById("city-info") as HTMLElement;

    let title = this.shadowRoot.getElementById("title") as HTMLElement;
    let desc = this.shadowRoot.getElementById("desc") as HTMLElement;
    if (title) title.innerHTML = this.modInstance.getString().geo_distance_task.geo_title;
    if (desc) desc.innerHTML = this.modInstance.getString().geo_distance_task.geo_desc;

    let txtbox = this.shadowRoot.getElementById("distance-input") as TextBox;
    if (txtbox) {
      txtbox.setHint(this.modInstance.getString().geo_distance_task.hint);
      txtbox.style.fontSize = "12px";
    }

    this.firstClick = true;
    this.populateCities();
    this.tolerance = 0.5; //km
    this.result = false;

    this.attachGeoAPI();

    this.checkButton.addEventListener("click", (c) => {
      c.preventDefault();
      if (!this.position) this.changeButton();
      this.distanceInput = this.shadowRoot.getElementById("distance-input") as TextBox;

      const target = this.accurate ? this.cities[this.index] : this.citiesFar[this.index];
      this.modInstance.log(this.position);
      this.modInstance.log(
        "Current lat: " + this.position.coords.latitude + ", lon: " + this.position.coords.longitude,
      );
      this.modInstance.log("Target lat: " + target.cityLat + ", lon: " + target.cityLon);
      var calcDist = this.calcCrow(
        this.position.coords.latitude,
        this.position.coords.longitude,
        target.cityLat,
        target.cityLon,
      );
      this.modInstance.log("Calculated distance: " + calcDist);

      const accuracyOffset = this.accuracy < 100000 ? this.accuracy / 1000 : 100;
      this.tolerance = calcDist * 0.1 + accuracyOffset;
      this.modInstance.log("Calculated tolerance: " + this.tolerance);
      this.modInstance.log("Input: " + this.distanceInput.getValue());
      var dif = calcDist - toNumber(this.distanceInput.getValue());
      this.modInstance.log("Dif: " + dif);

      if (Math.abs(dif) > this.tolerance) {
        this.infoElement.innerHTML =
          this.modInstance.getString().geo_distance_task.you_are +
          Math.abs(dif).toFixed(2) +
          this.modInstance.getString().geo_distance_task.km_off;
        this.infoElement.style.color = "red";
        this.modInstance.log("Task failed.");
        this.result = false;
      } else {
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.task_complete + calcDist.toFixed(2);
        this.modInstance.log("Task complete.");
        this.infoElement.style.color = "green";
        this.result = true;
      }
      this.changeButton();
      this.finish(this.result);
    });
  }
  onUnmounting(): void | Promise<void> {}

  changeButton() {
    this.firstClick = false;
    this.checkButton.style.display = "none";
  }

  showError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_permission_denied;
        break;
      case error.POSITION_UNAVAILABLE:
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_position_unavailable;
        break;
      case error.TIMEOUT:
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_timeout;
        break;
      case error.UNKNOWN_ERROR:
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_unknown;
        break;
    }
    this.changeButton();
  }

  async reverseGeocode() {
    //https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=37.42159&longitude=-122.0837&localityLanguage=de
    const response = await fetch(
      "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
        this.position.coords.latitude +
        "&longitude=" +
        this.position.coords.longitude +
        "&localityLanguage=de",
    );
    let data = await response.json();
    if (data) {
      let reverseGeo = this.shadowRoot.getElementById("reverse-geo") as HTMLElement;
      if (data.locality) {
        this.modInstance.log("User belongs to: " + data.locality);
        reverseGeo.innerHTML =
          "(" +
          this.modInstance.getString().geo_distance_task.reverse_geo +
          " in <a href=https://www.google.com/maps/search/?api=1&query=" +
          this.position.coords.latitude +
          "," +
          this.position.coords.longitude +
          ">" +
          data.locality +
          "</a>)";
      } else {
        reverseGeo.innerHTML =
          "(" +
          this.modInstance.getString().geo_distance_task.reverse_geo +
          " <a href=https://www.google.com/maps/search/?api=1&query=" +
          this.position.coords.latitude +
          "," +
          this.position.coords.longitude +
          ">" +
          this.modInstance.getString().geo_distance_task.here +
          "</a>)";
      }
    }
  }

  populateCities() {
    this.cities = [];
    this.citiesFar = [];
    this.cities.push(
      new City(
        this.modInstance.getString().geo_distance_task.locations.airport,
        46.992662757295506,
        15.439313970639423,
      ),
    );
    this.cities.push(
      new City(
        this.modInstance.getString().geo_distance_task.locations.main_square,
        47.070862490223575,
        15.43828259288286,
      ),
    );
    this.cities.push(
      new City(
        this.modInstance.getString().geo_distance_task.locations.clock_tower,
        47.073652843582806,
        15.437710276978079,
      ),
    );
    this.cities.push(
      new City(
        this.modInstance.getString().geo_distance_task.locations.old_campus,
        47.06921300575033,
        15.450570035291022,
      ),
    );
    this.cities.push(
      new City(this.modInstance.getString().geo_distance_task.locations.inffeld, 47.05843475596749, 15.460150503895983),
    );

    this.citiesFar.push(new City("Barcelona, Spain", 41.38944063532783, 2.168256911382828));
    this.citiesFar.push(new City("Berlin, Germany", 52.51632115408761, 13.379261492644249));
    this.citiesFar.push(new City("Brussels, Belgium", 50.846576717475195, 4.353359962004268));
    this.citiesFar.push(new City("Bucharest, Romania", 44.43552746503677, 26.10252373681218));
    this.citiesFar.push(new City("London, England", 51.501113719778765, -0.12637402000154613));
    this.citiesFar.push(new City("New York, USA", 40.71685401232322, -74.01083618081547));
    this.citiesFar.push(new City("Chicago, USA", 41.87557396655769, -87.62917945773634));
    this.citiesFar.push(new City("Istanbul, Turkey", 41.00810759168975, 28.978237100904202));
  }

  attachGeoAPI() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition.bind(this), this.showError.bind(this), {
        maximumAge: 1000 * 60 * 60 * 24,
        timeout: 2000,
        enableHighAccuracy: true,
      });
    } else {
      this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_position_unavailable;
    }
  }

  showPosition(position: Position) {
    this.position = position;
    this.gameSeed = MasterOfDisaster.getInstance().getGameSeed();
    this.accuracy = this.position.coords.accuracy;
    this.accurate = this.accuracy < 1000 ? true : false;
    this.modInstance.log("Accurate measurement? " + this.accurate);
    this.index = this.accurate ? this.gameSeed % this.cities.length : this.gameSeed % this.citiesFar.length;
    this.cityInfo.innerHTML = this.accurate ? this.cities[this.index].cityName : this.citiesFar[this.index].cityName;
    this.reverseGeocode();
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
