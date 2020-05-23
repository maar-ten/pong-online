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
let texts, fpsText, mpsText, latText; // texts
let paddleLeft, paddleRight, ball; // moving parts
let wallHitSound, ballOutSound; // sounds
let keys; // key bindings

// frame rate
let time = Date.now();
let fpsTotal = 0;
let fpsCount = 0;

// messages rate (message per second)
let mpsTime = Date.now();
let mpsCount = 0;

// network latency (milliseconds)
let latencyTime = Date.now();
let latencyInterval = 1; // in seconds
let latencyTotal = 0;
let latencyCount = 0;

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
let localPaddleYThreshold = 5; // dy in pixels between two paddle positions before a change is detected. Lower values generate more messages
let localPaddleFrameThreshold = 1; // the amount of frames that dy must live before a change is detected. Lower values generate more messages

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
  fpsText.visible = cfg.PERF_MON;

  // messages monitor
  mpsText = addText(this, 10, 20, 8, 'MPS 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  mpsText.visible = cfg.PERF_MON;

  // latency monitor
  latText = addText(this, 10, 30, 8, 'LAT 0').setOrigin(0).setColor('#00ff00aa').setDepth(1);
  latText.visible = cfg.PERF_MON;
  socket.on(MESSAGE.LATENCY, (data) => {
    latencyTotal += Date.now() - data.time;
    latencyCount++;
  });

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
  if (cfg.PERF_MON) updateStats();

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
    switch (gameState) {
      case GAME_STATE.START:
      // same as state done
      case GAME_STATE.DONE:
        emitPlayerReady(playerNumber);
        break;

      case GAME_STATE.SERVE:
        if (servingPlayer == playerNumber) {
          socket.emit(MESSAGE.ACTION, {
            action: GAME_ACTION.SERVE,
            player: playerNumber
          });
        }
        break;
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
    case GAME_STATE.WAIT:
      playerNumber = data.number;
      localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
      break;

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
  mpsCount++;

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
 * Amount of change can be configured by changing the thresholds: localPaddleFrameThreshold and localPaddleYThreshold
 */
function emitPaddleMoved() {
  let localPaddleDy = Math.abs(localPaddlePreviousY - localPaddle.y);
  if (localPaddleFrames >= localPaddleFrameThreshold && localPaddleDy >= localPaddleYThreshold) {
    mpsCount++;
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

function emitPlayerReady(playerNumber) {
  gameState = GAME_STATE.START_SERVE;
  socket.emit(MESSAGE.READY, {
    player: playerNumber,
    ready: true
  });
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

function updateStats() {
  updateFps();
  updateMps();
  updateLat();
}

// The FPS displayed is averaged over a number of frames to make it less jittery
function updateFps() {
  const averageFrameCount = 180;
  const now = Date.now();
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
  const threshold = 3 * 1000;
  const now = Date.now();

  if (now - mpsTime >= threshold) {
    const averageMsgCount = Math.round(mpsCount / threshold * 1000);
    mpsText.text = 'MPS ' + averageMsgCount;

    // reset counters
    mpsTime = now;
    mpsCount = 0;
  }
}

// The LAT (latency) displayed is measured for a single message at a set interval
function updateLat() {
  if (latencyCount >= 3) {
    latText.text = 'LAT: ' + Math.round(latencyTotal / latencyCount);
    latencyTotal = 0;
    latencyCount = 0;
  }

  const now = Date.now();
  if (now >= latencyTime + (latencyInterval * 1000)) {
    socket.emit(MESSAGE.LATENCY, {
      time: now
    });
    latencyTime = now;
  }
}

// Code for controlling one of the paddles automatically
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
  switch (gameState) {
    case GAME_STATE.START:
      emitPlayerReady(playerNumber);
      break;

    case GAME_STATE.SERVE:
      if (servingPlayer == roboticPlayer) {
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
      break;

    case GAME_STATE.DONE:
      if (servingPlayer == roboticPlayer) {
        emitPlayerReady(playerNumber);
      }
      break;
  }
}
