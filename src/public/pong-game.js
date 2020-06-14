import Texts from './assets/Texts.js';
import {addText} from './assets/texts/AbstractText.js';
import Paddle from './assets/Paddle.js';
import Ball from './assets/Ball.js';
import {GAME_ACTION, GAME_STATE, MESSAGE} from './constants.js';
import cfg from './config.js';
import {SocketMock} from './assets/SocketMock.js';

// configure the communications channel
let socket = cfg.ONLINE_ENABLED ? io() : new SocketMock();

// Phaser game config
new Phaser.Game({
    title: 'This is Pong!',
    version: 2,
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: cfg.GAME_WIDTH,
        height: cfg.GAME_HEIGHT,
        min: {
            width: 800,
            height: 800 * .6
        },
        max: {
            width: cfg.GAME_WIDTH,
            height: cfg.GAME_HEIGHT
        }
    },
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
    },
    banner: {
        background: ['#D32754', '#2286D8', '#FEA339', '#FD5F3F']
    }
});

// game objects and input configuration
let paddleLeft, paddleRight, ball;    // sprites
let wallHitSound, ballOutSound;       // sounds
let gameTune;                         // music
let texts, fpsText, mpsText, latText; // texts
let keys;                             // key bindings

// game state variables
let gameState = GAME_STATE.CONNECT;
let gameTime;
let playerNumber;
let servingPlayer;
let localPaddle;
let remotePaddle;
let robotEnabled = cfg.ROBOT_ENABLED;
let perfMonEnabled = cfg.PERF_MON_ENABLED;
let onlineEnabled = cfg.ONLINE_ENABLED;

const backgroundTiles = [];
const backgroundTints = [];

let paddleHits = 0;
let paddleHitTime = 0;
let flightTimeDifference = 0;
let flightTimeCorrected = false;
const FLIGHT_TIME_DIFF_THRESHOLD = 50;

const ROBOTIC_PLAYER_NUMBER = 2;
let roboticTimeoutFrameCount = 0;

let localPaddleFrames = 0;
let localPaddlePreviousY;
const LOCAL_PADDLE_Y_THRESHOLD = 5; // dy in pixels between two paddle positions before a change is detected. Lower values generate more messages
const LOCAL_PADDLE_FRAMES_THRESHOLD = 1; // the amount of frames that dy must live before a change is detected. Lower values generate more messages

// frame rate
const FPS_FRAMES_THRESHOLD = 180; // average the fps calculation over this amount of frames
let fpsTime = 0;
let fpsCount = 0;

// messages rate (message per second)
const MPS_TIME_THRESHOLD = 3000; // average the mps calculation over this amount of milliseconds
let mpsTime = 0;
let mpsCount = 0;

// network latency (milliseconds)
const LAT_COUNT_THRESHOLD = 3; // average the latency calculation over this amount of measurements
const LAT_INTERVAL = 1; // number of seconds between latency measurements
let latTime = 0;
let latTotal = 0;
let latCount = 0;

//-- Called by the game engine and used for loading assets over the internet
function preload() {
    // set background color
    this.cameras.main.backgroundColor.setTo(40, 45, 52, 255);

    // images
    this.load.image('ball', 'assets/images/ball.png');
    this.load.image('paddle-left', 'assets/images/paddle-left.png');
    this.load.image('paddle-right', 'assets/images/paddle-right.png');
    this.load.image('background', 'assets/images/background.png');

    // sounds
    this.load.audio('game-tune', 'assets/audio/Another_beek_beep_beer_please.mp3');
    this.load.audio('paddle-hit', 'assets/audio/paddle-hit.mp3');
    this.load.audio('wall-hit', 'assets/audio/wall-hit.mp3');
    this.load.audio('ball-out', 'assets/audio/ball-out.mp3');
}

