import { Paddle, PADDLE_SPEED } from './paddle.js';
import Ball from './ball.js';

const WIDTH = 1280
const HEIGHT = 768;
const FONT = 'PressStart2P';

new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    pixelArt: true,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
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
let wallHitSound;
let ballOutSound;

function preload() {
    this.cameras.main.backgroundColor.setTo(40, 45, 52, 255);

    // sounds
    this.load.audio('paddle-hit', 'assets/paddle-hit.mp3');
    this.load.audio('wall-hit', 'assets/wall-hit.mp3');
    this.load.audio('ball-out', 'assets/ball-out.mp3');
}

function create() {
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    // sounds
    wallHitSound = this.sound.add('wall-hit');
    ballOutSound = this.sound.add('ball-out');

    // texts
    title = addText(this, screenCenterX, HEIGHT / 10, 32, 'Welcome to Pong!', false);
    subtitle = addText(this, screenCenterX, HEIGHT / 10 + 48, 16, 'Press Enter to Play!', false);

    player1ScoreText = addText(this, screenCenterX - 100, HEIGHT / 3, 56, player1Score);
    player2ScoreText = addText(this, screenCenterX + 100, HEIGHT / 3, 56, player2Score);

    // create paddles
    paddle1 = this.add.existing(new Paddle(this, 30, 120));
    paddle2 = this.add.existing(new Paddle(this, WIDTH - 30, HEIGHT - 120));

    // create ball and add the paddles as colliders
    ball = this.add.existing(new Ball(this, screenCenterX, screenCenterY));
    ball.addCollider(paddle1, this.sound.add('paddle-hit'));
    ball.addCollider(paddle2, this.sound.add('paddle-hit'));

    // keyboard mappings
    keys = this.input.keyboard.addKeys('W, S, UP, DOWN, ENTER');

    // let objects exit left and right of screen
    this.physics.world.setBoundsCollision(false, false, true, true);
    this.physics.world.on('worldbounds', () => wallHitSound.play()); // is emitted by the ball
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

        // player 1 scores
        if (ball.x - ball.width / 2 > WIDTH) {
            ballOutSound.play();
            player1Score++;
            player1ScoreText.text = player1Score;
            servingPlayer = 2;
            gameState = 'serve';
        }

        // player 2 scores
        if (ball.x + ball.width / 2 < 0) {
            ballOutSound.play();
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
        paddle1.body.setVelocityY(-PADDLE_SPEED);
    } else if (keys.S.isDown) {
        paddle1.body.setVelocityY(PADDLE_SPEED);
    } else {
        paddle1.body.setVelocityY(0);
    }

    if (keys.UP.isDown) {
        paddle2.body.setVelocityY(-PADDLE_SPEED);
    } else if (keys.DOWN.isDown) {
        paddle2.body.setVelocityY(PADDLE_SPEED);
    } else {
        paddle2.body.setVelocityY(0);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
        if (gameState == 'start') {
            servingPlayer = Phaser.Math.RND.between(1, 2);
            gameState = 'serve';

        } else if (gameState == 'serve') {
            ball.setVelocity(servingPlayer == 1 ? 500 : -500);
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