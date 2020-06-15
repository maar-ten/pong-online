/**
 * Note that I'm using ES6 import statements instead of NodeJS's require.
 * This makes it simple to share code with the web application.
 *
 * Although still experimental, the feature has been in NodeJS since version 12.
 * For more information see: https://nodejs.org/api/esm.html#esm_ecmascript_modules.
 */

import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import crypto from 'crypto';

import {GAME_ACTION, GAME_STATE, MESSAGE} from './public/constants.js';
import GameSession from './public/assets/GameSession.js';

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// game state variables
const gameSession = new GameSession();
gameSession.setRandomValueCallback((randomBuffer) => crypto.randomFillSync(randomBuffer));
gameSession.setGameStateChangeCallback((gameState) => emitGameStateChanges(gameState));
gameSession.setGameActionCallback((gameActionData) => emitGameActionData(gameActionData));

// serve static game files from public folder
app.use(express.static(join(__dirname, 'public')));

// configure status message
app.get('/pung', (req, res) => {
    const message = `
        Players connected: ${gameSession.players.length}<br>
        Robotic player: ${gameSession.robotEnabled ? 'on' : 'off'}<br>
    `;
    console.info(message);
    res.send(message);
});

// configure clearSession url
app.get('/pung-clearSession', (req, res) => {
    resetSession();

    const message = 'Killed game session and server connections.';
    console.info(message);
    res.send(message);
});

// configure robot switch
app.get('/pung-robot', (req, res) => {
    gameSession.robotEnabled = !gameSession.robotEnabled;

    const message = gameSession.robotEnabled ? 'Player 2 is now a robot, beep boop.' : 'Player 2 is no longer a robot.';
    console.info(message);
    res.send(message);
});

// start listening for requests
httpServer.listen(PORT, () => console.info(`Server online and listening on *:${PORT}`));

// configure web socket connections
io.on(MESSAGE.CONNECTION, (socket) => {

    // deny new players when the maximum number of players is exceeded
    if (gameSession.getSize() === 2) {
        emitPlayerRejected(socket);
        return;
    }

    // add a new player to the session
    gameSession.addPlayer(socket.id);

    // configure web socket events
    socket.on(MESSAGE.ACTION, (data) => handleGameAction(socket, data));
    socket.on(MESSAGE.DISCONNECT, () => handleClientDisconnect(socket));
    socket.on(MESSAGE.LATENCY, (data) => socket.emit(MESSAGE.LATENCY, data));
});

function emitGameStateChanges(state) {
    switch (state) {
        case GAME_STATE.WAIT:
            io.to(gameSession.getWaitingPlayerId()).emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Wait());
            break;

        case GAME_STATE.START:
            console.info('Both players connected. Changing state to start');
            gameSession.getPlayerIds().forEach(id => {
                io.to(id).emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Start(id));
            });
            break;

        case GAME_STATE.SERVE:
            gameSession.getPlayerIds().forEach(id => {
                io.to(id).emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Serve(id));
            });
            break;

        case GAME_STATE.PLAY:
            io.emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Play());
            break;

        case GAME_STATE.DONE:
            io.emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Done());
            break;
    }
}

function emitGameActionData(data) {
    if (data.action === GAME_ACTION.PADDLE_HIT) {
        io.emit(MESSAGE.ACTION, data);
    }
}

// When a client disconnects the player is removed and the other client is notified
function handleClientDisconnect(socket) {
    const player = gameSession.removePlayer(socket.id);
    console.info(`Player ${player.number} disconnected`);
    socket.broadcast.emit(MESSAGE.GAME_STATE, gameSession.getGameStateData_Disconnect());
    socket.disconnect(true);
}

function handleGameAction(socket, data) {
    if (data.action === GAME_ACTION.PADDLE_MOVE) {
        socket.broadcast.emit(MESSAGE.ACTION, data);
    } else {
        gameSession.handleGameAction(data);
    }
}

function emitPlayerRejected(socket) {
    console.info('Maximum amount of players exceeded. Disconnecting new player.');
    socket.emit(MESSAGE.GAME_STATE, {state: GAME_STATE.SERVER_REJECT});
    socket.disconnect(true);
}

// Disconnect players and clear session data
function resetSession() {
    gameSession.getPlayerIds().forEach(player => io.sockets.connected[player.id].disconnect());
    gameSession.clearSession();
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