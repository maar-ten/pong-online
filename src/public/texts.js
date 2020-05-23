import { GAME_STATE } from './constants.js';

const FONT = 'PressStart2P';

export default class Texts {

    constructor(scene, screenHeight, screenCenterX) {
        this.title = addText(scene, screenCenterX, screenHeight / 10, 32, 'This is Pong!');
        this.subtitle = addText(scene, screenCenterX, screenHeight / 10 + 48, 16, 'Press Enter to Play!');
        this.player1ScoreText = addText(scene, screenCenterX - 100, screenHeight / 3, 56, 0);
        this.player2ScoreText = addText(scene, screenCenterX + 100, screenHeight / 3, 56, 0);
    }

    setTitle(text) {
        this.title.text = text;
    }

    setSubtitle(text) {
        this.subtitle.text = text;
    }

    setPlayer1Score(score) {
        this.player1ScoreText.text = score;
    }

    setPlayer2Score(score) {
        this.player2ScoreText.text = score;
    }

    update(gameState, playerNumber, servingPlayer) {
        switch (gameState) {
            case GAME_STATE.CONNECT:
                this.title.text = 'This is Pong!';
                this.subtitle.text = 'Connecting to server...';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.WAIT:
            case GAME_STATE.DISCONNECT:
                this.title.text = 'This is Pong!';
                this.subtitle.text = 'Waiting For Other Player...';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.START:
                let direction = playerNumber === 1 ? '<- Your Side' : 'Your Side ->';
                this.title.text = `${direction}`;
                this.subtitle.text = 'Press Enter When Ready!';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.START_SERVE:
                this.subtitle.text = 'Waiting For Other Player...';
                this.title.visible = false;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.SERVE:
                if (servingPlayer === playerNumber) {
                    this.title.text = 'You are Serving!';
                    this.subtitle.text = 'Press Enter to Serve!';

                } else {
                    this.title.text = 'Opponent Serves!';
                    this.subtitle.text = 'Here Comes the Serve!';
                }

                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            case GAME_STATE.PLAY:
                this.title.visible = false;
                this.subtitle.visible = false;
                break;

            case GAME_STATE.DONE:
                const winner = this.player1ScoreText === '10' ? 1 : 2;
                const text = winner === playerNumber ? 'Win' : 'Lose'
                this.title.text = `You ${text}!`;
                this.subtitle.text = 'Press Enter to Play!';
                this.title.visible = true;
                this.subtitle.visible = true;
                break;

            // todo add another game state after done in which one user has accepted to play again, to entice the user to continue

        }
    }
}

// Utility method for adding text objects
export function addText(scene, x, y, size, text) {
    return scene.add
        .text(x, y, text, {
            fontFamily: FONT,
            fontSize: size + 'px',
        })
        .setOrigin(0.5); // sets the origin of the object in the center
}

