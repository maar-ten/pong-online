const WIDTH = 1280
const HEIGHT = 768;
const PADDLE_SPEED = 10;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 16;
const BALL_WIDTH = 16;

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

const font = 'PressStart2P';

let gameState = 'start';
let screenCenterX;
let screenCenterY;
let title;
let subtitle;
let player1ScoreText;
let player2ScoreText;
let player1Score = 0;
let player2Score = 0;
let paddle1;
let paddle2;
let ball;
let balldx;
let balldy;
let keys;
let servingPlayer;

function preload() {
    this.cameras.main.backgroundColor.setTo(40, 45, 52, 255);
}

function create() {
    screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    title = this.add.text(screenCenterX, HEIGHT / 10, 'Welcome to Pong!', {
        fontFamily: font,
        fontSize: '32px'
    }).setOrigin(.5).setVisible(false);

    subtitle = this.add.text(screenCenterX, HEIGHT / 10 + 48, 'Press Enter to Play!', {
        fontFamily: font,
        fontSize: '16px'
    }).setOrigin(.5).setVisible(false);

    player1ScoreText = this.add.text(screenCenterX - 100, HEIGHT / 3, player1Score, {
        fontFamily: font,
        fontSize: '56px'
    }).setOrigin(.5);

    player2ScoreText = this.add.text(screenCenterX + 100, HEIGHT / 3, player2Score, {
        fontFamily: font,
        fontSize: '56px'
    }).setOrigin(.5);

    paddle1 = this.add.rectangle(30, 120, PADDLE_WIDTH, PADDLE_HEIGHT, 0xffffff).setOrigin(.5);
    paddle2 = this.add.rectangle(WIDTH - 30, HEIGHT - 120, PADDLE_WIDTH, PADDLE_HEIGHT, 0xffffff).setOrigin(.5);
    ball = this.add.rectangle(screenCenterX, screenCenterY, BALL_WIDTH, BALL_WIDTH, 0xffffff).setOrigin(.5);

    this.physics.world.enable(paddle1);
    this.physics.world.enable(paddle2);
    this.physics.world.enable(ball);

    let ballCollisionFn = () => {
        balldx = -balldx * 1.03;
        if (balldy < 0) {
            balldy = -Phaser.Math.RND.between(1, 5);
        } else {
            balldy = Phaser.Math.RND.between(1, 5);
        }
    }

    this.physics.add.collider(paddle1, ball, ballCollisionFn);
    this.physics.add.collider(paddle2, ball, ballCollisionFn);

    keys = this.input.keyboard.addKeys('W, S, UP, DOWN, ENTER');
}

function update() {
    if (gameState == 'start') {
        title.setVisible(true);
        subtitle.setVisible(true);

    } else if (gameState == 'serve') {
        resetBall();
        title.text = `Player ${servingPlayer}\'s serve!`;
        subtitle.text = 'Press Enter to Serve!';

        title.visible = true;
        subtitle.visible = true;

    } else if (gameState == 'play') {
        title.visible = false;
        subtitle.visible = false;

        // reverse ball y-direction when it hits the top or bottom
        if (ball.y <= 0 + ball.height / 2 || ball.y >= HEIGHT - ball.height / 2) {
            balldy = -balldy;
        }

        // move the ball
        ball.x = ball.x + balldx;
        ball.y = ball.y + balldy;

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
            paddle1.y = paddle1.y - PADDLE_SPEED;
        }
    }

    if (keys.S.isDown) {
        if (paddle1.y < HEIGHT - paddle1.height / 2) {
            paddle1.y = paddle1.y + PADDLE_SPEED;
        }
    }

    if (keys.UP.isDown) {
        if (paddle2.y > paddle2.height / 2) {
            paddle2.y = paddle2.y - PADDLE_SPEED;
        }
    }

    if (keys.DOWN.isDown) {
        if (paddle2.y < HEIGHT - paddle2.height / 2) {
            paddle2.y = paddle2.y + PADDLE_SPEED;
        }
    }

    if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
        if (gameState == 'start') {
            servingPlayer = Phaser.Math.RND.between(1, 2);
            gameState = 'serve';

        } else if (gameState == 'serve') {
            balldx = Phaser.Math.RND.between(5, 10);
            balldx = servingPlayer == 1 ? balldx : -balldx;
            balldy = Phaser.Math.RND.between(-5, 5);
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

function resetBall() {
    ball.x = screenCenterX;
    ball.y = screenCenterY;
}
