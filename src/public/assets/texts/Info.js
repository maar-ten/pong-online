import AbstractText from './AbstractText.js';
import {GAME_STATE} from '../../constants.js';
import cfg from '../../config.js';

export default class Info extends AbstractText {

    default = 'Press   M   for some music\nPress   H   for help\n\n';

    online = {
        default: () => this.default + 'Playing online',
        done: (data) => `The longest rally was ${data.paddleHitsMax} hit${data.paddleHitsMax !== 1 ? 's' : ''}\n${this.getGameResult(data.paddleHitsMax)}`
    };

    offline = {
        default: () => this.default + 'Playing offline',
        done: this.online.done
    };

    constructor(scene, x, y, size) {
        super(scene, x, y, size);
        this.textObj.setAlign('center');
        this.textObj.setLineSpacing(5);
        this.dict = cfg.ONLINE_ENABLED ? this.online : this.offline;
        this.textObj.text = this.dict.default();
    }


    updateOnline(isOnline) {
        this.dict = isOnline ? this.online : this.offline;
    }

    updateGameState(data) {
        this.textObj.visible = true;

        switch (data.state) {
            case GAME_STATE.PLAY:
            case GAME_STATE.SERVE:
                this.textObj.visible = false;
                break;

            case GAME_STATE.DONE:
                this.textObj.text = this.dict.done(data);
                break;

            default:
                this.textObj.text = this.dict.default();
                break;
        }
    }

    getGameResult(paddleHits) {
        let result = 'That is ';
        if (paddleHits >= 21) {
            result += 'out of this world';
        } else if (paddleHits === 20) {
            result += 'ridiculous';
        } else if (paddleHits === 19) {
            result += 'surely a mistake';
        } else if (paddleHits === 18) {
            result += 'crazy';
        } else if (paddleHits === 17) {
            result += 'amazing';
        } else if (paddleHits === 16) {
            result += 'awesome';
        } else if (paddleHits === 15) {
            result += 'great';
        } else if (paddleHits === 14) {
            result += 'pretty good';
        } else if (paddleHits > 13) {
            result += 'getting there';
        } else if (paddleHits > 12) {
            result += 'swell';
        } else if (paddleHits > 10) {
            result += 'neat';
        } else if (paddleHits >= 5) {
            result += 'not bad';
        } else if (paddleHits === 0) {
            result += 'weird';
        } else {
            result += 'pretty bad';
        }

        return result;
    }
}