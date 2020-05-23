/**
 * Note that I'm using ES6 import statements instead of NodeJS's require.
 * This makes it simple to share code with the web application.
 *
 * Although still experimental, the feature has been in NodeJS since version 12.
 * For more information see: https://nodejs.org/api/esm.html#esm_ecmascript_modules.
 */

import express from  'express';
import http from 'http';
import socketio from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { GAME_ACTION, GAME_STATE, MESSAGE } from './public/constants.js';

const app = express();
const httpServer = http.createServer(app);
const io  = socketio(httpServer);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const players = [];

// serve static game files from public folder
app.use(express.static(join(__dirname, 'public')));

// configure web socket connections
io.on(MESSAGE.CONNECTION, (socket) => {

    // deny new players when the maximum number of players is exceeded
    if (players.length === 2) {
        console.info('Maximum amount of players exceeded. Disconnecting new player.');
        socket.disconnect(true);
        return;
    }

    // create a new player and assign the player number
    const player = {};
    player.id = socket.id;
    player.number = getNextPlayerNumber();
    player.score = 0;
    player.ready = false;
    players.push(player);

    console.info(`Player ${player.number} connected`);

    if (players.length === 1) {
        // wait for the other player
        socket.emit(MESSAGE.GAME_STATE, {
            state: GAME_STATE.WAIT
        });
    } else {
        // both players connected, but not ready yet
        console.info('Both players connected. Changing state to start');
        emitGameStateStart();
    }

    socket.on(MESSAGE.READY, (data) => {
        getPlayerByNumber(data.player).ready = data.ready;
        let readyPlayers = players.filter(player => player.ready === true).length;
        if (readyPlayers === 2) {
            // both players are ready.
            console.info('Both players are ready. Changing state to serve');
            let servingPlayer = getRandomIntInclusive(1, 2);
            players.forEach(player => player.score = 0); // reset scores
            emitGameStateServe(servingPlayer);
        }
    });

    socket.on(MESSAGE.DISCONNECT, () => {
        // delete player when their client disconnects
        const player = getPlayerById(socket.id);
        if (player) {
            console.info(`Player ${player.number} disconnected`);
            players.splice(players.indexOf(player), 1); // delete the player
        }

        // reset remaining player
        players.forEach(player => {
            player.ready = false;
            //todo would be nice to keep the scores in case the other player left by accident
            player.score = 0;
            socket.broadcast.emit(MESSAGE.GAME_STATE, { state: GAME_STATE.DISCONNECT });
        });
    });

    // receive and broadcast actions
    socket.on(MESSAGE.ACTION, (action) => {
        switch (action.action) {
            case GAME_ACTION.SERVE:
                io.emit(MESSAGE.GAME_STATE, {
                    state: GAME_STATE.PLAY,
                    ballVelocity: 500,
                    ballAngle: getServingAngle(action.player)
                });
                break;

            case GAME_ACTION.SCORE:
                addPoint(action.player);
                if (getPlayerByNumber(action.player).score === 10) {
                    emitGameStateDone();
                } else {
                    let nextServer = action.player === 2 ? 1 : 2;
                    emitGameStateServe(nextServer);
                }
                break;

            case GAME_ACTION.PADDLE_MOVE:
                // send to all clients except the sender
                socket.broadcast.emit(MESSAGE.ACTION, action);
                break;

            case GAME_ACTION.PADDLE_HIT:
                io.emit(MESSAGE.ACTION, {
                    action: GAME_ACTION.PADDLE_HIT,
                    angleChange: getAngleChange(action.currentAngle)
                });
                break;
        }
    });

    socket.on(MESSAGE.LATENCY, (data) => {
        socket.emit(MESSAGE.LATENCY, data);
    });
});

// start listening for requests
httpServer.listen(PORT, () => {
    console.info(`Server online and listening on *:${PORT}`);
});

// copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 

    //todo perhaps use a better randomizer?
}

function getNextPlayerNumber() {
    if (players.length === 0) {
        return 1;
    } else {
        let numberAlreadyTaken = players[0].number;
        return numberAlreadyTaken === 2 ? 1 : 2;
    }
}

function getServingAngle(playerNumber) {
    let direction = playerNumber === 1 ? 0 : 180;
    let degrees = getRandomIntInclusive(-45, 45) + direction;
    return degrees / 180 * Math.PI; // conversion from degrees to radians: 180 DEG = PI radians
}

function getAngleChange(currentAngle) {
    // todo check that the new angle will not be too steep
    let angleChange = getRandomIntInclusive(0, 30) / 100; // 0 - 30 is between 0 - 17 degrees
    let direction = getRandomIntInclusive(0, 1) === 1 ? 1 : -1;
    return angleChange * direction;
}

function addPoint(playerNumber) {
    players.forEach(player => {
        if (player.number === playerNumber) {
            player.score++;
        }
    });
}

function getPlayerById(id) {
    return players.find(player => player.id === id);
}

function getPlayerByNumber(number) {
    return players.find(player => player.number === number);
}

function getPlayerScore(number) {
    return players.find(player => player.number === number).score;
}

function emitGameStateStart() {
    players.forEach(player => {
        io.to(player.id).emit(MESSAGE.GAME_STATE, {
            state: GAME_STATE.START,
            number: player.number,
            player1Score: getPlayerScore(1),
            player2Score: getPlayerScore(2)
        });
    });
}

function emitGameStateServe(server) {
    players.forEach(player => {
        io.to(player.id).emit(MESSAGE.GAME_STATE, {
            state: GAME_STATE.SERVE,
            number: player.number,
            server: server,
            player1Score: getPlayerScore(1),
            player2Score: getPlayerScore(2)
        });
    });
}

function emitGameStateDone() {
    io.emit(MESSAGE.GAME_STATE, {
        state: GAME_STATE.DONE,
        player1Score: getPlayerScore(1),
        player2Score: getPlayerScore(2)
    });
}

// remember to escape backslashes
console.info(`
 _____ _     _     ___     ____                   _ _
|_   _| |__ (_)___|_ _|___|  _ \\ ___  _ __   __ _| | |
  | | | '_ \\| / __ | |/ __| |_) / _ \\| '_ \\ / _\` | | |
  | | | | | | \\__  | |\\__ |  __| (_) | | | | (_| |_|_|
  |_| |_| |_|_|___|___|___|_|   \\___/|_| |_|\\__, (_(_)
                                            |___/
`);