//-- Called by the game engine
function create() {
    const screenCenterX = Math.round(this.cameras.main.worldView.x + this.cameras.main.width / 2);
    const screenCenterY = Math.round(this.cameras.main.worldView.y + this.cameras.main.height / 2);

    // sounds
    wallHitSound = this.sound.add('wall-hit');
    ballOutSound = this.sound.add('ball-out');

    // music
    gameTune = this.sound.add('game-tune', {
        loop: true,
        volume: .5
    });

    // create background
    const tileSize = 384;
    const tilesHorizontal = Math.ceil(cfg.GAME_WIDTH / tileSize);
    for (let i = 0; i < tilesHorizontal; i++) {
        const tilesVertical = Math.ceil(cfg.GAME_HEIGHT / tileSize);
        for (let j = 0; j < tilesVertical; j++) {
            backgroundTiles.push(this.add.image(i * tileSize, j * tileSize, 'background')
                .setOrigin(0).setTint(0x2286D8));
        }
    }
    backgroundTints.push(0x86d822, 0xd87422, 0xd8cf22, 0x2286D8);

    // texts
    texts = new Texts(this, cfg.GAME_HEIGHT, screenCenterX);
    texts.updateOnline(onlineEnabled);

    // create paddles
    paddleLeft = new Paddle(this, 30, 120, 'paddle-left');
    paddleRight = new Paddle(this, cfg.GAME_WIDTH - 30, cfg.GAME_HEIGHT - 120, 'paddle-right');

    // create ball and add the paddles as colliders
    const paddleHitSound = this.sound.add('paddle-hit');
    ball = new Ball(this, screenCenterX, screenCenterY, 'ball');
    ball.addCollider(paddleLeft, paddleHitSound, emitPaddleHit);
    ball.addCollider(paddleRight, paddleHitSound, emitPaddleHit);

    // let objects exit left and right of screen
    this.physics.world.setBoundsCollision(false, false, true, true);
    this.physics.world.on('worldbounds', () => wallHitSound.play()); // is emitted by the ball

    // keyboard mappings
    keys = this.input.keyboard.addKeys('W, S, UP, DOWN, ENTER, M, P, O, H');

    // font settings for the performance monitor
    const perfFont = 'PressStart2P';
    const perfFontColor = '#00ff00aa';
    const perfXOffset = 10;

    // fps monitor
    fpsText = addText(this, perfXOffset, 10, 8, 'FPS 0', perfFont, perfFontColor).setOrigin(0).setDepth(1);
    fpsText.visible = perfMonEnabled;

    // messages monitor
    mpsText = addText(this, perfXOffset, 20, 8, 'MPS 0', perfFont, perfFontColor).setOrigin(0).setDepth(1);
    mpsText.visible = perfMonEnabled;

    // latency monitor
    latText = addText(this, perfXOffset, 30, 8, 'LAT 0', perfFont, perfFontColor).setOrigin(0).setDepth(1);
    latText.visible = perfMonEnabled;

    openSocketAndConfigureEvents();
}

//-- Called by the game engine for every frame drawn to the screen
function update(time) {
    gameTime = time;

    updateBallStatus(this);
    updatePaddles();
    updateKeyState();

    // enable robotic paddle for robotic player
    updateRobot();

    // update performance statistics
    updateStats();
}

// Registers ball flight sync issues and when one of the players scores a point
function updateBallStatus(scene) {
    // Correct flight time differences between the players by slowing down the fastest one
    if (flightTimeDifference > FLIGHT_TIME_DIFF_THRESHOLD && !flightTimeCorrected) {
        scene.physics.pause();
        scene.time.addEvent({
            delay: FLIGHT_TIME_DIFF_THRESHOLD * 2,
            callback: () => {
                scene.physics.resume();
            },
            callbackScope: scene
        });
        flightTimeCorrected = true;
    }

    // Register ball leaving the playing area
    if (gameState === GAME_STATE.PLAY) {
        // ball exits to the right (player 1 scores)
        if (ball.x - ball.width / 2 > cfg.GAME_WIDTH) {
            emitPlayerScored(1);
        }

        // ball exits to the left (player 2 scores)
        if (ball.x + ball.width / 2 < 0) {
            emitPlayerScored(2);
        }
    }
}

function updatePaddles() {

    // when playing online the player can use both W/S and up/down to control the local paddle
    if (localPaddle && onlineEnabled) {
        // react to keyboard presses
        if (keys.UP.isDown || keys.W.isDown) {
            localPaddle.body.setVelocityY(-cfg.PADDLE_SPEED);
        } else if (keys.DOWN.isDown || keys.S.isDown) {
            localPaddle.body.setVelocityY(cfg.PADDLE_SPEED);
        } else {
            localPaddle.body.setVelocityY(0);
        }

        // emit paddle movement
        localPaddleFrames++;
        emitPaddleMoved();
    }

    // when playing offline W/S are assigned to the left paddle and up/down to the right paddle
    if (!onlineEnabled) {
        // react to keyboard presses
        if (keys.W.isDown) {
            paddleLeft.body.setVelocityY(-cfg.PADDLE_SPEED);
        } else if (keys.S.isDown) {
            paddleLeft.body.setVelocityY(cfg.PADDLE_SPEED);
        } else {
            paddleLeft.body.setVelocityY(0);
        }

        // when the robot is enabled up/down are not used
        if (!robotEnabled) {
            if (keys.UP.isDown) {
                paddleRight.body.setVelocityY(-cfg.PADDLE_SPEED);
            } else if (keys.DOWN.isDown) {
                paddleRight.body.setVelocityY(cfg.PADDLE_SPEED);
            } else {
                paddleRight.body.setVelocityY(0);
            }
        }
    }
}

