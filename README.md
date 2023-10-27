# MMM-Luftdaten

This is a [Magic Mirror²](https://magicmirror.builders/) module which displays data of your solar energy inverter which is collected by `AhoiDTU` custom DT. It fetches the data regulary from [Luftdaten.info](https://luftdaten.info/) and displays it right on your mirror. The module should support any kind of temperature and particular matter sensor, aso long as they are listed on Luftdaten.info

![MMM-DTU](/screenshots/mmm-luftdaten.png) ![MMM-Luftdaten-Border](/screenshots/mmm-luftdaten-border.png)

### Configuration

| Option          | Default     | Description                                                                                                                                                                                                     |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| inverters       | `[]`        | Comma seperated list of your inverters. Usually the first inverter will have id 0, the next id 1                                                                                                                |
| hostname        | `undefined` |  The hostname or IP of your AhoiDTU                                                                                                                                                                             |
| fetchInterval   | `1`         | Update interval in minutes. |
| timeOnly        | `false`     | Display time without date. Setting this to true will hide the date.                                                                                                                                             |
| withBorder      | `true`      | Display a border around the module                                                                                                                                                                              |
|  borderClass    |  `border`   | Default CSS class name of the border.                                                                                                                                                                           |

### Configuration Example

```javascript
config: {
	hostname: "192.168.0.55",
	inverters: [0,1],
	fetchInterval: 2,

}
```
