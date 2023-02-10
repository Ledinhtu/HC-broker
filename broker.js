const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const { Buffer } = require('node:buffer');

const port = 1883;
const PW = 'matteo'; // password

aedes.authenticate = function (client, username, password, callback) {  // xác thực mật khẩu
  callback(null, password == PW);
}

aedes.on('client', (client) => console.log('new client', client.id));

aedes.on('subscribe', (subscriptions, client) => {
  if (client) console.log('subscribe from client', subscriptions, client.id);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`message from client ${client.id} to topic ${packet.topic.toString()} : ${packet.payload.toString()}`);
    // if (packet.topic.toString() === 'esp32/temperature') {
      //     var data = {
        //         device: client.id,
        //         value: parseFloat(packet.payload.toString()),
        //         // value: packet.payload,
        //     };
        
        //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~
        //     publishToCloud(data, 'temperature', 'esp32DHT11/temperature');
        
        //     //postTemp(data, (res)=>console.log(res));
        // }
        // if (packet.topic.toString() === 'esp32/humidity') {
          //     var data = {
        //         device: client.id,
        //         value: parseFloat(packet.payload.toString()),
        //         // value: packet.payload,
        //     };
        
        //     // ~~~~~~~~~~~~~~~~~~~~~~~~~~
        //     publishToCloud(data, 'humidity', 'esp32DHT11/humidity');
            
        //     //postTemp(data, (res)=>console.log(res));
        // }
      }
});

server.listen(port, console.log('server started and listening on port ', port));
