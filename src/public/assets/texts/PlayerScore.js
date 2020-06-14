import AbstractText from './AbstractText.js';
import {GAME_STATE} from '../../constants.js';

export default class PlayerScore extends AbstractText {

    constructor(scene, x, y, size, player) {
        super(scene, x, y, size);
        this.player = player;
        this.score = 0;
    }

    updateGameState(data) {
        if (data.state === GAME_STATE.SERVE || data.state === GAME_STATE.DONE) {
            this.score = this.player === 1 ? data.player1Score : data.player2Score;
        }

        this.textObj.text = this.score;
        this.textObj.visible = true;
    }
}