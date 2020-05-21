import { Paddle, PADDLE_SPEED } from './paddle.js';
import Ball from './ball.js';
import { GAME_STATE, GAME_ACTION, MESSAGE } from './constants.js';

// some general settings
const WIDTH = 900;
const HEIGHT = 540;
const FONT = 'PressStart2P';
const FPS_LOGGER = true; // shows the FPS in the top left corner
const MPS_LOGGER = true; // shows the MPS in the top left corner

// open the communications channel
const socket = io();

// Phaser game config
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

// assets
let title;
let subtitle;
let player1ScoreText;
let player2ScoreText;
let fpsText;
let mpsText;
let player1Score = 0;
let player2Score = 0;
let paddleLeft;
let paddleRight;
let ball;
let keys;
let wallHitSound;
let ballOutSound;

// frame rate
let time = Date.now();
let fpsTotal = 0;
let fpsCount = 0;

// messages rate
let msgTime = Date.now();
let msgCount = 0;

// game state variables
let gameState = GAME_STATE.CONNECT;
let playerNumber;
let servingPlayer;
let localPaddle;
let remotePaddle;

let roboticPaddle = true;
let roboticPlayer = 2;
let roboticTimeoutFrames = 0;

let localPaddleFrames = 0;
let localPaddlepreviousY;
let localPaddleYThreshold = 15; // dy in pixels between two paddle positions before a change is detected. Lower values generate more messages
let localPaddleFrameThreshold = 2; // the amount of frames that dy must live before a change is detected. Lower values generate more messages

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
  title = addText(this, screenCenterX, HEIGHT / 10, 32, 'This is Pong!');
  subtitle = addText(this, screenCenterX, HEIGHT / 10 + 48, 16, 'Press Enter to Play!');
  player1ScoreText = addText(this, screenCenterX - 100, HEIGHT / 3, 56, player1Score);
  player2ScoreText = addText(this, screenCenterX + 100, HEIGHT / 3, 56, player2Score);

  // create paddles
  paddleLeft = this.add.existing(new Paddle(this, 30, 120));
  paddleRight = this.add.existing(new Paddle(this, WIDTH - 30, HEIGHT - 120));

  // create ball and add the paddles as colliders
  ball = this.add.existing(new Ball(this, screenCenterX, screenCenterY));
  let paddleHitSound = this.sound.add('paddle-hit');
  ball.addCollider(paddleLeft, paddleHitSound);
  ball.addCollider(paddleRight, paddleHitSound);

  // let objects exit left and right of screen
  this.physics.world.setBoundsCollision(false, false, true, true);
  this.physics.world.on('worldbounds', () => wallHitSound.play()); // is emitted by the ball

  // keyboard mappings
  keys = this.input.keyboard.addKeys('UP, DOWN, ENTER');

  // fps monitor
  fpsText = addText(this, 10, 10, 8, 'FPS 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  fpsText.visible = FPS_LOGGER;

  // messages monitor (message per second)
  mpsText = addText(this, 10, 20, 8, 'MPS 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  mpsText.visible = MPS_LOGGER;

  // react to game state changes
  socket.on(MESSAGE.GAME_STATE, (data) => handleGameStateChange(data));

  // react to remote player actions
  socket.on(MESSAGE.ACTION, (data) => handleRemoteAction(data));
}

function update() {
  if (FPS_LOGGER) updateFps();
  if (MPS_LOGGER) updateMps();

  if (gameState === GAME_STATE.CONNECT) {
    title.text = 'This is Pong!';
    subtitle.text = 'Connecting to server...';
    title.visible = true;
    subtitle.visible = true;

  } else if (gameState === GAME_STATE.WAIT || gameState === GAME_STATE.DISCONNECT) {
    title.text = 'This is Pong!';
    subtitle.text = 'Waiting For Other Player...';
    title.visible = true;
    subtitle.visible = true;

  } else if (gameState === GAME_STATE.START) {
    let direction = playerNumber === 1 ? '<- Your Side' : 'Your Side ->';
    title.text = `${direction}`;
    subtitle.text = 'Press Enter When Ready!';
    title.visible = true;
    subtitle.visible = true;

  } else if (gameState === GAME_STATE.START_SERVE) {
    ball.reset();
    subtitle.text = 'Waiting For Other Player...';
    title.visible = false;
    subtitle.visible = true;

  } else if (gameState === GAME_STATE.SERVE) {
    if (servingPlayer === playerNumber) {
      title.text = 'You are Serving!';
      subtitle.text = 'Press Enter to Serve!';

    } else {
      title.text = 'Opponent Serves!';
      subtitle.text = 'Here Comes the Serve!';
    }

    title.visible = true;
    subtitle.visible = true;

  } else if (gameState === GAME_STATE.DONE) {
    let winner = player1Score === 10 ? 1 : 2;
    let text = winner === playerNumber ? 'Win' : 'Lose'
    title.text = `You ${text}!`;
    subtitle.text = 'Press Enter to Play!';
    title.visible = true;
    subtitle.visible = true;

    // add another game state after done in which one user has accepted to play again, to entice the user to continue

  } else if (gameState === GAME_STATE.PLAY) {
    title.visible = false;
    subtitle.visible = false;

    // ball exits to the right (player 1 scores)
    if (playerNumber === 1 && ball.x - ball.width / 2 > WIDTH) {
      socket.emit(MESSAGE.ACTION, {
        action: GAME_ACTION.SCORE,
        player: 1,
      });
      ballOutSound.play();
      ball.reset();
      servingPlayer = undefined;
      gameState = GAME_STATE.SERVE_PLAY;
    }

    // ball exits to the left (player 2 scores)
    if (playerNumber === 2 && ball.x + ball.width / 2 < 0) {
      socket.emit(MESSAGE.ACTION, {
        action: GAME_ACTION.SCORE,
        player: 2,
      });
      ballOutSound.play();
      ball.reset();
      servingPlayer = undefined;
      gameState = GAME_STATE.SERVE_PLAY;
    }

  } else if (gameState === GAME_STATE.DONE) {
    let winner = player1Score === 10 ? 1 : 2;
    title.text = `Player ${winner} wins!`;
    subtitle.text = 'Press Enter to Play!';
    title.visible = true;
    subtitle.visible = true;
  }

  if (localPaddle) {
    if (keys.UP.isDown) {
      localPaddle.body.setVelocityY(-PADDLE_SPEED);
    } else if (keys.DOWN.isDown) {
      localPaddle.body.setVelocityY(PADDLE_SPEED);
    } else {
      localPaddle.body.setVelocityY(0);
    }

    localPaddleFrames++;
    emitPaddleMoved();
  }

  // enable robotic paddle for robotic player
  if (roboticPaddle && playerNumber == roboticPlayer) {
    let dy = Math.abs(localPaddle.y - ball.y)
    if (dy > 10) {
      let speed = PADDLE_SPEED * 1.2;
      let direction = localPaddle.y < ball.y ? 1 : -1;
      localPaddle.body.setVelocityY(speed * direction);
    } else {
      localPaddle.body.setVelocityY(0);
    }

    if (gameState == GAME_STATE.SERVE && servingPlayer == roboticPlayer) {
      roboticTimeoutFrames++;

      // the robot serves with a little delay
      if (roboticTimeoutFrames >= 100) {
        socket.emit(MESSAGE.ACTION, {
          action: GAME_ACTION.SERVE,
          player: playerNumber,
        });
        roboticTimeoutFrames = 0;
      }
    }
  }

  if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
    if (gameState === GAME_STATE.START) {
      gameState = GAME_STATE.START_SERVE;
      socket.emit(MESSAGE.READY, {
        player: playerNumber,
        ready: true
      });

    } else if (gameState === GAME_STATE.SERVE && servingPlayer == playerNumber) {
      socket.emit(MESSAGE.ACTION, {
        action: GAME_ACTION.SERVE,
        player: playerNumber,
      });

    } else if (gameState === GAME_STATE.DONE) {
      // todo implement
      // send message to other player that you want a rematch
      // wait for the other player to accept
      // reset scores and enter start state
    }
  }
}

