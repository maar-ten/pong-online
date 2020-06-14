import AbstractText from './AbstractText.js';
import {GAME_STATE} from '../../constants.js';
import cfg from '../../config.js';

export default class Title extends AbstractText {

    online = {
        default: () => 'This is Pong !',
        start: (data) => data.number === 1 ? '<- Your Side' : 'Your Side ->',
        serve: (data) => data.number === data.server ? 'You are Serving !' : 'Opponent Serves !',
        done: (data, playerNumber) => data.player1Score > data.player2Score && playerNumber === 1 ? 'You Win !' : 'You Lose'
    };

    offline = {
        default: this.online.default,
        wait: this.online.default,
        start: () => '<-     Player 1          Player 2     ->',
        serve: (data) => `Player ${data.server} serves !`,
        done: (data) => data.player1Score > data.player2Score ? 'Player 1 Wins !' : 'Player 2 Wins !'
    };

    constructor(scene, x, y, size) {
        super(scene, x, y, size);
        this.dict = cfg.ONLINE_ENABLED ? this.online : this.offline;
        this.textObj.text = this.dict.default();
    }

    updateOnline(isOnline) {
        this.dict = isOnline ? this.online : this.offline;
    }

    updateGameState(data, playerNumber) {
        // visibility of the title is (mostly) handled in Texts.js inside the tween

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

            case GAME_STATE.PLAY:
                this.textObj.visible = false;
                break;

            default:
                this.textObj.text = this.dict.default();
                break;
        }
    }
}