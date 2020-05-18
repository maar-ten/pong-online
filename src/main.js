const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { join } = require('path');

const PORT = 3000;
const players = new Map();
const GAME_STATE = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WAIT: 'wait',
    START: 'start',
    SERVE: 'serve',
    PLAY: 'play',
    DONE: 'done'
};

// serve static files from public folder
app.use(express.static(join(__dirname, 'public')));

// configure web socket connections
io.on('connection', (socket) => {

    // deny new players when the maximum number of players is exceeded
    if (players.size == 2) {
        console.log('Maximum amount of players exceeded. Disconnecting new player.');
        socket.disconnect(true);
        return;
    }

    // create a new player and assign the player number
    const player = {};
    player.id = socket.id;
    player.number = players.size + 1;
    player.score = 0;
    players.set(socket.id, player);

    console.log(`Player ${player.number} connected`);

    if (players.size == 1) {
        // waiting for the other player
        socket.emit('state-change', {
            state: GAME_STATE.WAIT
        });
    } else {
        // ready for the game
        console.log('Both players are connected. Change state to serve');
        let server = getRandomIntInclusive(1, 2);
        players.forEach(player => {
            io.sockets.connected[player.id].emit('state-change', {
                state: GAME_STATE.SERVE,
                number: player.number,
                server: server
            });
        });
    }

    // delete player when their client disconnects
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`Player ${player.number} disconnected`);
            socket.broadcast.emit('state-change', { state: GAME_STATE.DISCONNECT });
            players.delete(player.id);

            // adjust player number of remaining player
            if (players.size > 0) {
                players.get(players.keys().next().value).number = 1;
            }
        }
    });

    // receive and broadcast actions
    socket.on('action', (action) => {
        socket.broadcast.emit('action', action);
    });
});

// start listening for requests
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}