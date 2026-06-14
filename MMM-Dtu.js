Module.register("MMM-Dtu", {
  //default module config
  defaults: {
    inverters: [0],
    fetchInterval: 1, // update interval in minutes
    timeOnly: false,
    withBorder: true,
    borderClass: "border"
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
    let inverters = this.config.inverters || this.config.inverter || [0];
    if (!Array.isArray(inverters)) {
      inverters = [inverters];
    }
    this.inverters = inverters;
    this.inverterData = {};
    this.lastUpdate = null;
    this.connected = false;
    this.error = false;

    this.sendSocketNotification("MMM-DTU-SETUP", {
      identifier: this.identifier,
      hostname: this.config.hostname,
      inverters: this.inverters,
      fetchInterval: this.config.fetchInterval
    });
  },

  // Override socket notification handler.
  socketNotificationReceived: function (notification, payload) {
    if (!payload || payload.identifier !== this.identifier) {
      return;
    }

    if (payload.lastUpdate) {
      this.lastUpdate = payload.lastUpdate;
    }

    if (notification === "INVERTER_DATA_RECEIVED") {
      if (payload.inverterData) {
        this.error = false;
        this.connected = true;
        this.inverterData = { ...payload.inverterData };
      }
    } else if (notification === "SENSOR_DATA_CONNECTION_ERROR") {
      this.error = true;
    } else {
      Log.log(
        `MMM-DTU received an unknown socket notification: ${notification}`
      );
    }
    this.updateDom(this.config.animationSpeed);
  },

  getTemplateData: function () {
    const invertersList = this.inverters
      .map((id) => {
        const it = this.inverterData[id];
        if (!it) return null;
        return {
          ...it,
          lastUpdate: this.formatDate(it.lastUpdate, true),
          status: this.getStatus(it)
        };
      })
      .filter(Boolean);

    return {
      inverters: invertersList,
      lastUpdate: this.formatDate(this.lastUpdate),
      borderClass: this.config.withBorder ? this.config.borderClass : "",
      connected: this.connected,
      error: this.error,
      text: {
        SOLAR_PRODUCTION: this.translate("SOLAR_PRODUCTION"),
        CURRENT_DC: this.translate("CURRENT_DC"),
        FEED_IN: this.translate("FEED_IN"),
        TODAY: this.translate("TODAY"),
        TOTAL: this.translate("TOTAL"),
        UPDATE: this.translate("UPDATE"),
        STATUS: this.translate("STATUS"),
        CONNECTING: this.translate("CONNECTING"),
        CONNECTION_ERROR: this.translate("CONNECTION_ERROR"),
        offline: this.translate("offline"),
        online: this.translate("online"),
        idle: this.translate("idle")
      }
    };
  },

  getStatus(inverter) {
    if (!this.isToday(inverter.lastUpdate)) return "offline";
    const current = parseFloat(inverter.values.P_AC);
    if (current) return "online";
    return "idle";
  },

  isToday(date) {
    return moment.utc(date).isSame(new Date(), "day");
  },

  formatDate: function (dateString, timeOnly) {
    if (!dateString) return "";
    const format = timeOnly ? "LT" : "L LT";
    const date = moment.utc(dateString).local();
    return date.format(format);
  }
});
