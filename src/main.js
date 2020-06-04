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
import cfg from './public/config.js';

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// game state variables
const players = [];
let paddleHits = 0;
let flightData = [];

// serve static game files from public folder
app.use(express.static(join(__dirname, 'public')));

// configure reset url
app.get('/pung', (req, res) => {
  players.forEach(player => io.sockets.connected[player.id].disconnect());
  players.splice(0);
  flightData = [];

  console.info('Killed game session and server connections');
  res.send('Killed game session and server connections');
});

// start listening for requests
httpServer.listen(PORT, () => console.info(`Server online and listening on *:${PORT}`));

// configure web socket connections
io.on(MESSAGE.CONNECTION, (socket) => {

  // deny new players when the maximum number of players is exceeded
  if (players.length === 2) {
    rejectPlayer(socket);
    return;
  }

  // add a new player to the session
  const playerNumber = addPlayerToSession(socket.id);
  console.info(`Player ${playerNumber} connected`);

  if (players.length === 1) {
    // one player connected, wait for the other one
    emitGameStateWait(socket, playerNumber);
  } else {
    // both players connected, ask if they are ready to start
    console.info('Both players connected. Changing state to start');
    emitGameStateStart();
  }

  // configure web socket events
  socket.on(MESSAGE.READY, handlePlayerReady);
  socket.on(MESSAGE.DISCONNECT, () => handleClientDisconnect(socket));
  socket.on(MESSAGE.ACTION, (data) => handleGameAction(socket, data));
  socket.on(MESSAGE.LATENCY, (data) => socket.emit(MESSAGE.LATENCY, data));
});

// Create and add a new player to the session
function addPlayerToSession(socketId) {
  const player = {};
  player.id = socketId;
  player.number = getNextPlayerNumber();
  player.score = 0;
  player.ready = false;

  players.push(player);

  return player.number;
}

// Gracefully reject a player
function rejectPlayer(socket) {
  console.info('Maximum amount of players exceeded. Disconnecting new player.');
  socket.emit(MESSAGE.GAME_STATE, {state: GAME_STATE.SERVER_REJECT});
  socket.disconnect(true);
}

// When 2 players are ready the game state changes to serve
function handlePlayerReady(data) {
  getPlayerByNumber(data.player).ready = data.ready;
  if (players.every(player => player.ready)) {
    // both players are ready.
    console.info('Both players are ready. Changing state to serve');
    flightData = [];

    // reset scores and ready state
    players.forEach(player => {
      player.score = 0;
      player.ready = false;
    });

    const servingPlayer = getRandomIntInclusive(1, 2);
    emitGameStateServe(servingPlayer);
  }
}

// When a client disconnects the other client is notified
function handleClientDisconnect(socket) {
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
    socket.broadcast.emit(MESSAGE.GAME_STATE, {state: GAME_STATE.DISCONNECT});
  });
}

function handleGameAction(socket, data) {
  switch (data.action) {
    case GAME_ACTION.SERVE:
      io.emit(MESSAGE.GAME_STATE, {
        state: GAME_STATE.PLAY,
        ballVelocity: 500,
        ballAngle: getServingAngle(data.player)
      });
      break;

    case GAME_ACTION.SCORE:
      addPoint(data.player);
      if (getPlayerByNumber(data.player).score === cfg.GAME_LENGTH) {
        emitGameStateDone();
      } else {
        let nextServer = data.player === 2 ? 1 : 2;
        emitGameStateServe(nextServer);
      }
      break;

    case GAME_ACTION.PADDLE_MOVE:
      // send to all clients except the sender
      socket.broadcast.emit(MESSAGE.ACTION, data);
      break;

    case GAME_ACTION.PADDLE_HIT:
      paddleHits++;
      flightData.push(data.flightData);

      if (flightData.length === 2) {
        if (flightData[0].player === flightData[1].player || flightData[0].flightNumber !== flightData[1].flightNumber) {
          flightData = [];
        }
      }

      if (paddleHits === 2) {
        io.emit(MESSAGE.ACTION, {
          action: GAME_ACTION.PADDLE_HIT,
          angleChange: getAngleChange(data.currentAngle),
          flightData: flightData
        });
        paddleHits = 0;
        flightData = [];
      }
      break;
  }
}

// Returns a number between min and max (inclusive)
// Inspired by: https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues#answer-42321673
function getRandomIntInclusive(min, max) {
  const randomBuffer = new Uint8Array(1);
  crypto.randomFillSync(randomBuffer);
  const randomNumber = randomBuffer[0] / (0xff + 1);
  return Math.floor(randomNumber * (max - min + 1)) + min;
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
  const direction = playerNumber === 1 ? 0 : 180;
  const degrees = getRandomIntInclusive(-45, 45) + direction;
  return degrees / 180 * Math.PI; // conversion from degrees to radians: 180 DEG = PI radians
}

function getAngleChange(currentAngle) {
  const angleChange = getRandomIntInclusive(0, 30) / 100; // 0 - 30 is between 0 - 17 degrees
  const direction = getRandomIntInclusive(0, 1) === 1 ? 1 : -1;
  return angleChange * direction;
}

function addPoint(player) {
  getPlayerByNumber(player).score++;
}

function getPlayerById(id) {
  return players.find(player => player.id === id);
}

function getPlayerScore(number) {
  return getPlayerByNumber(number).score;
}

function getPlayerByNumber(number) {
  return players.find(player => player.number === number);
}

function emitGameStateWait(socket, playerNumber) {
  socket.emit(MESSAGE.GAME_STATE, {
    state: GAME_STATE.WAIT,
    number: playerNumber
  });
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