import {GAME_STATE} from '../../constants.js';
import {AbstractText} from './AbstractText.js';

export class Title extends AbstractText {

    online = {
        default: () => 'This is Pong !',
        start: (data) => data.number === 1 ? '<- Your Side' : 'Your Side ->',
        serve: (data) => data.number === data.server ? 'You are Serving !' : 'Opponent Serves !',
        done: (data, playerNumber) => data.player1Score > data.player2Score && playerNumber === 1 ? 'You Win !' : 'You Lose'
    };

    constructor(scene, x, y, size) {
        super(scene, x, y, size);
        this.dict = this.online;
    }

    updateOnline(isOnline) {
        if (isOnline) {
            this.dict = this.online;
        } else {
            this.dict = this.offline;
        }
    }

    updateGameState(data, playerNumber) {
        // visibility of the title is handled in Texts.js inside the tween

        switch (data.state) {
            case GAME_STATE.START:
                this.textObj.text = this.dict.start(data);
                break;

            case GAME_STATE.SERVE:
                this.textObj.text = this.dict.serve(data);
                break;

            case GAME_STATE.DONE:
                this.textObj.text = this.dict.done(data, playerNumber);
                break;

            case GAME_STATE.START_SERVE:
            case GAME_STATE.PLAY:
                this.textObj.visible = false;
                break;

            case GAME_STATE.CONNECT:
            case GAME_STATE.SERVER_REJECT:
            case GAME_STATE.WAIT:
            case GAME_STATE.DISCONNECT:
            default:
                this.textObj.text = this.dict.default();
                break;
        }
    }
}