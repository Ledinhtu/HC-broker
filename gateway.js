const mqtt = require('mqtt');

const client  = mqtt.connect('mqtt://localhost:1883',
                             {username: 'gateway',
                             password: 'matteo'})

const mqtt_pk = require('mqtt-packet');
const opts = { protocolVersion: 4 }; // default is 4. Usually, opts is a connect packet
const parser = mqtt_pk.parser(opts);

const EventSource = require('eventsource');
const port_cloud = 8880;
// var cloud = `http://localhost:${port_cloud}`;
var cloud = `https://cloud-server.onrender.com`;
// var cloud = `https://cloud-server.onrender`;
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

// lưu trữ các đối tượng của phòng khách
var livingroom = {  
    sensor1: {
        temp:{ now : 0},
        humi: { now : 0},
    },
    lamp1: {now: 'off'},
}

// lưu trữ các đối tượng của phòng ngủ
var bedroom = { 
    lamp1: {now: 'off'},
}

// lưu trữ các đối tượng của phòng bếp
var kitchen = { 
    lamp1: {now: 'off'}
}

// xử lí khi connect thành công tới mqtt broker cụ thể là subscribe cá topic :V
client.on('connect', function () { 
    // subcribe topic esp32/output: điều khiển lamp-1 phòng khách 
    client.subscribe('esp32/output', function (err) { 
      if (!err) {
        console.log(`(E): ${err}`);
      }
    });

    // subcribe topic dht11/temperature: trao đổi dữ liệu nhiệt độ
    client.subscribe('dht11/temperature', function (err) {  
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });

     // subcribe topic dht11/humidity: trao đổi dữ liệu độ ẩm 
    client.subscribe('dht11/humidity', function (err) {  
      if (!err) {
        console.log(`(E): ${err}`);
      }
    });

    // subcribe topic state/light/device-1: trao đổi trạng thái đèn 1 
    client.subscribe('state/light/device-1', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });

    // subcribe topic state/light/device-2: trao đổi trạng thái đèn 2
    client.subscribe('state/light/device-2', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });

    // subcribe topic state/light/device-3: trao đổi trạng thái đèn 3
    client.subscribe('state/light/device-3', function (err) {
        if (!err) {
          console.log(`(E): ${err}`);
        }
    });
    
  })

// xử lí các meesage được publish tới các topic đã subscribe
client.on('message', (topic, message, packet) => {  
    console.log(`(I): Topic: ${topic}`);
    console.log(`(I): Message: ${message}`);
    // console.log(packet);
    
    switch (topic) {
        case 'dht11/temperature':   // nhiệt độ từ bảm biến DHT11
            livingroom.sensor1.temp.now = parseFloat(packet.payload.toString());    // lưu trữ giá trị nhiệt độ
            io.emit('livingroom-sensor1-temp', livingroom.sensor1.temp.now );   // emit dữ liệu cho weblocal

            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'temperature', 'livingroom/sensordht11/temp'); // đẩy dữ liệu tới cloud
            break;

        case 'dht11/humidity':  // độ ẩm từ cảm biến 

            livingroom.sensor1.humi.now = parseFloat(packet.payload.toString());
            io.emit('livingroom-sensor1-humi', livingroom.sensor1.humi.now); 

            var data = {
                        value: parseFloat(packet.payload.toString()),
                    };
            publishToCloud(data, 'humidity', 'livingroom/sensordht11/humi');
            break;
        
        case 'state/light/device-1': // trạng thái đèn phòng khách
            var data = {
                value: packet.payload.toString(),
            };
            livingroom.lamp1.now = data.value;
                io.emit('livingroom-lamp1', livingroom.lamp1.now); 
            publishToCloud(data, 'state', 'livingroom/lamp1');
            break;

        case 'state/light/device-2': // trạng thái đèn phòng ngủ
            console.log(1);
            io.emit('bedroom-lamp1', bedroom.lamp1.now); 
                var data = {
                    value: packet.payload.toString(),
                };
                bedroom.lamp1.now = data.value;
                io.emit('bedroom-lamp1', bedroom.lamp1.now); 
                publishToCloud(data, 'state', 'bedroom/lamp1');
        break;

        case 'state/light/device-3': // trạng thái đèn phòng bếp
                var data = {
                    value: packet.payload.toString(),
                };
                kitchen.lamp1.now = data.value;
                io.emit('kitchen-lamp1', kitchen.lamp1.now);   
                // console.log( kitchen.lamp1.now);   
                publishToCloud(data, 'state', 'kitchen/lamp1');
        break;

        default:
            break;
    }

});

// khởi tạo connect SSE tới Cloud Server tại cổng API `${cloud}/sse`
var eventSource = new EventSource(`${cloud}/sse`); 

