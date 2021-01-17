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
      const seed = MasterOfDisaster.getInstance().getGameSeed();
      const index = seed % this.cities.length;
      debugPrint(this.position);
      debugPrint("Current lat: " + this.position.coords.latitude + ", lon: " + this.position.coords.longitude);
      debugPrint("Target lat: " + this.cities[index].cityLat + ", lon: " + this.cities[index].cityLon);
      var calcDist = this.calcCrow(
        this.position.coords.latitude,
        this.position.coords.longitude,
        this.cities[index].cityLat,
        this.cities[index].cityLon,
      );
      debugPrint("Calculated distance: " + calcDist);
      debugPrint("Input: " + this.distanceInput.getValue());
      var dif = calcDist - toNumber(this.distanceInput.getValue());
      debugPrint("Dif: " + dif);

      if (Math.abs(dif) > this.tolerance) {
        this.infoElement.innerHTML =
          this.modInstance.getString().geo_distance_task.you_are +
          Math.abs(dif).toFixed(2) +
          this.modInstance.getString().geo_distance_task.km_off;
        this.infoElement.style.color = "red";
        debugPrint("Task failed.");
        this.result = false;
      } else {
        this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.task_complete + calcDist.toFixed(2);
        debugPrint("Task complete.");
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

  populateCities() {
    this.cities = [];
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
    /*this.cities.push(new City("Barcelona, Spain", 41.23, 2.9));
    this.cities.push(new City("Berlin, Germany", 52.3, 13.25));
    this.cities.push(new City("Brussels, Belgium", 50.52, 4.22));
    this.cities.push(new City("Bucharest, Romania", 44.25, 26.7));*/
  }

  attachGeoAPI() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.showPosition.bind(this), this.showError.bind(this));
    } else {
      this.infoElement.innerHTML = this.modInstance.getString().geo_distance_task.geo_position_unavailable;
    }
  }

  showPosition(position: Position) {
    const seed = MasterOfDisaster.getInstance().getGameSeed();
    const index = seed % this.cities.length;
    this.cityInfo.innerHTML = this.cities[index].cityName;
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
