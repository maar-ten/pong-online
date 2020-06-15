import AbstractText from './AbstractText.js';
import cfg from '../../config.js';

export default class Help extends AbstractText {

    optionsText = `\n\n
-=*> Options <*=-

H - help on/off
M - music on/off
O - offline on/off
P - performance monitor on/off
\n
-=*> Credits <*=-\n\nhttps://maar-ten.nl/pong-more`;

    online = {
        default: `-=*> Move paddle <*=-\n\nW / S or Up / Down\n` + this.optionsText
    };

    offline = {
        default: `-=*> Move paddles <*=-\n
W / S     - left paddle
Up / Down - right paddle` + this.optionsText
    };

    constructor(scene, x, y, size) {
        super(scene, x, y, size);
        this.dict = cfg.ONLINE_ENABLED ? this.online : this.offline;
        this.textObj.text = this.dict.default;
        this.textObj.setDepth(1)
            .setFontFamily('PressStart2P, monospace')
            .setFontSize(16)
            .setFontStyle('bold')
            .setLineSpacing(10)
            .setPadding(75, 75)
            .setShadow(0, 0, '#fff', 50)
            .setBackgroundColor('#103F66DD')
            .setVisible(false);
    }

    updateOnline(isOnline) {
        this.dict = isOnline ? this.online : this.offline;
    }

    updateGameState(data) {
        this.textObj.text = this.dict.default;
    }
}