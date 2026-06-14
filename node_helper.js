var NodeHelper = require("node_helper");

const API_PATH_LIVE = "/api/live";
const API_PATH_INVERTER = "/api/inverter/id/";

module.exports = NodeHelper.create({
  // Override start method.
  start: function () {
    this.states = {};
    this.fetchers = {};
    console.log("Starting node helper for: " + this.name);
  },

  // Override socketNotificationReceived method.
  socketNotificationReceived: async function (notification, payload) {
    if (notification === "MMM-DTU-SETUP") {
      const { identifier, hostname, inverters, fetchInterval } = payload;

      // Clean up previous intervals for this instance if they exist
      if (this.fetchers[identifier]) {
        for (const id in this.fetchers[identifier]) {
          clearInterval(this.fetchers[identifier][id]);
        }
      }

      this.states[identifier] = {
        hostname,
        inverters,
        fetchInterval,
        inverterData: {},
        lastUpdate: null,
        fieldNames: null,
        fieldUnits: null
      };

      this.fetchers[identifier] = {};

      // Try fetching field names first
      try {
        await this.setFieldNames(identifier);
      } catch (e) {
        console.error(`${this.name}: Fetching field names failed for ${identifier}`, e);
      }

      const instance = this;
      for (const id of inverters) {
        // Fetch immediately
        instance.fetchApiData(identifier, id);
        // Set up recurring update interval
        this.fetchers[identifier][id] = setInterval(function () {
          instance.fetchApiData(identifier, id);
        }, fetchInterval * 60 * 1000);
      }
    }
  },

  sendDataToClient: function (identifier) {
    const state = this.states[identifier];
    if (!state) return;

    this.sendSocketNotification("INVERTER_DATA_RECEIVED", {
      identifier,
      inverterData: state.inverterData,
      lastUpdate: state.lastUpdate
    });
  },

  sendErrorToClient: function (identifier) {
    const state = this.states[identifier];
    if (!state) return;

    this.sendSocketNotification("SENSOR_DATA_CONNECTION_ERROR", {
      identifier,
      lastUpdate: state.lastUpdate
    });
  },

  // Update Sensor Data.
  updateInverterData: function (identifier, data) {
    const state = this.states[identifier];
    if (!state) return;

    const { fieldNames, fieldUnits } = state;
    if (!fieldNames || !fieldUnits) {
      console.warn(`${this.name}: Field names/units not loaded yet for ${identifier}`);
      return;
    }

    const valuePairs = data.ch[0].reduce((result, value, index) => {
      const name = fieldNames[index];
      const unit = fieldUnits[index];
      // Kombiniere Wert und Einheit zu einem String und füge es dem Ergebnisobjekt hinzu.
      result[name] = `${value} ${unit}`;
      return result;
    }, {});

    state.lastUpdate = new Date();
    state.inverterData[data.id] = {
      values: valuePairs,
      name: data.name,
      lastUpdate: new Date(data.ts_last_success * 1000)
    };

    this.sendDataToClient(identifier);
  },

  async setFieldNames(identifier) {
    const state = this.states[identifier];
    if (!state) return;

    const url = "http://" + state.hostname + API_PATH_LIVE;
    console.log(`${this.name}: setFieldNames fetchData from ${url}`);
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        state.fieldNames = [...data.ch0_fld_names];
        state.fieldUnits = [...data.ch0_fld_units];
      } else {
        const error = await response.text();
        throw new Error(`No positive response: ${error}`);
      }
    } catch (e) {
      console.error(`${this.name} (${identifier}): ${e.message || e}`);
      this.sendErrorToClient(identifier);
    }
  },

  async fetchApiData(identifier, id) {
    const state = this.states[identifier];
    if (!state) return;

    const url = "http://" + state.hostname + API_PATH_INVERTER + id;
    console.log(`${this.name}: fetchApiData fetchData from ${url}`);

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this.updateInverterData(identifier, data);
      } else {
        const error = await response.text();
        throw new Error(`No positive response: ${error}`);
      }
    } catch (e) {
      console.error(`${this.name} (${identifier}): ${e.message || e}`);
      this.sendErrorToClient(identifier);
    }
  }
});
