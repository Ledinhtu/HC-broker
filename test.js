const mqtt = require('mqtt-packet');
const opts = { protocolVersion: 4 }; // default is 4. Usually, opts is a connect packet
const parser = mqtt.parser(opts);

// Synchronously emits all the parsed packets
parser.on('packet', packet => {
  console.log(packet)
  // Prints:
  //
  // {
  //   cmd: 'publish',
  //   retain: false,
  //   qos: 0,
  //   dup: false,
  //   length: 10,
  //   topic: 'test',
  //   payload: <Buffer 74 65 73 74>
  // }
})

parser.parse(Buffer.from([
  48, 10, // Header (publish)
  0, 4, // Topic length
  116, 101, 115, 116, // Topic (test)
  116, 101, 115, 116 // Payload (test)
]))
// Returns the number of bytes left in the parser