var NodeHelper = require("node_helper");
// const AbortController = require("abort-controller");

const ApiLive = "/api/live";
const ApiInverter = "/api/inverter/id/";

module.exports = NodeHelper.create({
  moduleName: "MMM-Dtu",
  state: {
    protocol: "http://",
    sensorApi: "http://192.168.0.146/api/inverter/id/",
    inverterData: [],
    inverter: [],
    lastUpdate: null,
    fieldNames: null,
    fieldUnits: null
  },
  // Override start method.
  start: function () {
    this.fetchers = [];
    console.log("Starting node helper for: " + this.name);
  },
  // Override socketNotificationReceived method.
  socketNotificationReceived: async function (notification, payload) {
    if (notification === "MMM-DTU-SETUP") {
      var { hostname, inverter, fetchInterval } = payload;

      this.state.hostname = hostname;
      this.state.fetchInterval = fetchInterval;

      if (!this.state.fieldNames) {
        try {
          await this.setFieldNames();
        } catch (e) {
          console.error("Fetching field names failed ");
        }
      }

      // await instance.fetchApiData(0);
      var instance = this;
      for (let id of inverter) {
        if (!this.state.inverter[id]) {
          instance.fetchApiData(id);
          this.state.inverter[id] = setInterval(function () {
            instance.fetchApiData(id);
          }, this.getUpdateInterval(fetchInterval));
        } else {
          //when sensor already exists, directly update data on all clients
          this.sendDataToClient();
        }
      }
    }
  },
  sendDataToClient: function () {
    this.sendSocketNotification("INVERTER_DATA_RECEIVED", {
      inverterData: this.state.inverterData,
      lastUpdate: this.state.lastUpdate
    });
  },
  sendErrorToClient: function () {
    this.sendSocketNotification("SENSOR_DATA_CONNECTION_ERROR", {
      lastUpdate: this.state.inverterData["lastUpdate"]
    });
  },
  // Update Sensor Data.
  updateInverterData: function (data) {
    console.log("INVERTER DATA; ", data);

    const { fieldNames, fieldUnits } = this.state;
    const valuePairs = data.ch[0].reduce((result, value, index) => {
      const name = fieldNames[index];
      const unit = fieldUnits[index];
      // Kombiniere Wert und Einheit zu einem String und füge es dem Ergebnisobjekt hinzu.
      result[name] = `${value} ${unit}`;
      return result;
    }, {});

    this.state.lastUpdate = new Date();
    this.state.inverterData[data.id] = {
      values: valuePairs,
      name: data.name,
      lastUpdate: new Date(data.ts_last_success * 1000)
    };

    this.sendDataToClient();
  },
  async setFieldNames() {
    const { protocol, hostname } = this.state;
    const url = protocol + hostname + ApiLive;
    const instance = this;
    console.log(`${this.moduleName}: setFieldNames fetchData from ${url}`);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this.state.fieldNames = [...data.ch0_fld_names];
        this.state.fieldUnits = [...data.ch0_fld_units];
      } else {
        const error = response.text();
        throw `No positive response ${error}`;
      }
    } catch (e) {
      console.error(`${this.moduleName}: ${e}`);
      this.sendErrorToClient();
    }
  },
  async fetchApiData(id) {
    console.log("fetchApiData");
    const { protocol, hostname } = this.state;
    const url = protocol + hostname + ApiInverter + id;
    console.log(`${this.moduleName}: fetchApiData fetchData from ${url}`);

    const instance = this;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        instance.updateInverterData(data);
      } else {
        const error = response.text();
        throw `No positive response ${error}`;
      }
    } catch (e) {
      console.error(`${this.moduleName}: ${e}`);
      this.sendErrorToClient();
    }
  },
  getUpdateInterval(minutes) {
    return minutes * 60 * 1000;
  }
});
