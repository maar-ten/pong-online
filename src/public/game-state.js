import cfg from './config.js';
import {GAME_ACTION, GAME_STATE} from './constants.js';

export default class GameState {

    constructor() {
        this.gameState = GAME_STATE.START;
        this.players = [];
        this.servingPlayer = 1;
        this.newGame = true;
        this.paddleHits = 0;
        this.flightData = [];
        this.robotEnabled = cfg.ROBOT_ENABLED;
    }

    // Is called when a random value is needed
    setRandomValueCallback(callback) {
        this.crypto = callback;
    }

    // Is called whenever the game state changes
    setGameStateChangeCallback(callback) {
        this.gameStateCallback = callback;
    }

    // Is called whenever a game action needs to happen
    setGameActionCallback(callback) {
        this.gameActionCallback = callback;
    }

    emitGameState(gameState) {
        this.gameState = gameState;
        this.gameStateCallback(gameState);
    }

    getSize() {
        return this.players.length;
    }

    addPlayer(id) {
        const player = {};
        player.id = id;
        player.number = getNextPlayerNumber.call(this);
        player.score = 0;
        player.ready = false;

        this.players.push(player);

        if (this.getSize() === 2) {
            // both players connected, ask if they are ready to start
            this.emitGameState(GAME_STATE.START);
        } else {
            // one player connected, wait for the other one
            this.emitGameState(GAME_STATE.WAIT);
        }

        return player.number;
    }

    getPlayerIds() {
        return this.players.map(player => player.id);
    }

    addReadyPlayer(number) {
        const player = getPlayerByNumber.call(this, number);
        player.ready = true;
        player.score = 0;

        if (this.players.every(player => player.ready)) {
            // both players are ready, change state to serving
            this.flightData = [];
            this.servingPlayer = getRandomIntInclusive.call(this, 1, 2);
            this.newGame = true;
            this.emitGameState(GAME_STATE.SERVE);
        }
    }

    addPoint(playerNumber) {
        const player = getPlayerByNumber.call(this, playerNumber);
        player.score++;

        if (this.isGameOver()) {
            this.emitGameState(GAME_STATE.DONE);
            this.resetGame(); // don't reset the game before emitting DONE
        } else {
            this.flightData = [];
            this.servingPlayer = player.number === 2 ? 1 : 2;
            this.newGame = true;
            this.emitGameState(GAME_STATE.SERVE);
        }
    }

    addPaddleHit(flightData) {
        this.paddleHits++;
        this.flightData.push(flightData);

        function flightDataCorrupt() {
            return this.flightData[0].player === this.flightData[1].player
                || this.flightData[0].flightNumber !== this.flightData[1].flightNumber;
        }

        if (this.flightData.length === 2) {
            if (flightDataCorrupt.call(this)) {
                this.flightData = [];
            } else {
                this.gameActionCallback(this.getGameActionData_PaddleHit());
            }
        }
    }

    getWaitingPlayerId() {
        if (this.players.length !== 2) {
            return this.players[0].id;
        }
    }

    handleGameAction(data) {
        switch (data.action) {
            case GAME_ACTION.READY:
                this.addReadyPlayer(data.player);
                break;

            case GAME_ACTION.SERVE:
                this.emitGameState(GAME_STATE.PLAY);
                break;

            case GAME_ACTION.SCORE:
                this.addPoint(data.player);
                break;

            case GAME_ACTION.PADDLE_HIT:
                this.addPaddleHit(data.flightData);
                break;
        }
    }

    getGameStateData_Wait() {
        return {
            state: GAME_STATE.WAIT,
            number: this.players[0].number
        };
    }

    getGameStateData_Serve(playerId) {
        return {
            state: GAME_STATE.SERVE,
            number: getPlayerById.call(this, playerId).number,
            server: this.servingPlayer,
            player1Score: getPlayerScore.call(this, 1),
            player2Score: getPlayerScore.call(this, 2),
            newGame: this.newGame
        }
    }

    getGameStateData_Start(playerId) {
        return {
            state: GAME_STATE.START,
            number: getPlayerById.call(this, playerId).number,
            player1Score: getPlayerScore.call(this, 1),
            player2Score: getPlayerScore.call(this, 2),
            robotEnabled: this.robotEnabled
        }
    }

    getGameStateData_Done() {
        return {
            state: GAME_STATE.DONE,
            player1Score: getPlayerScore.call(this, 1),
            player2Score: getPlayerScore.call(this, 2)
        };
    }

    getGameActionData_Play() {
        const servingAngle = getServingAngle.call(this, this.servingPlayer);
        return {
            state: GAME_STATE.PLAY,
            ballVelocity: 600,
            ballAngle: servingAngle,
            angleChange: getAngleChange.call(this, servingAngle)
        };
    }

    getGameActionData_PaddleHit() {
        if (this.flightData.length === 2) {
            const data = {
                action: GAME_ACTION.PADDLE_HIT,
                angleChange: getAngleChange.call(this),
                flightData: this.flightData
            };

            this.paddleHits = 0;
            this.flightData = [];

            return data;
        }
    }

    removePlayer(id) {
        const player = getPlayerById.call(this, id);
        this.players.splice(this.players.indexOf(player), 1); // delete the player

        // reset game for remaining player
        this.resetGame();

        return player;
    }

    isGameOver() {
        return this.players.some(player => player.score === cfg.GAME_LENGTH);
    }

    // keep the players, but reset all other info
    resetGame() {
        this.flightData = [];
        this.players.forEach(player => {
            player.ready = 0;
            player.score = 0;
        });
        this.paddleHits = 0
        this.newGame = true;
    }

    // clear all session information
    clearSession() {
        this.resetGame();
        this.players.splice(0);
    }
}

function getPlayerScore(number) {
    return getPlayerByNumber.call(this, number).score;
}

function getNextPlayerNumber() {
    if (this.players.length === 0) {
        return 1;
    } else {
        const numberAlreadyTaken = this.players[0].number;
        return numberAlreadyTaken === 2 ? 1 : 2;
    }
}

function getPlayerById(id) {
    return this.players.find(player => player.id === id);
}

function getPlayerByNumber(number) {
    return this.players.find(player => player.number === number);
}

// Returns a number between min and max (inclusive)
// Inspired by: https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues#answer-42321673
function getRandomIntInclusive(min, max) {
    const randomBuffer = new Uint8Array(1);
    this.crypto(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xff + 1);
    return Math.floor(randomNumber * (max - min + 1)) + min;
}

function getServingAngle(playerNumber) {
    const direction = playerNumber === 1 ? 0 : 180;
    return getRandomIntInclusive.call(this, -45, 45) + direction; // in degrees
}

function getAngleChange() {
    const angleChange = getRandomIntInclusive.call(this, 5, 15);
    const direction = getRandomIntInclusive.call(this, 0, 1) === 1 ? 1 : -1; // sets the direction up or down
    return angleChange * direction; // in degrees
}