// Handle game state changes coming from the server
function handleGameStateChange(data) {
  gameState = data.state;
  ball.reset();
  ball.setVelocity(0, 0);

  switch (data.state) {
    case GAME_STATE.START:
      playerNumber = data.number;
      player1Score = data.player1Score;
      player2Score = data.player2Score;
      player1ScoreText.text = data.player1Score;
      player2ScoreText.text = data.player2Score;
      localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
      remotePaddle = playerNumber === 2 ? paddleLeft : paddleRight;

      localPaddlepreviousY = localPaddle.y;
      break;

    case GAME_STATE.SERVE:
      playerNumber = data.number;
      servingPlayer = data.server; // only difference with state: start
      player1Score = data.player1Score;
      player2Score = data.player2Score;
      player1ScoreText.text = data.player1Score;
      player2ScoreText.text = data.player2Score;
      localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
      remotePaddle = playerNumber === 2 ? paddleLeft : paddleRight;

      localPaddlepreviousY = localPaddle.y;
      break;

    case GAME_STATE.PLAY:
      ball.setVelocity(data.ballVelocity, data.ballAngle);
      break;

    case GAME_STATE.DONE:
      player1Score = data.player1Score;
      player2Score = data.player2Score;
      player1ScoreText.text = data.player1Score;
      player2ScoreText.text = data.player2Score;
      break;
  }
}

// Handle incoming action messages from the other player
function handleRemoteAction(data) {
  msgCount++;

  switch (data.action) {
    case GAME_ACTION.MOVE_PADDLE:
      remotePaddle.y = data.y;
      break;
  }
}

// The FPS displayed is averaged over a number of frames to make it less jittery
function updateFps() {
  let averageFrameCount = 180;
  let now = Date.now();
  fpsTotal += Math.round(1000 / (now - time));
  fpsCount++;
  time = now;

  if (fpsCount >= averageFrameCount) {
    fpsText.text = 'FPS ' + Math.round(fpsTotal / fpsCount);

    // reset counters
    fpsCount = 0;
    fpsTotal = 0;
  }
}

// The MPS (messages per second) displayed is averaged over a number of frames to make it less jittery
function updateMps() {
  let threshold = 3 * 1000;
  let now = Date.now();

  if (now - msgTime >= threshold) {
    let averageMsgCount = Math.round(msgCount / threshold * 1000);
    mpsText.text = 'MPS ' + averageMsgCount;

    // reset counters
    msgTime = now;
    msgCount = 0;
  }
}

/**
 * Emits the current paddle position when it has changed by a significant amount.
 * 
 * Amount of change can be configured by changing the 2 thresholds
 */
function emitPaddleMoved() {
  let localPaddleDy = Math.abs(localPaddlepreviousY - localPaddle.y);
  if (localPaddleFrames >= localPaddleFrameThreshold && localPaddleDy >= localPaddleYThreshold) {
    msgCount++;
    socket.emit(MESSAGE.ACTION, {
      action: GAME_ACTION.MOVE_PADDLE,
      y: localPaddle.y
    });

    // reset counters
    localPaddleFrames = 0;
    localPaddlepreviousY = localPaddle.y;
  }
}

// Utility method for adding text objects
function addText(scene, x, y, size, text) {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: size + 'px',
    })
    .setOrigin(0.5);
}
