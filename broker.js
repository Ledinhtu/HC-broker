const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const EventSource = require('eventsource');

const port = 1883;
// var cloud = 'http://localhost:3000/temperature';
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const PORT = 8880;
var cloud = `http://localhost:${PORT}`;
// var cloud = `https://sse-4471.onrender.com`;
// https://sse-4471.onrender.com

var eventSource = new EventSource(`${cloud}/sse`);

server.listen(port, function () {           // server broker
  console.log('server started and listening on port ', port);
});

aedes.on('client', function (client) {
    console.log('new client', client.id);
});

aedes.on('subscribe', function (subscriptions, client) {
    if (client) {
      console.log('subscribe from client', subscriptions, client.id);
    }
});

aedes.on('publish', function (packet, client) {
    if (client) {
        console.log(`message from client ${client.id} to topic ${packet.topic.toString()} : ${packet.payload.toString()}`);
        if (packet.topic.toString() === 'esp32/temperature') {
            var data = {
                device: client.id,
                value: parseFloat(packet.payload.toString()),
                // value: packet.payload,
            };

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~
            publishToCloud(data, 'temperature', 'esp32DHT11/temperature');
            
            //postTemp(data, (res)=>console.log(res));
        }
        if (packet.topic.toString() === 'esp32/humidity') {
            var data = {
                device: client.id,
                value: parseFloat(packet.payload.toString()),
                // value: packet.payload,
            };

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~
            publishToCloud(data, 'humidity', 'esp32DHT11/humidity');
            
            //postTemp(data, (res)=>console.log(res));
        }
    }
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
eventSource.onmessage = (e) => {
    try {
        console.log(e.data);
        
    } catch (error) {
        
    }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~ [hc->cloud]
async function publishToCloud(data, type, topic){
    // var connection = await fetch(`${cloud}/publish/${deviceId}`)
    // var response = await connection.json()
    // console.log(response)

    var data = {[type]: data.value};
    console.log(data);
    var option = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };
    // await fetch(`${cloud}/publish/${data.device}`, option)
    // await fetch(`${cloud}/publish/esp32DHT11/temp`, option)
    await fetch(`${cloud}/publish/${topic}`, option)
        .then(function(response) {
            console.log(`(I): Successs ${type}`);
            return response.json();
        })
        .then((res) => console.log(res))
        .catch((err)=>console.log(`(E): ${err}`))
  }