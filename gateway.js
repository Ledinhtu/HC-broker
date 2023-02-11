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
const port_cloud = 8880;
var cloud = `http://localhost:${port_cloud}`;
// var cloud = `https://sse-4471.onrender.com`;
// https://sse-4471.onrender.com

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server); 
const port_local = 8889;
const cookieParser = require('cookie-parser')
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const name_user = 'matteo'; // tên đăng nhập web local
const password = '2234';    // mật khẩu đăng nhập web local
const cookie = {userId: 'test'};    // cookie web local

var livingroom = {
    sensor1: {
        temp:{ now : 0},
        humi: { now : 0},
    },
    lamp1: {now: 'off'},
}

var bedroom = {
    lamp1: {now: 'off'},
}

var kitchen = {
    lamp2: {now: 'off'}
}

client.on('connect', function () {
    client.subscribe('esp32/output', function (err) {
      if (!err) {
        console.log(`(E): ${err}`);
      }
    });

    client.subscribe('dht11/temperature', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });

    client.subscribe('dht11/humidity', function (err) {
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

client.on('message', (topic, message, packet) => {
    console.log(`(I): Topic: ${topic}`);
    console.log(`(I): Message: ${message}`);
    console.log(packet);
    
    switch (topic) {
        case 'dht11/temperature':
            livingroom.sensor1.temp.now = parseFloat(packet.payload.toString()); 
            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'temperature', 'livingroom/sensordht11/temp');
            break;

        case 'dht11/humidity':
            livingroom.sensor1.humi.now = parseFloat(packet.payload.toString());
            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'humidity', 'livingroom/sensordht11/humi');
            break;
        
        case 'state/light/device-1':
            var data = {
                value: packet.payload.toString(),
            };
            publishToCloud(data, 'state', 'livingroom/lamp1');
            break;

        case 'state/light/device-2':
            console.log(1);
            bedroom.lamp1.now = packet.payload.toString();
            io.emit('bedroom-lamp1', bedroom.lamp1.now); 
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

//
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

//``````````````````````````````````````````````````````````````````````
app.get('/', (req, res) => {
    res.redirect('/app');
});

app.post('/login', (req, res) => {

    console.log(req.body.name, req.body.pass);
    if (req.body.name === name_user && req.body.pass === password) {
        res.cookie('userId', cookie.userId);    // respone cookie cho client
        res.redirect('/app');
    } else {
        res.sendFile(__dirname + '/view/login_wrong.html')
    } 

});

app.get('/login', (req, res) => {
    console.log('Cookie: ', req.cookies, req.cookies.userId );

    if (req.cookies.userId === cookie.userId) {
        res.redirect('/app');
        return;
    }
    res.sendFile(__dirname + '/view/login.html');
});

app.get('/app', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/app.html');
});

app.post('/app', (req, res) => {
    console.log( req.body.router);
   switch (req.body.router) {
    case 'setting':
        res.redirect('/setting');
        break;

    case 'livingroom':
        res.redirect('/livingroom');
        break;

    case 'bedroom':
        res.redirect('/bedroom');
        break;

    case 'kitchen':
        res.redirect('/kitchen');
        break;
    case 'mainpage':
        res.redirect('/app');
    break;
    default:
        break;
   }

});

app.get('/livingroom', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/livingroom.html');
});

app.post('/livingroom', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

app.get('/setting', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/settingmode.html');
    // res.send('<h1>SETTING MODE</h1>')
});

app.post('/setting', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

app.get('/bedroom', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/bedroom.html');
    // res.send('<h1>BEDROOM</h1>')

});

app.post('/bedroom', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

app.get('/kitchen', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/kitchen.html');
    // res.send('<h1>KITCHEN</h1>')

});

app.post('/kitchen', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

io.on('connection', (socket) => {
    console.log('user connected');

    // onValue(ref(database, 'temp/now'), (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //         console.log(data.temp);
    //         io.emit('temp-1', data.temp);      
    //     } else {
    //         console.log("(onValue) No data available");
    //     }
    // });

    // onValue(ref(database, 'humi/now'), (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //         console.log(data.humi);
    //         io.emit('humi-1', data.humi);      
    //     } else {
    //         console.log("(onValue) No data available");
    //     }
    // });

    // onValue(ref(database, '/state/light/device-1/now/'), (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //         console.log(data.state);
    //         io.emit('light-1', data.state);      
    //     } else {
    //         console.log("(onValue) No data available");
    //     }
    // });

    // onValue(ref(database, '/bedroom/lamp1/now'), (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //         console.log(data.state);
    //         io.emit('bedroom-lamp1', data.state);      
    //     } else {
    //         console.log("(onValue) No data available");
    //     }
    // });

    // onValue(ref(database, '/kitchen/lamp1/now'), (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //         console.log(data.state);
    //         io.emit('kitchen-lamp1', data.state);      
    //     } else {
    //         console.log("(onValue) No data available");
    //     }
    // });

    socket.on('button-1', data => {
        // console.log(data);
        // io.emit('state-1', data);
        set(ref(database, 'control/light/device-1'), {
            signal: data.message
          })
          .then(()=>{
            // res.status(200).send(JSON.stringify(req.body));
          })
          .catch((e)=>console.log(`(E): ${e}`))
    });

    socket.on('bedroom-btn-lamp1', data => {
        console.log(data);
        if (data.message === 'on') {
            client.publish('esp32/output2', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output2', 'off');
        }
    });

    socket.on('kitchen-btn-lamp1', data => {
        if (data.message === 'on') {
            client.publish('esp32/output3', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output3', 'off');
        }
    });
  
});


server.listen(port_local, () => {
    console.log(`App local listening on port ${port_local}`);
});

