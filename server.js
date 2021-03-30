const http = require('http');
require('dotenv').config();
const PORT = process.env.PORT;
const app = require('./app');
const SocketIo = require('./utils/socket');

//Setup server
const server = http.createServer(app);
SocketIo.initSocket(server, { cors: { origin: '*' } });
server.listen(PORT, () => (
    console.log(`You are now listening to port: ${PORT}`)
));