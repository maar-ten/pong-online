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
        this.gameStats = addText(scene, screenCenterX, screenHeight * .64, 24, '').setAlign('center');
        this.previousGameState = 0;
        this.paddleHits = 0;
        this.paddleHitsMax = 0;

        // move the scoreboard out of the way when playing
        this.scoreBoardDown = true;
        this.moveScoreBoardUp = tweenScoreBoard.call(this, scene, 55, false, 500);
        this.moveScoreBoardDown = tweenScoreBoard.call(this, scene, this.player1ScoreText.y, true, 1);
    }

    setPlayer1Score(score) {
        this.player1ScoreText.text = score;
    }

    setPlayer2Score(score) {
        this.player2ScoreText.text = score;
    }

    setPaddleHits(hits) {
        this.paddleHits = hits;
        this.paddleHitsMax = Math.max(this.paddleHitsMax, this.paddleHits);
    }

    update(gameState, playerNumber, servingPlayer) {
        if (this.previousGameState === gameState) {
            return; // no need to update the texts now
        }
        this.previousGameState = gameState;

        if (!this.scoreBoardDown) {
            this.moveScoreBoardDown.play();
        }

        switch (gameState) {
            case GAME_STATE.CONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Connecting to server . . .';
                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.SERVER_REJECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'No more room on server';
                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.WAIT:
            case GAME_STATE.DISCONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Waiting For Other Player . . .';
                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.START:
                let direction = playerNumber === 1 ? '<- Your Side' : 'Your Side ->';
                this.title.text = `${direction}`;
                this.subtitle.text = 'Press Enter When Ready !';
                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.START_SERVE:
                this.subtitle.text = 'Waiting For Other Player . . .';
                this.title.visible = false;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.SERVE:
                if (servingPlayer === playerNumber) {
                    this.title.text = 'You are Serving !';
                    this.subtitle.text = 'Press Enter to Serve !';

                } else {
                    this.title.text = 'Opponent Serves!';
                    this.subtitle.text = 'Here Comes the Serve !';
                }

                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = false;
                break;

            case GAME_STATE.PLAY:
                this.title.visible = false;
                this.subtitle.visible = false;
                this.gameStats.visible = false;

                if (this.scoreBoardDown) {
                    this.moveScoreBoardUp.play();
                }

                break;

            case GAME_STATE.DONE:
                const winner = this.player1ScoreText.text === `${cfg.GAME_LENGTH}` ? 1 : 2;
                const text = winner === playerNumber ? 'Win' : 'Lose';
                this.title.text = `You ${text}!`;
                this.subtitle.text = 'Press Enter to Play !';
                this.gameStats.text = `The longest rally was ${this.paddleHitsMax} hits\n${getGameResult(this.paddleHitsMax)}`;
                this.title.visible = true;
                this.subtitle.visible = true;
                this.gameStats.visible = true;
                break;

            // todo add another game state after done in which one user has accepted to play again, to entice the user to continue

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
    if (paddleHits > 25) {
        result += 'ridicoulous';
    } else if (paddleHits > 20) {
        result += 'crazy';
    } else if (paddleHits > 18) {
        result += 'awesome';
    } else if (paddleHits > 14) {
        result += 'cool';
    } else if (paddleHits > 10) {
        result += 'neato';
    } else if (paddleHits > 5) {
        result += 'not bad';
    } else {
        result += 'pretty bad';
    }

    return result + ' !';
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
