import {GAME_STATE} from './constants.js';
import cfg from './config.js';

const FONT = 'DeadSpace';
const COLOR = '#FD5F3F';

export default class Texts {

    constructor(scene, screenHeight, screenCenterX) {
        this.scoreYPos = screenHeight / 3;

        this.title = addText(scene, screenCenterX, screenHeight / 10, 60, 'This is Pong!');
        this.subtitle = addText(scene, screenCenterX, screenHeight / 10 + 60, 24, 'Press Enter to Play!');
        this.player1ScoreText = addText(scene, screenCenterX - 100, this.scoreYPos, 84, 0);
        this.player2ScoreText = addText(scene, screenCenterX + 100, this.scoreYPos, 84, 0);
        this.previousGameState = 0;
    }

    setPlayer1Score(score) {
        this.player1ScoreText.text = score;
    }

    setPlayer2Score(score) {
        this.player2ScoreText.text = score;
    }

    update(gameState, playerNumber, servingPlayer) {
        // animate the score board out of the way when playing
        if (this.subtitle.visible) {
            this.player1ScoreText.y = this.scoreYPos;
            this.player2ScoreText.y = this.scoreYPos;
        } else {
            if (this.player1ScoreText.y >= this.scoreYPos * .3) {
                this.player1ScoreText.y -= 10;
                this.player2ScoreText.y -= 10;
            }
        }

        if (this.previousGameState === gameState) {
            return; // no need to update the texts now
        }
        this.previousGameState = gameState;

        switch (gameState) {
            case GAME_STATE.CONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Connecting to server . . .';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.SERVER_REJECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'No more room on server';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.WAIT:
            case GAME_STATE.DISCONNECT:
                this.title.text = 'This is Pong !';
                this.subtitle.text = 'Waiting For Other Player . . .';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.START:
                let direction = playerNumber === 1 ? '<- Your Side' : 'Your Side ->';
                this.title.text = `${direction}`;
                this.subtitle.text = 'Press Enter When Ready !';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.START_SERVE:
                this.subtitle.text = 'Waiting For Other Player . . .';
                this.title.visible = false;
                this.subtitle.visible = true;
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
                break;

            case GAME_STATE.PLAY:
                this.title.visible = false;
                this.subtitle.visible = false;
                break;

            case GAME_STATE.DONE:
                const winner = this.player1ScoreText === `${cfg.GAME_LENGTH}` ? 1 : 2;
                const text = winner === playerNumber ? 'Win' : 'Lose'
                this.title.text = `You ${text}!`;
                this.subtitle.text = 'Press Enter to Play !';
                this.title.visible = true;
                this.subtitle.visible = true;
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

