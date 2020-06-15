import GameSession from './GameSession.js';
import {GAME_ACTION, GAME_STATE, MESSAGE} from '../constants.js';

/**
 * This class serves as a piece of middleware that emulates the existance of a second client in situations where there
 * is no second client. This is the case when playing the game offline for instance.
 */
export class SocketMock {

    constructor() {
        this.eventHandlers = new Map();
        this.gameSession = new GameSession();
        this.gameSession.setRandomValueCallback(randomBuffer => crypto.getRandomValues(randomBuffer));
        this.gameSession.setGameActionCallback(data => this._onGameAction(data));
        this.gameSession.setGameStateChangeCallback(state => this._onGameStateChange(state));
    }

    // used by the client to start the session
    open() {
        this.gameSession.addPlayer(1);
        this.gameSession.addPlayer(2);
    }

    // callbacks used by the server to send data to the client
    on(eventName, callback) {
        this.eventHandlers.set(eventName, callback);
    }

    // used by the client to send data to the server
    emit(eventName, data) {
        if (eventName === MESSAGE.LATENCY) {
            return;
        }

        this.gameSession.handleGameAction(data);

        // pretend that the other client (player 2) also sends this message
        const dataPlayer2 = JSON.parse(JSON.stringify(data)); // bit of a hack :-(
        switch (data.action) {
            case GAME_ACTION.READY:
                dataPlayer2.player = 2;
                this.gameSession.handleGameAction(dataPlayer2);
                break;

            case GAME_ACTION.PADDLE_HIT:
                dataPlayer2.flightData.player = 2;
                this.gameSession.handleGameAction(dataPlayer2);
                break;
        }
    }

    // callback to handle actions send by the GameSession
    _onGameAction(data) {
        this.eventHandlers.get(MESSAGE.ACTION)(data);
    }

    // callback to handle state changes send by the GameSession
    _onGameStateChange(state) {
        let data;

        switch (state) {
            case GAME_STATE.START:
                data = this.gameSession.getGameStateData_Start(1);
                break;

            case GAME_STATE.SERVE:
                data = this.gameSession.getGameStateData_Serve(1);
                break;

            case GAME_STATE.PLAY:
                data = this.gameSession.getGameStateData_Play();
                break;

            case GAME_STATE.DONE:
                data = this.gameSession.getGameStateData_Done();
                break;
        }

        if (data) {
            this.eventHandlers.get(MESSAGE.GAME_STATE)(data);
        }
    }
}