const socketio = require('socket.io');

let io;
class SocketIo {
    static initSocket(server, cors) {
        io = socketio(server, cors);
        io.on('connect', (socket) => {
            console.log('New Websocket connection');
        });
        return io;
    }
    static getSocket() {
        if (!io) {
            throw new Error('must call .init(server) before you can call .getio()');
        }
        return io;
    }
}

module.exports = SocketIo;