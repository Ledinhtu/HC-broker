### 1. Cài đặt môi trường `Node.JS`
### 2. Cài đặt các package 
Mở terminal tại dự án này chạy
```
$ npm install
```
### 3. Cấu hình Cloud Server
Thay biến `cloud` trong file `./gateway.js` bằng URL của Cloud Server.

### 4. Build và run 
Tại terminal của dự án chạy lệnh bên dưới để chạy broker
```
$ node broker
```
Mở terminal khác của dự án chạy lệnh bên dưới để chạy gateway
```
$ node gateway
```