// xử lí response từ Cloud Server
eventSource.onmessage = (e) => {
    try {    
        const mess = JSON.parse(e.data);  // convert đối tượng JSON sang đối tượng JavaScript để xử lí
        console.log(JSON.parse(e.data));

        if (mess.device === 1) {   // respone điều khiển đèn phòng khách
            if (mess.signal === 'on') { // respone yêu cầu bật đèn
                client.publish('esp32/output', 'on'); // publish tín hiệu bật đèn
            }
            else if (mess.signal === 'off') {   // respone yêu cầu tắt đèn
                client.publish('esp32/output', 'off'); // publish tín hiệu tắt đèn
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

/**
 * @brief : gửi dữ liệu tới cloud bằng phương thức POST tởi cổng API `${cloud}/publish/${topic}`
 * @param {*} data : dữ liệu cần đẩy tới Cloud Server
 * @param {*} type : loại dữ liệu, vd: temp(nhiệt độ), humi(độ ẩm), state...
 * @param {*} topic : topic để ghép thành URL mà Cloud Server lắng nghe
 */
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
    await fetch(`${cloud}/publish/${topic}`, option) // POST dữ liệu
        .then(function(response) {
            console.log(`(I): Successs ${type}`);
            return response.json();
        })
        .then((res) => console.log(res))
        .catch((err)=>console.log(`(E): ${err}`))
  }

/************************* LOCAL WEB SERVER ************************************** */
//  
app.get('/', (req, res) => {
    res.redirect('/app');
});

// xử lí yêu cầu đăng nhập
app.post('/login', (req, res) => { 

    console.log(req.body.name, req.body.pass);
    // kiểm tra user name và pass
    if (req.body.name === name_user && req.body.pass === password) {
        res.cookie('userId', cookie.userId);    // respone cookie to client
        res.redirect('/app');   // điều hướng tới trang chủ
    } else {
        // respone html trang LOGIN với thông báo lỗi
        res.sendFile(__dirname + '/view/login_wrong.html');  
    } 

});

// yêu cầu truy cập trang login
app.get('/login', (req, res) => {
    console.log('Cookie: ', req.cookies, req.cookies.userId );

    if (req.cookies.userId === cookie.userId) {
        res.redirect('/app');
        return;
    }
    res.sendFile(__dirname + '/view/login.html');
});

// yêu cầu truy cập trang chủ
app.get('/app', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/app.html');
});

// yêu cầu truy cập các trang giám sát và điều khiển từ trang chủ
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

// yêu cầu truy cập trang điều khiển phòng khách
app.get('/livingroom', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/livingroom.html');
    setTimeout(()=>
    {
        io.emit('livingroom-lamp1', livingroom.lamp1.now);
        io.emit('livingroom-sensor1-temp', livingroom.sensor1.temp.now);
        io.emit('livingroom-sensor1-humi', livingroom.sensor1.humi.now);
    }, 500);

});

// yêu cầu truy cập trang chủ từ trang điều khiển phòng khách
app.post('/livingroom', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

// yêu cầu truy cập trang điều khiển phòng khách
app.get('/setting', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/settingmode.html');
    // res.send('<h1>SETTING MODE</h1>')
});

// yêu cầu truy cập trang cài đặt chế độ từ trang điều khiển phòng khách
app.post('/setting', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

// yêu cầu truy cập trang điều khiển phòng ngủ
app.get('/bedroom', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/bedroom.html');
    setTimeout(()=>
    {
        io.emit('bedroom-lamp1', bedroom.lamp1.now);
    }, 500);
    // res.send('<h1>BEDROOM</h1>')

});

// yêu cầu truy cập trang cài đặt chế độ từ trang điều khiển phòng ngủ
app.post('/bedroom', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

// yêu cầu truy cập trang điều khiển phòng bếp
app.get('/kitchen', (req, res) => {;
    if (req.cookies.userId != cookie.userId) {
        res.redirect('/login');
        return;
    }
    res.sendFile(__dirname + '/view/kitchen.html');
    setTimeout(()=>io.emit('kitchen-lamp1', kitchen.lamp1.now), 500);

    // res.send('<h1>KITCHEN</h1>')

});

// yêu cầu truy cập trang cài đặt chế độ từ trang điều khiển phòng bếp
app.post('/kitchen', (req, res) => {;
    switch (req.body.router) {
        case 'mainpage':
            res.redirect('/app');
            break;
    
        default:
            break;
    }
});

// xử lí khi có connect tới server socket
io.on('connection', (socket) => {
    console.log('user connected');

    // lắng nghe sự kiện bấm nút đèn 1 phòng khách từ UI
    socket.on('livingroom-btn-lamp1', data => {
        console.log(data);
        if (data.message === 'on') {
            client.publish('esp32/output', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output', 'off');
        }
    });

    // lắng nghe sự kiện bấm nút đèn 1 phòng ngủ từ UI
    socket.on('bedroom-btn-lamp1', data => {
        console.log(data);
        if (data.message === 'on') {
            client.publish('esp32/output2', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output2', 'off');
        }
    });

    // lắng nghe sự kiện bấm nút đèn 1 phòng bếp từ UI
    socket.on('kitchen-btn-lamp1', data => {
        if (data.message === 'on') {
            client.publish('esp32/output3', 'on');
        }
        else if (data.message === 'off') {
            client.publish('esp32/output3', 'off');
        }
    });
  
});

// khởi tạo server lắng nghe cổng `port_local`
server.listen(port_local, () => {
    console.log(`App local listening on port ${port_local}`);
});

