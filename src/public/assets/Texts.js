import {GAME_STATE} from '../constants.js';
import {Title} from './texts/Title.js';
import {SubTitle} from './texts/SubTitle.js';
import {PlayerScore} from './texts/PlayerScore.js';
import {Info} from './texts/Info.js';

export default class Texts {

    constructor(scene, screenHeight, screenCenterX) {
        this.title = new Title(scene, screenCenterX, screenHeight / 10, 60);
        this.subtitle = new SubTitle(scene, screenCenterX, screenHeight / 10 + 60, 24);
        this.player1ScoreText = new PlayerScore(scene, screenCenterX - 100, screenHeight / 3, 84, 1);
        this.player2ScoreText = new PlayerScore(scene, screenCenterX + 100, screenHeight / 3, 84, 2);
        this.infoText = new Info(scene, screenCenterX, screenHeight * .64, 24);

        // create a tween to move the scoreboard out of the way when playing
        this.scoreBoardDown = true;
        this.moveScoreBoardUp = tweenScoreBoard.call(this, scene, 55, false, 500);
        this.moveScoreBoardDown = tweenScoreBoard.call(this, scene, this.player1ScoreText.textObj.y, true, 500)
            .on('complete', () => {
                this.title.textObj.visible = true;
                this.subtitle.textObj.visible = true;
            });
    }

    updateOnline(onlineEnabled) {
        this.title.updateOnline(onlineEnabled);
        this.subtitle.updateOnline(onlineEnabled);
        this.infoText.updateOnline(onlineEnabled);
    }

    updateGameState(data, playerNumber) {
        if (!this.scoreBoardDown) {
            this.moveScoreBoardDown.play();
            // the tween will also make title and subtitle visible
        } else if (data.state === GAME_STATE.PLAY) {
            this.moveScoreBoardUp.play();
        }

        this.title.updateGameState(data, playerNumber);
        this.subtitle.updateGameState(data, playerNumber);
        this.player1ScoreText.updateGameState(data, playerNumber);
        this.player2ScoreText.updateGameState(data, playerNumber);
        this.infoText.updateGameState(data, playerNumber);
    }
}

function tweenScoreBoard(scene, yPos, isDown, duration) {
    return scene.tweens.add({
        targets: [this.player1ScoreText.textObj, this.player2ScoreText.textObj],
        y: yPos,
        duration: duration,
        ease: 'Sine.easeInOut',
        paused: true,
        onComplete: () => this.scoreBoardDown = isDown
    });
}
