import Paddle from './paddle.js';
import Ball from './ball.js';

const WIDTH = 1280
const HEIGHT = 768;
const FONT = 'PressStart2P';

new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
});

let gameState = 'start';
let title;
let subtitle;
let player1ScoreText;
let player2ScoreText;
let player1Score = 0;
let player2Score = 0;
let paddle1;
let paddle2;
let ball;
let keys;
let servingPlayer;

function preload() {
    this.cameras.main.backgroundColor.setTo(40, 45, 52, 255);
}

function create() {
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    title = addText(this, screenCenterX, HEIGHT / 10, 32, 'Welcome to Pong!', false);
    subtitle = addText(this, screenCenterX, HEIGHT / 10 + 48, 16, 'Press Enter to Play!', false);

    player1ScoreText = addText(this, screenCenterX - 100, HEIGHT / 3, 56, player1Score);
    player2ScoreText = addText(this, screenCenterX + 100, HEIGHT / 3, 56, player2Score);

    // create paddles
    paddle1 = this.add.existing(new Paddle(this, 30, 120));
    paddle2 = this.add.existing(new Paddle(this, WIDTH - 30, HEIGHT - 120));

    // create ball and add the paddles as colliders
    ball = this.add.existing(new Ball(this, screenCenterX, screenCenterY));
    ball.addCollider(paddle1);
    ball.addCollider(paddle2);

    keys = this.input.keyboard.addKeys('W, S, UP, DOWN, ENTER');
}

function update() {
    if (gameState == 'start') {
        title.setVisible(true);
        subtitle.setVisible(true);

    } else if (gameState == 'serve') {
        ball.reset();
        title.text = `Player ${servingPlayer}\'s serve!`;
        subtitle.text = 'Press Enter to Serve!';

        title.visible = true;
        subtitle.visible = true;

    } else if (gameState == 'play') {
        title.visible = false;
        subtitle.visible = false;

        // reverse ball y-direction when it hits the top or bottom
        if (ball.y <= 0 + ball.height / 2 || ball.y >= HEIGHT - ball.height / 2) {
            ball.dy *= -1;
        }

        // move the ball
        ball.update();

        // player 1 scores
        if (ball.x - ball.width / 2 > WIDTH) {
            player1Score++;
            player1ScoreText.text = player1Score;
            servingPlayer = 2;
            gameState = 'serve';
        }

        // player 2 scores
        if (ball.x + ball.width / 2 < 0) {
            player2Score++;
            player2ScoreText.text = player2Score;
            servingPlayer = 1;
            gameState = 'serve';
        }

        if (player1Score == 10 || player2Score == 10) {
            gameState = 'done';
        }

    } else if (gameState == 'done') {
        let winner = player1Score == 10 ? 1 : 2;
        title.text = `Player ${winner} wins!`;
        subtitle.text = 'Press Enter to Play!';
        title.visible = true;
        subtitle.visible = true;
    }

    if (keys.W.isDown) {
        if (paddle1.y > paddle1.height / 2) {
            paddle1.up();
        }
    }

    if (keys.S.isDown) {
        if (paddle1.y < HEIGHT - paddle1.height / 2) {
            paddle1.down();
        }
    }

    if (keys.UP.isDown) {
        if (paddle2.y > paddle2.height / 2) {
            paddle2.up();
        }
    }

    if (keys.DOWN.isDown) {
        if (paddle2.y < HEIGHT - paddle2.height / 2) {
            paddle2.down();
        }
    }

    if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
        if (gameState == 'start') {
            servingPlayer = Phaser.Math.RND.between(1, 2);
            gameState = 'serve';

        } else if (gameState == 'serve') {
            // todo use body.setVelocity instead (https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Body.html#setVelocity__anchor)
            ball.dx = Phaser.Math.RND.between(5, 10);
            ball.dx = servingPlayer == 1 ? ball.dx : -ball.dx;
            ball.dy = Phaser.Math.RND.between(-5, 5);
            gameState = 'play';

        } else if (gameState == 'done') {
            gameState = 'serve';
            player1Score = 0;
            player2Score = 0;

            player1ScoreText.text = player1Score;
            player2ScoreText.text = player2Score;
        }
    }
}

function addText(scene, x, y, size, text, isVisible) {
    const visible = isVisible || true;

    return scene.add.text(x, y, text, {
        fontFamily: FONT,
        fontSize: size + 'px'
    }).setOrigin(.5).setVisible(visible);
}
