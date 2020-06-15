import cfg from '../config.js';
import {GAME_ACTION, GAME_STATE} from '../constants.js';

export default class GameSession {

    constructor() {
        this.players = [];
        this.servingPlayer = 1;
        this.newGame = true;
        this.paddleHits = 0;
        this.paddleHitsMax = 0;
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

    getSize() {
        return this.players.length;
    }

    addPlayer(id) {
        const player = {};
        player.id = id;
        player.number = this._getNextPlayerNumber();
        player.score = 0;
        player.ready = false;

        this.players.push(player);
        console.info(`Player ${player.number} connected`);

        if (this.getSize() === 2) {
            // both players connected, ask if they are ready to start
            this._emitGameState(GAME_STATE.START);
        } else {
            // one player connected, wait for the other one
            this._emitGameState(GAME_STATE.WAIT);
        }

        return player.number;
    }

    getPlayerIds() {
        return this.players.map(player => player.id);
    }

    _addReadyPlayer(number) {
        const player = this._getPlayerByNumber(number);
        player.ready = true;
        player.score = 0;

        if (this.players.every(player => player.ready)) {
            // both players are ready, change state to serving
            this.flightData = [];
            this.servingPlayer = this._getRandomIntInclusive(1, 2);
            this.newGame = true;
            this._emitGameState(GAME_STATE.SERVE);
        }
    }

    _addPoint(playerNumber) {
        const player = this._getPlayerByNumber(playerNumber);
        player.score++;

        if (this._isGameOver()) {
            this._emitGameState(GAME_STATE.DONE);
            this._resetGame(); // don't reset the game before emitting DONE
        } else {
            this.newGame = false;
            this.flightData = [];
            this.paddleHits = 0;
            this.servingPlayer = player.number === 2 ? 1 : 2;
            this._emitGameState(GAME_STATE.SERVE);
        }
    }

    _addPaddleHit(flightData) {
        this.flightData.push(flightData);

        function flightDataCorrupt() {
            return this.flightData[0].player === this.flightData[1].player
                || this.flightData[0].flightNumber !== this.flightData[1].flightNumber;
        }

        if (this.flightData.length === 2) {
            this.paddleHits++;
            this.paddleHitsMax = Math.max(this.paddleHitsMax, this.paddleHits);

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
                this._addReadyPlayer(data.player);
                break;

            case GAME_ACTION.SERVE:
                this._emitGameState(GAME_STATE.PLAY);
                break;

            case GAME_ACTION.SCORE:
                this._addPoint(data.player);
                break;

            case GAME_ACTION.PADDLE_HIT:
                this._addPaddleHit(data.flightData);
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
            number: this._getPlayerById(playerId).number,
            server: this.servingPlayer,
            player1Score: this._getPlayerScore(1),
            player2Score: this._getPlayerScore(2),
            newGame: this.newGame
        };
    }

    getGameStateData_Start(playerId) {
        return {
            state: GAME_STATE.START,
            number: this._getPlayerById(playerId).number,
            player1Score: this._getPlayerScore(1),
            player2Score: this._getPlayerScore(2),
            robotEnabled: this.robotEnabled
        };
    }

    getGameStateData_Done() {
        return {
            state: GAME_STATE.DONE,
            player1Score: this._getPlayerScore(1),
            player2Score: this._getPlayerScore(2),
            paddleHitsMax: this.paddleHitsMax
        };
    }

    getGameStateData_Play() {
        return {
            state: GAME_STATE.PLAY,
            ballVelocity: 600,
            ballAngle: this._getServingAngle(this.servingPlayer),
            angleChange: this._getAngleChange()
        };
    }

    getGameActionData_PaddleHit() {
        if (this.flightData.length === 2) {
            const data = {
                action: GAME_ACTION.PADDLE_HIT,
                angleChange: this._getAngleChange(),
                flightData: this.flightData
            };

            this.flightData = [];

            return data;
        }
    }

    removePlayer(id) {
        const player = this._getPlayerById(id);
        this.players.splice(this.players.indexOf(player), 1); // delete the player

        // reset game for remaining player
        this._resetGame();

        return player;
    }

    // clear all session information
    clearSession() {
        this._resetGame();
        this.players.splice(0);
    }

    _emitGameState(gameState) {
        this.gameStateCallback(gameState);
    }

    _isGameOver() {
        return this.players.some(player => player.score === cfg.GAME_LENGTH);
    }

    // keep the players, but reset all other info
    _resetGame() {
        this.flightData = [];
        this.players.forEach(player => {
            player.ready = 0;
            player.score = 0;
        });
        this.paddleHits = 0;
        this.paddleHitsMax = 0;
        this.newGame = true;
    }

    _getPlayerScore(number) {
        return this._getPlayerByNumber(number).score;
    }

    _getNextPlayerNumber() {
        if (this.players.length === 0) {
            return 1;
        } else {
            const numberAlreadyTaken = this.players[0].number;
            return numberAlreadyTaken === 2 ? 1 : 2;
        }
    }

    _getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }

    _getPlayerByNumber(number) {
        return this.players.find(player => player.number === number);
    }

    // Returns a number between min and max (inclusive)
    // Inspired by: https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues#answer-42321673
    _getRandomIntInclusive(min, max) {
        const randomBuffer = new Uint8Array(1);
        this.crypto(randomBuffer);
        const randomNumber = randomBuffer[0] / (0xff + 1);
        return Math.floor(randomNumber * (max - min + 1)) + min;
    }

    _getServingAngle(playerNumber) {
        const direction = playerNumber === 1 ? 0 : 180;
        return this._getRandomIntInclusive(-45, 45) + direction; // in degrees
    }

    _getAngleChange() {
        const angleChange = this._getRandomIntInclusive(5, 15);
        const direction = this._getRandomIntInclusive(0, 1) === 1 ? 1 : -1; // sets the direction up or down
        return angleChange * direction; // in degrees
    }
}
