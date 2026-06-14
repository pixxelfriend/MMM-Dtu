# MMM-Dtu

This is a [Magic Mirror²](https://magicmirror.builders/) module which displays data of your solar energy inverter which is collected by `AhoiDTU` custom DTU.
More information can be found on [The official AhoiDTU Homepage](https://ahoydtu.de/)

![MMM-DTU-INVERTER](/screenshots/mmm-dtu-inverter.png)
![MMM-DTU-NO-BORDER](/screenshots/mmm-dtu-no-border.png)
![MMM-DTU-TWO-INVERTER](/screenshots/mmm-dtu-2-inverter.png)

## Configuration

| Option          | Default     | Description                                                                                        |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| inverters       | `[0]`       | Comma separated list of your inverters. For two inverters use `[0,1]`                              |
| hostname        | `undefined` | The hostname or IP of your AhoiDTU                                                                 |
| fetchInterval   | `1`         | Update interval in minutes.                                                                        |
| timeOnly        | `false`     | Display time without date. Setting this to true will hide the date.                                |
| withBorder      | `true`      | Display a border around the module                                                                 |
| borderClass     |  `border`   | Default CSS class name of the border.                                                              |

## Configuration Example

```javascript
config: {
  hostname: "192.168.0.55",
  fetchInterval: 2,
}
```
