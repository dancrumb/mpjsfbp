// Take an `array` of values and send each value as an IP into `outport`
export default function (array, outport) {
  array.forEach(value => {
    const ip = this.createIP(value);
    outport.send(ip);
  });
};
