import Texts, { addText } from './texts.js';
import Paddle, { PADDLE_SPEED } from './paddle.js';
import Ball from './ball.js';
import { GAME_STATE, GAME_ACTION, MESSAGE } from './constants.js';
import cfg from './config.js';

// open the communications channel
const socket = io();

// Phaser game config
new Phaser.Game({
  type: Phaser.AUTO,
  width: cfg.GAME_WIDTH,
  height: cfg.GAME_HEIGHT,
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
let texts, fpsText, mpsText; // texts
let paddleLeft, paddleRight, ball; // moving parts
let wallHitSound, ballOutSound; // sounds
let keys; // key bindings

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

let roboticPlayer = 2;
let roboticTimeoutFrames = 0;

let localPaddleFrames = 0;
let localPaddlePreviousY;
let localPaddleYThreshold = 15; // dy in pixels between two paddle positions before a change is detected. Lower values generate more messages
let localPaddleFrameThreshold = 2; // the amount of frames that dy must live before a change is detected. Lower values generate more messages

//-- Called by the game engine and used for loading assets over the internet
function preload() {
  // set background color
  this.cameras.main.backgroundColor.setTo(40, 45, 52, 255);

  // sounds
  this.load.audio('paddle-hit', 'assets/paddle-hit.mp3');
  this.load.audio('wall-hit', 'assets/wall-hit.mp3');
  this.load.audio('ball-out', 'assets/ball-out.mp3');
}

//-- Called by the game engine
function create() {
  const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
  const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

  // sounds
  wallHitSound = this.sound.add('wall-hit');
  ballOutSound = this.sound.add('ball-out');

  // texts
  texts = new Texts(this, cfg.GAME_HEIGHT, screenCenterX);

  // create paddles
  paddleLeft = new Paddle(this, 30, 120);
  paddleRight = new Paddle(this, cfg.GAME_WIDTH - 30, cfg.GAME_HEIGHT - 120);

  // create ball and add the paddles as colliders
  let paddleHitSound = this.sound.add('paddle-hit');
  ball = new Ball(this, screenCenterX, screenCenterY);
  ball.addCollider(paddleLeft, paddleHitSound, emitPaddleHit);
  ball.addCollider(paddleRight, paddleHitSound, emitPaddleHit);

  // let objects exit left and right of screen
  this.physics.world.setBoundsCollision(false, false, true, true);
  this.physics.world.on('worldbounds', () => wallHitSound.play()); // is emitted by the ball

  // keyboard mappings
  keys = this.input.keyboard.addKeys('UP, DOWN, ENTER');

  // fps monitor
  fpsText = addText(this, 10, 10, 8, 'FPS 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  fpsText.visible = cfg.FPS_LOGGER;

  // messages monitor (message per second)
  mpsText = addText(this, 10, 20, 8, 'MPS 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  mpsText.visible = cfg.MPS_LOGGER;

  // react to game state changes
  socket.on(MESSAGE.GAME_STATE, (data) => processGameStateMessage(data));

  // react to remote player actions
  socket.on(MESSAGE.ACTION, (data) => processRemoteActionMessage(data));

  // react to connection errors
  socket.on(MESSAGE.CONNECT_ERROR, () => gameState = GAME_STATE.CONNECT);
}

//-- Called by the game engine for every frame drawn to the screen
function update() {
  // update performance statistics
  if (cfg.FPS_LOGGER) updateFps();
  if (cfg.MPS_LOGGER) updateMps();

  // check state of ball; did anyone scored?
  updateBallStatus();

  // update texts
  texts.update(gameState, playerNumber, servingPlayer);

  // update local paddle
  updateLocalPaddle();

  // enable robotic paddle for robotic player
  if (cfg.ROBOT_ENABLED && playerNumber == roboticPlayer) {
    updateRobot();
  }

  updateEnterKeyState();
}

function updateEnterKeyState() {
  if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
    if (gameState === GAME_STATE.START) {
      gameState = GAME_STATE.START_SERVE;
      ball.reset();

      socket.emit(MESSAGE.READY, {
        player: playerNumber,
        ready: true
      });
    }

    else if (gameState === GAME_STATE.SERVE && servingPlayer == playerNumber) {
      socket.emit(MESSAGE.ACTION, {
        action: GAME_ACTION.SERVE,
        player: playerNumber,
      });
    }

    else if (gameState === GAME_STATE.DONE) {
      gameState = GAME_STATE.START_SERVE;
      ball.reset();

      socket.emit(MESSAGE.READY, {
        player: playerNumber,
        ready: true
      });
    }
  }
}

function updateLocalPaddle() {
  if (localPaddle) {
    // react to keyboard presses
    if (keys.UP.isDown) {
      localPaddle.body.setVelocityY(-PADDLE_SPEED);
    }
    else if (keys.DOWN.isDown) {
      localPaddle.body.setVelocityY(PADDLE_SPEED);
    }
    else {
      localPaddle.body.setVelocityY(0);
    }

    // emit paddle movement
    localPaddleFrames++;
    emitPaddleMoved();
  }
}

// Handle game state changes coming from the server
function processGameStateMessage(data) {
  gameState = data.state;
  ball.reset();
  ball.setVelocity(0, 0);

  switch (data.state) {
    case GAME_STATE.START:
      playerNumber = data.number;
      texts.setPlayer1Score(data.player1Score);
      texts.setPlayer2Score(data.player2Score);
      localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
      remotePaddle = playerNumber === 2 ? paddleLeft : paddleRight;

      localPaddlePreviousY = localPaddle.y;
      break;

    case GAME_STATE.SERVE:
      playerNumber = data.number;
      servingPlayer = data.server; // only difference with state: start
      texts.setPlayer1Score(data.player1Score);
      texts.setPlayer2Score(data.player2Score);
      localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
      remotePaddle = playerNumber === 2 ? paddleLeft : paddleRight;

      localPaddlePreviousY = localPaddle.y;
      break;

    case GAME_STATE.PLAY:
      ball.setVelocity(data.ballVelocity, data.ballAngle);
      break;

    case GAME_STATE.DONE:
      texts.setPlayer1Score(data.player1Score);
      texts.setPlayer2Score(data.player2Score);
      break;
  }
}

// Handle incoming action messages from the other player
function processRemoteActionMessage(data) {
  msgCount++;

  switch (data.action) {
    case GAME_ACTION.PADDLE_MOVE:
      remotePaddle.y = data.y;
      break;

    case GAME_ACTION.PADDLE_HIT:
      ball.setAngleChange(data.angleChange);
      break;
  }
}

/**
 * Emits the current paddle position when it has changed by a significant amount.
 * 
 * Amount of change can be configured by changing the 2 thresholds
 */
function emitPaddleMoved() {
  let localPaddleDy = Math.abs(localPaddlePreviousY - localPaddle.y);
  if (localPaddleFrames >= localPaddleFrameThreshold && localPaddleDy >= localPaddleYThreshold) {
    msgCount++;
    socket.emit(MESSAGE.ACTION, {
      action: GAME_ACTION.PADDLE_MOVE,
      y: localPaddle.y
    });

    // reset counters
    localPaddleFrames = 0;
    localPaddlePreviousY = localPaddle.y;
  }
}

function emitPaddleHit() {
  socket.emit(MESSAGE.ACTION, {
    action: GAME_ACTION.PADDLE_HIT,
    currentAngle: ball.body.velocity.angle()
  });
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

// Registers when one of the players scores a point
function updateBallStatus() {
  if (gameState === GAME_STATE.PLAY) {
    // ball exits to the right (player 1 scores)
    if (playerNumber === 1 && ball.x - ball.width / 2 > cfg.GAME_WIDTH) {
      playerScored(1);
    }

    // ball exits to the left (player 2 scores)
    if (playerNumber === 2 && ball.x + ball.width / 2 < 0) {
      playerScored(2);
    }
  }
}

// Emit a message and reset game state
function playerScored(playerNumber) {
  socket.emit(MESSAGE.ACTION, {
    action: GAME_ACTION.SCORE,
    player: playerNumber,
  });
  ballOutSound.play();
  ball.reset();
  servingPlayer = undefined;
  gameState = GAME_STATE.SERVE_PLAY;
}

// Mainly used while debugging the game
function updateRobot() {

  // move the paddle towards the ball
  let dy = Math.abs(localPaddle.y - ball.y)
  if (dy > 10) {
    let speed = PADDLE_SPEED * 1.2;
    let direction = localPaddle.y < ball.y ? 1 : -1;
    localPaddle.body.setVelocityY(speed * direction);
  } else {
    localPaddle.body.setVelocityY(0);
  }

  // handle game state changes 
  if (gameState === GAME_STATE.START) {
    gameState = GAME_STATE.START_SERVE;
    socket.emit(MESSAGE.READY, {
      player: playerNumber,
      ready: true
    });

  } else if (gameState == GAME_STATE.SERVE && servingPlayer == roboticPlayer) {
    roboticTimeoutFrames++;

    // the robot serves with a little delay
    if (roboticTimeoutFrames >= 100) {
      socket.emit(MESSAGE.ACTION, {
        action: GAME_ACTION.SERVE,
        player: playerNumber,
      });
      roboticTimeoutFrames = 0;
    }

  } else if (gameState == GAME_STATE.DONE && servingPlayer == roboticPlayer) {
    gameState = GAME_STATE.START_SERVE;
    socket.emit(MESSAGE.READY, {
      player: playerNumber,
      ready: true
    });
  }
}
