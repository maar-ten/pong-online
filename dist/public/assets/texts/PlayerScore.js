import AbstractText from './AbstractText.js';
import {GAME_STATE} from '../../constants.js';

export default class PlayerScore extends AbstractText {

    constructor(scene, x, y, size, player) {
        super(scene, x, y, size);
        this.player = player;
        this.score = 0;
        this.textObj.text = this.score;
    }

    updateGameState(data) {
        switch (data.state) {
            case GAME_STATE.DISCONNECT:
                this.score = 0;
                break;

            case GAME_STATE.SERVE:
            case GAME_STATE.DONE:
                this.score = this.player === 1 ? data.player1Score : data.player2Score;
                break;
        }

        this.textObj.text = this.score;
        this.textObj.visible = true;
    }
}