import AbstractText from './AbstractText.js';
import {GAME_STATE} from '../../constants.js';
import cfg from '../../config.js';

export default class SubTitle extends AbstractText {

    online = {
        continue: () => 'Press   Enter   to Continue',
        connect: () => 'Connecting to server . . .',
        serverReject: () => 'No more room on server',
        wait: () => 'Waiting For Other Player . . .',
        start: () => 'Press   Enter   When Ready !',
        serve: (data) => data.number === data.server ? 'Press   Enter   to Serve !' : 'Here Comes the Serve !',
        done: () => 'Press   Enter   to Play !'
    };

    offline = {
        continue: this.online.continue,
        connect: this.online.connect,
        serverReject: this.online.serverReject,
        serve: () => 'Press   Enter   to Serve !',
        done: this.online.done
    };

    constructor(scene, x, y, size) {
        super(scene, x, y, size);
        this.dict = cfg.ONLINE_ENABLED ? this.online : this.offline;
        this.textObj.text = this.dict.continue();
    }

    updateOnline(isOnline) {
        this.dict = isOnline ? this.online : this.offline;
    }

    updateGameState(data) {
        // visibility of the title is handled in Texts.js inside the tween

        switch (data.state) {
            case GAME_STATE.CONNECT:
                this.textObj.text = this.dict.connect();
                break;

            case GAME_STATE.WAIT:
                this.textObj.text = this.dict.wait();
                break;

            case GAME_STATE.SERVER_REJECT:
                this.textObj.text = this.dict.serverReject();
                break;

            case GAME_STATE.SERVE:
                this.textObj.text = this.dict.serve(data);
                break;

            case GAME_STATE.PLAY:
                this.textObj.visible = false;
                break;

            case GAME_STATE.DONE:
                this.textObj.text = this.dict.done();
                break;

            default:
                this.textObj.text = this.dict.wait();
                break;
        }
    }
}