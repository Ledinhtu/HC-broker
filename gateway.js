const mqtt = require('mqtt');
// const mqtt = require('mqtt-packet');
// const client  = mqtt.connect('mqtt://192.168.1.132:1883')
const client  = mqtt.connect('mqtt://localhost:1883',
                             {username: 'gateway',
                             password: 'matteo'})

const mqtt_pk = require('mqtt-packet');
const opts = { protocolVersion: 4 }; // default is 4. Usually, opts is a connect packet
const parser = mqtt_pk.parser(opts);

const EventSource = require('eventsource');
const PORT_CLOUD = 8880;
var cloud = `http://localhost:${PORT_CLOUD}`;
// var cloud = `https://sse-4471.onrender.com`;
// https://sse-4471.onrender.com


client.on('connect', function () {
    client.subscribe('esp32/output', function (err) {
      if (!err) {
        console.log(`(E): ${err}`);
      }
    });

    client.subscribe('esp32/temperature', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
      });

    client.subscribe('esp32/humidity', function (err) {
      if (!err) {
        console.log(`(E): ${err}`);
      }
    });
    client.subscribe('state/light/device-1', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
      });
    client.subscribe('state/light/device-2', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
      });
    client.subscribe('state/light/device-3', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
      });
    
  })

client.on('message', (topic, dđmessage, packet) => {
    console.log(`(I): Topic: ${topic}`);
    console.log(`(I): Message: ${message}`);
    console.log(packet);
    let model = {

    }
    
    switch (topic) {
        case 'esp32/temperature':
            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'temperature', 'esp32DHT11/temperature');
            break;

        case 'esp32/humidity':
            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'humidity', 'esp32DHT11/humidity');
            break;
        
        case 'state/light/device-1':
            var data = {
                value: packet.payload.toString(),
            };
            publishToCloud(data, 'state', 'state/light/device-1');
            break;

        case 'state/light/device-2':
            console.log(1);
                var data = {
                    value: packet.payload.toString(),
                };
                publishToCloud(data, 'state', 'state/light/device-2');
        break;

        case 'state/light/device-3':
                var data = {
                    value: packet.payload.toString(),
                };
                publishToCloud(data, 'state', 'state/light/device-3');
        break;
        default:
            break;
    }

});

var eventSource = new EventSource(`${cloud}/sse`);

eventSource.onmessage = (e) => {
    try {    
        const mess = JSON.parse(e.data);  
        console.log(JSON.parse(e.data));

        if (mess.device === 1) {   // đèn phòng khách
            if (mess.signal === 'on') {
                client.publish('esp32/output', 'on');
            }
            else if (mess.signal === 'off') {
                client.publish('esp32/output', 'off');
            }
        }
        if (mess.device === 2) {   // đèn phòng ngủ
            if (mess.signal === 'on') {
                client.publish('esp32/output2', 'on');
            }
            else if (mess.signal === 'off') {
                client.publish('esp32/output2', 'off');
            }
        }
        if (mess.device === 3) {  // đèn phòng bếp
            if (mess.signal === 'on') {
                client.publish('esp32/output3', 'on');
            }
            else if (mess.signal === 'off') {
                client.publish('esp32/output3', 'off');
            }
        }

    } catch (error) {
        console.log(`(E): ${error}`);
    }
}

//  hc ---> cloud
async function publishToCloud(data, type, topic){

    var data = {[type]: data.value};
    console.log(data);
    var option = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };
    await fetch(`${cloud}/publish/${topic}`, option)
        .then(function(response) {
            console.log(`(I): Successs ${type}`);
            return response.json();
        })
        .then((res) => console.log(res))
        .catch((err)=>console.log(`(E): ${err}`))
  }