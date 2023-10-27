Module.register("MMM-Dtu", {
  //default module config
  defaults: {
    inverter: [],
    inverterData: [],
    fetchInterval: 1, // update intervall in minutes
    timeOnly: false,
    withBorder: true,
    lastUpdate: null,
    borderClass: "border",
    connected: false,
    error: false
  },

  // Define required scripts.
  getStyles: function () {
    return ["MMM-Dtu.css", "font-awesome.css"];
  },

  // Define required scripts.
  getScripts: function () {
    return ["moment.js"];
  },

  // Define required translations.
  getTranslations: function () {
    return {
      en: "translations/en.json",
      de: "translations/de.json"
    };
  },

  getTemplate: function () {
    return "MMM-Dtu.njk";
  },

  // Override start method.
  start: function () {
    this.defaults = {
      ...this.defaults,
      ...this.config
    };
    const { inverter, hostname, fetchInterval } = this.defaults;

    this.sendSocketNotification("MMM-DTU-SETUP", {
      hostname,
      inverter,
      fetchInterval
    });
  },
  // Override socket notification handler.
  socketNotificationReceived: function (notification, payload) {
    if (payload.lastUpdate) {
      this.defaults.lastUpdate = payload.lastUpdate;
    }
    if (notification === "INVERTER_DATA_RECEIVED") {
      // console.log("INVERTER_DATA_RECEIVED", payload.inverterData);
      if (payload.inverterData) {
        this.defaults.error = false;
        this.defaults.connected = true;
        this.defaults.lastUpdate = payload.inverterData[0].lastUpdate;
        this.defaults.inverterData = [...payload.inverterData];
      }
    } else if (notification === "SENSOR_DATA_CONNECTION_ERROR") {
      this.defaults.error = true;
    } else {
      Log.log(
        `MMM-DTU received an unknown socket notification: ${notification}`
      );
    }
    this.updateDom(this.config.animationSpeed);
  },
  getTemplateData: function () {
    const data = {
      inverters: this.defaults.inverterData.map((it) => ({
        ...it,
        lastUpdate: this.formatDate(it.lastUpdate, true),
        status: this.getStatus(it)
      })),
      lastUpdate: this.formatDate(this.defaults.lastUpdate),
      borderClass: this.defaults.withBorder ? this.defaults.borderClass : "",
      connected: this.defaults.connected,
      error: this.defaults.error,
      text: {
        CONNECTING: this.translate("CONNECTING"),
        CONNECTION_ERROR: this.translate("CONNECTION_ERROR"),
        offline: this.translate("offline"),
        online: this.translate("online"),
        idle: this.translate("idle")
      }
    };
    return data;
  },
  getStatus(inverter) {
    if (!this.isToday(inverter.lastUpdate)) return "offline";
    const current = parseFloat(inverter.values.P_AC.split(" "));
    if (current) return "online";
    return "idle";
  },
  isToday(date) {
    return moment.utc(date).isSame(new Date(), "day");
  },
  formatDate: function (dateString, timeOnly) {
    const format = timeOnly ? "LT" : "L LT";
    const date = moment.utc(dateString).local();
    return date.format(format);
  }
});