function updateKeyState() {
    if (gameState !== GAME_STATE.PLAY) {
        // [P] toggles the performance monitor on or off
        if (Phaser.Input.Keyboard.JustDown(keys.P)) {
            perfMonEnabled = !perfMonEnabled;
        }

        // [M] toggles the music on or off
        if (Phaser.Input.Keyboard.JustDown(keys.M)) {
            gameTune.isPlaying ? gameTune.pause() : gameTune.play();
        }

        // [O] toggles online game play on or off
        if (Phaser.Input.Keyboard.JustDown(keys.O)) {
            onlineEnabled = !onlineEnabled;
            openSocketAndConfigureEvents();
        }

        // [H] toggles the help panel on or off
        if (Phaser.Input.Keyboard.JustDown(keys.H)) {
            texts.toggleHelp();
        }
    }

    if (texts.isHelpOpen()) {
        return;
    }

    // [ENTER] advances the player through different the game states
    if (Phaser.Input.Keyboard.JustDown(keys.ENTER)) {
        switch (gameState) {
            case GAME_STATE.START:
            // same as state done
            case GAME_STATE.DONE:
                emitPlayerReady(playerNumber);
                break;

            case GAME_STATE.SERVE:
                if (servingPlayer === playerNumber || !onlineEnabled) {
                    emitMessage(MESSAGE.ACTION, {
                        action: GAME_ACTION.SERVE,
                        player: playerNumber
                    });
                }
                break;
        }
    }
}

// Handle game state changes from the server
function handleGameStateMessage(data) {
    gameState = data.state;
    ball.reset();

    texts.updateGameState(data, playerNumber);

    switch (data.state) {
        case GAME_STATE.WAIT:
            playerNumber = data.number;
            localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
            break;

        case GAME_STATE.START:
            assignPaddles(data);
            robotEnabled = data.robotEnabled;
            break;

        case GAME_STATE.SERVE:
            assignPaddles(data);
            servingPlayer = data.server;
            break;

        case GAME_STATE.PLAY:
            paddleHits = 0;
            paddleHitTime = 0;
            ball.setVelocity(data.ballVelocity, data.ballAngle);
            ball.setAngleChange(data.angleChange);
            break;
    }

    function assignPaddles(data) {
        playerNumber = data.number;
        localPaddle = playerNumber === 1 ? paddleLeft : paddleRight;
        remotePaddle = playerNumber === 2 ? paddleLeft : paddleRight;
        document.getElementsByTagName('title')[0].innerText = `This is Pong - Player ${playerNumber}`;

        localPaddlePreviousY = localPaddle.y;
    }
}

// Handle incoming action messages from the server
function handleRemoteActionMessage(data) {
    mpsCount++;

    switch (data.action) {
        case GAME_ACTION.PADDLE_MOVE:
            remotePaddle.y = data.y;
            break;

        case GAME_ACTION.PADDLE_HIT:
            ball.setAngleChange(data.angleChange);

            const localFlight = data.flightData.find(flight => flight.player === playerNumber);
            const remoteFlight = data.flightData.find(flight => flight.player !== playerNumber);

            if (localFlight && remoteFlight) {
                if (localFlight.flightCorrected || remoteFlight.flightCorrected) {
                    flightTimeCorrected = false;
                    flightTimeDifference = 0;
                } else {
                    flightTimeDifference += remoteFlight.flightTime - localFlight.flightTime;
                }
            }

            break;
    }
}

/**
 * Emits the current paddle position when it has changed by a significant amount.
 *
 * Amount of change can be configured by changing the thresholds: LOCAL_PADDLE_FRAMES_THRESHOLD and LOCAL_PADDLE_Y_THRESHOLD
 */
function emitPaddleMoved() {
    let localPaddleDy = Math.abs(localPaddlePreviousY - localPaddle.y);
    if (localPaddleFrames >= LOCAL_PADDLE_FRAMES_THRESHOLD && localPaddleDy >= LOCAL_PADDLE_Y_THRESHOLD) {
        emitMessage(MESSAGE.ACTION, {
            action: GAME_ACTION.PADDLE_MOVE,
            player: playerNumber,
            y: localPaddle.y
        });

        // reset counters
        localPaddleFrames = 0;
        localPaddlePreviousY = localPaddle.y;
    }
}

function emitPaddleHit() {
    // change background color
    const nextTint = backgroundTints.shift();
    backgroundTiles.forEach(tile => tile.setTint(nextTint));
    backgroundTints.push(nextTint);

    paddleHits++;
    const flightTime = paddleHitTime === 0 ? 0 : gameTime - paddleHitTime;
    paddleHitTime = gameTime;

    emitMessage(MESSAGE.ACTION, {
        action: GAME_ACTION.PADDLE_HIT,
        currentAngle: ball.body.velocity.angle() * Phaser.Math.RAD_TO_DEG,
        flightData: {
            player: playerNumber,
            flightNumber: paddleHits,
            flightTime: flightTime,
            flightCorrected: flightTimeCorrected
        }
    });
}

