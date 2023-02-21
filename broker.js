const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
// const { Buffer } = require('node:buffer');

const port = 1883;  // port broker lắng nghe
const PW = 'matteo'; // password

// xác thực mật khẩu
aedes.authenticate = function (client, username, password, callback) {  
  callback(null, password == PW);
}

// xử lí sự kiện client mới connect thành công tới broker 
aedes.on('client', (client) => console.log('new client', client.id));

// xử lí khi có client subscribe một topic
aedes.on('subscribe', (subscriptions, client) => {
  if (client) console.log('subscribe from client', subscriptions, client.id);
});

// xử lí khi có client publish
aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`message from client ${client.id} to topic ${packet.topic.toString()} : ${packet.payload.toString()}`);
  }
});

// khởi tạo server lằng nghe tại cổng 'port'
server.listen(port, console.log('server started and listening on port ', port));
