import {GAME_STATE} from './constants.js';
import cfg from './config.js';

const FONT = 'DeadSpace';
const COLOR = '#FD5F3F';

export default class Texts {

    constructor(scene, screenHeight, screenCenterX) {
        this.title = addText(scene, screenCenterX, screenHeight / 10, 60, 'This is Pong !');
        this.subtitle = addText(scene, screenCenterX, screenHeight / 10 + 60, 24, 'Press Enter to Play !');
        this.player1ScoreText = addText(scene, screenCenterX - 100, screenHeight / 3, 84, 0);
        this.player2ScoreText = addText(scene, screenCenterX + 100, screenHeight / 3, 84, 0);
        this.infoText = addText(scene, screenCenterX, screenHeight * .64, 24, 'Press M for some music').setAlign('center');
        this.previousGameState = 0;
        this.paddleHits = 0;
        this.paddleHitsMax = 0;

        // create a tween to move the scoreboard out of the way when playing
        this.scoreBoardDown = true;
        this.moveScoreBoardUp = tweenScoreBoard.call(this, scene, 55, false, 500);
        this.moveScoreBoardDown = tweenScoreBoard.call(this, scene, this.player1ScoreText.y, true, 500)
            .on('complete', () => {
                this.title.visible = true;
                this.subtitle.visible = true;
            });
    }

    setPlayer1Score(score) {
        this.player1ScoreText.text = score;
    }

    setPlayer2Score(score) {
        this.player2ScoreText.text = score;
    }

    addPaddleHit() {
        this.paddleHits++;
        this.paddleHitsMax = Math.max(this.paddleHitsMax, this.paddleHits);
    }

    resetPaddleHits(newGame) {
        this.paddleHits = 0;
        if (newGame) this.paddleHitsMax = 0;
    }

    update(gameState, playerNumber, servingPlayer) {
        if (this.previousGameState === gameState) {
            return; // no need to update the texts now
        }
        this.previousGameState = gameState;

        if (!this.scoreBoardDown) {
            this.moveScoreBoardDown.play();
            // the tween will also make title and subtitle visible
        }

        switch (gameState) {
            case GAME_STATE.CONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Connecting to server . . .';
                break;

            case GAME_STATE.SERVER_REJECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'No more room on server';
                break;

            case GAME_STATE.WAIT:
            case GAME_STATE.DISCONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Waiting For Other Player . . .';
                break;

            case GAME_STATE.START:
                let direction = playerNumber === 1 ? '<- Your Side' : 'Your Side ->';
                this.title.text = `${direction}`;
                this.subtitle.text = 'Press Enter When Ready !';
                break;

            case GAME_STATE.START_SERVE:
                this.subtitle.text = 'Waiting For Other Player . . .';
                this.title.visible = false;
                break;

            case GAME_STATE.SERVE:
                if (servingPlayer === playerNumber) {
                    this.title.text = 'You are Serving !';
                    this.subtitle.text = 'Press Enter to Serve !';

                } else {
                    this.title.text = 'Opponent Serves!';
                    this.subtitle.text = 'Here Comes the Serve !';
                }

                this.infoText.visible = false;
                break;

            case GAME_STATE.PLAY:
                this.title.visible = false;
                this.subtitle.visible = false;
                this.infoText.visible = false;

                if (this.scoreBoardDown) {
                    this.moveScoreBoardUp.play();
                }

                break;

            case GAME_STATE.DONE:
                const winner = this.player1ScoreText.text === `${cfg.GAME_LENGTH}` ? 1 : 2;
                const text = winner === playerNumber ? 'Win' : 'Lose';
                this.title.text = `You ${text}!`;
                this.subtitle.text = 'Press Enter to Play !';
                this.infoText.text = `The longest rally was ${this.paddleHitsMax} hits\n${getGameResult(this.paddleHitsMax)}`;
                this.infoText.visible = true;
                break;
        }
    }
}

// Utility method for adding text objects
export function addText(scene, x, y, size, text, fontFamily = FONT, color = COLOR) {
    return scene.add
        .text(x, y, text, {
            fontFamily: fontFamily,
            fontSize: size + 'px',
            color: color
        })
        .setOrigin(0.5); // sets the origin of the object in the center
}

function getGameResult(paddleHits) {
    let result = 'That\'s ';
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
    } else {
        result += 'pretty bad';
    }

    return result;
}

function tweenScoreBoard(scene, yPos, isDown, duration) {
    return scene.tweens.add({
        targets: [this.player1ScoreText, this.player2ScoreText],
        y: yPos,
        duration: duration,
        ease: 'Sine.easeInOut',
        paused: true,
        onComplete: () => this.scoreBoardDown = isDown
    });
}