function emitPlayerReady(playerNumber) {
    gameState = GAME_STATE.START_SERVE;
    handleGameStateMessage({state: gameState});
    emitMessage(MESSAGE.ACTION, {
        action: GAME_ACTION.READY,
        player: playerNumber
    });
}

// Emit a message and reset game state
function emitPlayerScored(player) {
    ballOutSound.play();
    ball.setVelocity(0, 0);
    servingPlayer = undefined;

    if (playerNumber === player || !onlineEnabled) {
        emitMessage(MESSAGE.ACTION, {
            action: GAME_ACTION.SCORE,
            player: player
        });
    }
}

function emitMessage(type, data) {
    mpsCount++;
    socket.emit(type, data);
}

function updateStats() {
    if (perfMonEnabled) {
        updateFps();
        updateMps();
        updateLat();
    } else {
        fpsText.visible = false;
        mpsText.visible = false;
        latText.visible = false;
    }
}

// The FPS displayed is averaged over a number of frames to make it less jittery
function updateFps() {
    fpsText.visible = perfMonEnabled;
    fpsCount++;

    if (fpsCount >= FPS_FRAMES_THRESHOLD) {
        fpsText.text = 'FPS ' + Math.round(fpsCount / (gameTime - fpsTime) * 1000);

        // reset state
        fpsCount = 0;
        fpsTime = gameTime;
    }
}

// The MPS (messages per second) displayed is averaged over a number of frames to make it less jittery
function updateMps() {
    mpsText.visible = perfMonEnabled;
    const timeDiff = gameTime - mpsTime;

    if (timeDiff >= MPS_TIME_THRESHOLD) {
        const averageMsgCount = Math.round(mpsCount / timeDiff * 1000);
        mpsText.text = 'MPS ' + averageMsgCount;

        // reset counters
        mpsTime = gameTime;
        mpsCount = 0;
    }
}

// The LAT (latency) displayed is averaged over a number of messages that are send at a certain interval
function updateLat() {
    latText.visible = perfMonEnabled;

    // update the latency report when the threshold expires
    if (latCount >= LAT_COUNT_THRESHOLD) {
        latText.text = 'LAT ' + Math.round(latTotal / latCount);
        latTotal = 0;
        latCount = 0;
    }

    // measure latency when the interval expires
    const now = Date.now();
    if (now >= latTime + (LAT_INTERVAL * 1000)) {
        emitMessage(MESSAGE.LATENCY, {
            time: now
        });
        latTime = now;
    }
}

// Code for controlling the robotic player
function updateRobot() {
    if (!robotEnabled || (onlineEnabled && playerNumber !== ROBOTIC_PLAYER_NUMBER)) {
        return;
    }

    // move the paddle towards the ball
    const dy = Math.abs(localPaddle.y - ball.y);
    if (dy > 10) {
        const speed = cfg.PADDLE_SPEED * .9;
        const direction = localPaddle.y < ball.y ? 1 : -1;
        localPaddle.body.setVelocityY(speed * direction);
    } else {
        localPaddle.body.setVelocityY(0);
    }

    // simulate pressing <ENTER>
    switch (gameState) {
        case GAME_STATE.START:
        case GAME_STATE.DONE:
            emitPlayerReady(playerNumber);
            break;

        case GAME_STATE.SERVE:
            if (playerNumber === servingPlayer) {
                roboticTimeoutFrameCount++;

                // the robot serves with a little delay
                if (roboticTimeoutFrameCount >= 100) {
                    emitMessage(MESSAGE.ACTION, {
                        action: GAME_ACTION.SERVE,
                        player: playerNumber
                    });
                    roboticTimeoutFrameCount = 0;
                }
            }
            break;
    }
}

function openSocketAndConfigureEvents() {
    if (onlineEnabled) {
        socket = io({autoConnect: false});
    } else {
        if (socket.connected) {
            socket.disconnect();
        }
        socket = new SocketMock();
    }

    // react to game state changes
    socket.on(MESSAGE.GAME_STATE, (data) => handleGameStateMessage(data));

    // react to remote player actions
    socket.on(MESSAGE.ACTION, (data) => handleRemoteActionMessage(data));

    // react to connection errors
    socket.on(MESSAGE.CONNECT_ERROR, () => gameState = GAME_STATE.CONNECT);

    // react to latency status messages
    socket.on(MESSAGE.LATENCY, (data) => {
        latTotal += Date.now() - data.time;
        latCount++;
    });

    texts.updateOnline(onlineEnabled);
    socket.open();
}