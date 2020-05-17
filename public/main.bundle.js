/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/main.js":
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

// import Paddle from 'paddle';

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
        fontFamily: '"04b03"',
        fontSize: '48px'
    }).setOrigin(.5).setVisible(false);

    subtitle = this.add.text(screenCenterX, HEIGHT / 10 + 48, 'Press Enter to Play!', {
        fontFamily: '"04b03"',
        fontSize: '24px'
    }).setOrigin(.5).setVisible(false);

    player1ScoreText = this.add.text(screenCenterX - 100, HEIGHT / 3, player1Score, {
        fontFamily: '"04b03"',
        fontSize: '80px'
    }).setOrigin(.5);

    player2ScoreText = this.add.text(screenCenterX + 100, HEIGHT / 3, player2Score, {
        fontFamily: '"04b03"',
        fontSize: '80px'
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7O1FBR0E7UUFDQTs7Ozs7Ozs7Ozs7O0FDbEZBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxLQUFLO0FBQ0w7QUFDQSwrQkFBK0IsY0FBYztBQUM3Qzs7QUFFQTtBQUNBOztBQUVBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsS0FBSztBQUNMO0FBQ0EsK0JBQStCLE9BQU87QUFDdEM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCIvXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vc3JjL21haW4uanNcIik7XG4iLCIvLyBpbXBvcnQgUGFkZGxlIGZyb20gJ3BhZGRsZSc7XHJcblxyXG5jb25zdCBXSURUSCA9IDEyODBcclxuY29uc3QgSEVJR0hUID0gNzY4O1xyXG5jb25zdCBQQURETEVfU1BFRUQgPSAxMDtcclxuY29uc3QgUEFERExFX0hFSUdIVCA9IDgwO1xyXG5jb25zdCBQQURETEVfV0lEVEggPSAxNjtcclxuY29uc3QgQkFMTF9XSURUSCA9IDE2O1xyXG5cclxubmV3IFBoYXNlci5HYW1lKHtcclxuICAgIHR5cGU6IFBoYXNlci5BVVRPLFxyXG4gICAgd2lkdGg6IFdJRFRILFxyXG4gICAgaGVpZ2h0OiBIRUlHSFQsXHJcbiAgICBwaHlzaWNzOiB7XHJcbiAgICAgICAgZGVmYXVsdDogJ2FyY2FkZScsXHJcbiAgICAgICAgYXJjYWRlOiB7XHJcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzY2VuZToge1xyXG4gICAgICAgIHByZWxvYWQ6IHByZWxvYWQsXHJcbiAgICAgICAgY3JlYXRlOiBjcmVhdGUsXHJcbiAgICAgICAgdXBkYXRlOiB1cGRhdGVcclxuICAgIH1cclxufSk7XHJcblxyXG5sZXQgZ2FtZVN0YXRlID0gJ3N0YXJ0JztcclxubGV0IHNjcmVlbkNlbnRlclg7XHJcbmxldCBzY3JlZW5DZW50ZXJZO1xyXG5sZXQgdGl0bGU7XHJcbmxldCBzdWJ0aXRsZTtcclxubGV0IHBsYXllcjFTY29yZVRleHQ7XHJcbmxldCBwbGF5ZXIyU2NvcmVUZXh0O1xyXG5sZXQgcGxheWVyMVNjb3JlID0gMDtcclxubGV0IHBsYXllcjJTY29yZSA9IDA7XHJcbmxldCBwYWRkbGUxO1xyXG5sZXQgcGFkZGxlMjtcclxubGV0IGJhbGw7XHJcbmxldCBiYWxsZHg7XHJcbmxldCBiYWxsZHk7XHJcbmxldCBrZXlzO1xyXG5sZXQgc2VydmluZ1BsYXllcjtcclxuXHJcbmZ1bmN0aW9uIHByZWxvYWQoKSB7XHJcbiAgICB0aGlzLmNhbWVyYXMubWFpbi5iYWNrZ3JvdW5kQ29sb3Iuc2V0VG8oNDAsIDQ1LCA1MiwgMjU1KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlKCkge1xyXG4gICAgc2NyZWVuQ2VudGVyWCA9IHRoaXMuY2FtZXJhcy5tYWluLndvcmxkVmlldy54ICsgdGhpcy5jYW1lcmFzLm1haW4ud2lkdGggLyAyO1xyXG4gICAgc2NyZWVuQ2VudGVyWSA9IHRoaXMuY2FtZXJhcy5tYWluLndvcmxkVmlldy55ICsgdGhpcy5jYW1lcmFzLm1haW4uaGVpZ2h0IC8gMjtcclxuXHJcbiAgICB0aXRsZSA9IHRoaXMuYWRkLnRleHQoc2NyZWVuQ2VudGVyWCwgSEVJR0hUIC8gMTAsICdXZWxjb21lIHRvIFBvbmchJywge1xyXG4gICAgICAgIGZvbnRGYW1pbHk6ICdcIjA0YjAzXCInLFxyXG4gICAgICAgIGZvbnRTaXplOiAnNDhweCdcclxuICAgIH0pLnNldE9yaWdpbiguNSkuc2V0VmlzaWJsZShmYWxzZSk7XHJcblxyXG4gICAgc3VidGl0bGUgPSB0aGlzLmFkZC50ZXh0KHNjcmVlbkNlbnRlclgsIEhFSUdIVCAvIDEwICsgNDgsICdQcmVzcyBFbnRlciB0byBQbGF5IScsIHtcclxuICAgICAgICBmb250RmFtaWx5OiAnXCIwNGIwM1wiJyxcclxuICAgICAgICBmb250U2l6ZTogJzI0cHgnXHJcbiAgICB9KS5zZXRPcmlnaW4oLjUpLnNldFZpc2libGUoZmFsc2UpO1xyXG5cclxuICAgIHBsYXllcjFTY29yZVRleHQgPSB0aGlzLmFkZC50ZXh0KHNjcmVlbkNlbnRlclggLSAxMDAsIEhFSUdIVCAvIDMsIHBsYXllcjFTY29yZSwge1xyXG4gICAgICAgIGZvbnRGYW1pbHk6ICdcIjA0YjAzXCInLFxyXG4gICAgICAgIGZvbnRTaXplOiAnODBweCdcclxuICAgIH0pLnNldE9yaWdpbiguNSk7XHJcblxyXG4gICAgcGxheWVyMlNjb3JlVGV4dCA9IHRoaXMuYWRkLnRleHQoc2NyZWVuQ2VudGVyWCArIDEwMCwgSEVJR0hUIC8gMywgcGxheWVyMlNjb3JlLCB7XHJcbiAgICAgICAgZm9udEZhbWlseTogJ1wiMDRiMDNcIicsXHJcbiAgICAgICAgZm9udFNpemU6ICc4MHB4J1xyXG4gICAgfSkuc2V0T3JpZ2luKC41KTtcclxuXHJcbiAgICBwYWRkbGUxID0gdGhpcy5hZGQucmVjdGFuZ2xlKDMwLCAxMjAsIFBBRERMRV9XSURUSCwgUEFERExFX0hFSUdIVCwgMHhmZmZmZmYpLnNldE9yaWdpbiguNSk7XHJcbiAgICBwYWRkbGUyID0gdGhpcy5hZGQucmVjdGFuZ2xlKFdJRFRIIC0gMzAsIEhFSUdIVCAtIDEyMCwgUEFERExFX1dJRFRILCBQQURETEVfSEVJR0hULCAweGZmZmZmZikuc2V0T3JpZ2luKC41KTtcclxuICAgIGJhbGwgPSB0aGlzLmFkZC5yZWN0YW5nbGUoc2NyZWVuQ2VudGVyWCwgc2NyZWVuQ2VudGVyWSwgQkFMTF9XSURUSCwgQkFMTF9XSURUSCwgMHhmZmZmZmYpLnNldE9yaWdpbiguNSk7XHJcblxyXG4gICAgdGhpcy5waHlzaWNzLndvcmxkLmVuYWJsZShwYWRkbGUxKTtcclxuICAgIHRoaXMucGh5c2ljcy53b3JsZC5lbmFibGUocGFkZGxlMik7XHJcbiAgICB0aGlzLnBoeXNpY3Mud29ybGQuZW5hYmxlKGJhbGwpO1xyXG5cclxuICAgIGxldCBiYWxsQ29sbGlzaW9uRm4gPSAoKSA9PiB7XHJcbiAgICAgICAgYmFsbGR4ID0gLWJhbGxkeCAqIDEuMDM7XHJcbiAgICAgICAgaWYgKGJhbGxkeSA8IDApIHtcclxuICAgICAgICAgICAgYmFsbGR5ID0gLVBoYXNlci5NYXRoLlJORC5iZXR3ZWVuKDEsIDUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJhbGxkeSA9IFBoYXNlci5NYXRoLlJORC5iZXR3ZWVuKDEsIDUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnBoeXNpY3MuYWRkLmNvbGxpZGVyKHBhZGRsZTEsIGJhbGwsIGJhbGxDb2xsaXNpb25Gbik7XHJcbiAgICB0aGlzLnBoeXNpY3MuYWRkLmNvbGxpZGVyKHBhZGRsZTIsIGJhbGwsIGJhbGxDb2xsaXNpb25Gbik7XHJcblxyXG4gICAga2V5cyA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5cygnVywgUywgVVAsIERPV04sIEVOVEVSJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuICAgIGlmIChnYW1lU3RhdGUgPT0gJ3N0YXJ0Jykge1xyXG4gICAgICAgIHRpdGxlLnNldFZpc2libGUodHJ1ZSk7XHJcbiAgICAgICAgc3VidGl0bGUuc2V0VmlzaWJsZSh0cnVlKTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSAnc2VydmUnKSB7XHJcbiAgICAgICAgcmVzZXRCYWxsKCk7XHJcbiAgICAgICAgdGl0bGUudGV4dCA9IGBQbGF5ZXIgJHtzZXJ2aW5nUGxheWVyfVxcJ3Mgc2VydmUhYDtcclxuICAgICAgICBzdWJ0aXRsZS50ZXh0ID0gJ1ByZXNzIEVudGVyIHRvIFNlcnZlISc7XHJcblxyXG4gICAgICAgIHRpdGxlLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHN1YnRpdGxlLnZpc2libGUgPSB0cnVlO1xyXG5cclxuICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlID09ICdwbGF5Jykge1xyXG4gICAgICAgIHRpdGxlLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBzdWJ0aXRsZS52aXNpYmxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIHJldmVyc2UgYmFsbCB5LWRpcmVjdGlvbiB3aGVuIGl0IGhpdHMgdGhlIHRvcCBvciBib3R0b21cclxuICAgICAgICBpZiAoYmFsbC55IDw9IDAgKyBiYWxsLmhlaWdodCAvIDIgfHwgYmFsbC55ID49IEhFSUdIVCAtIGJhbGwuaGVpZ2h0IC8gMikge1xyXG4gICAgICAgICAgICBiYWxsZHkgPSAtYmFsbGR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbW92ZSB0aGUgYmFsbFxyXG4gICAgICAgIGJhbGwueCA9IGJhbGwueCArIGJhbGxkeDtcclxuICAgICAgICBiYWxsLnkgPSBiYWxsLnkgKyBiYWxsZHk7XHJcblxyXG4gICAgICAgIC8vIHBsYXllciAxIHNjb3Jlc1xyXG4gICAgICAgIGlmIChiYWxsLnggLSBiYWxsLndpZHRoIC8gMiA+IFdJRFRIKSB7XHJcbiAgICAgICAgICAgIHBsYXllcjFTY29yZSsrO1xyXG4gICAgICAgICAgICBwbGF5ZXIxU2NvcmVUZXh0LnRleHQgPSBwbGF5ZXIxU2NvcmU7XHJcbiAgICAgICAgICAgIHNlcnZpbmdQbGF5ZXIgPSAyO1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSAnc2VydmUnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcGxheWVyIDIgc2NvcmVzXHJcbiAgICAgICAgaWYgKGJhbGwueCArIGJhbGwud2lkdGggLyAyIDwgMCkge1xyXG4gICAgICAgICAgICBwbGF5ZXIyU2NvcmUrKztcclxuICAgICAgICAgICAgcGxheWVyMlNjb3JlVGV4dC50ZXh0ID0gcGxheWVyMlNjb3JlO1xyXG4gICAgICAgICAgICBzZXJ2aW5nUGxheWVyID0gMTtcclxuICAgICAgICAgICAgZ2FtZVN0YXRlID0gJ3NlcnZlJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwbGF5ZXIxU2NvcmUgPT0gMTAgfHwgcGxheWVyMlNjb3JlID09IDEwKSB7XHJcbiAgICAgICAgICAgIGdhbWVTdGF0ZSA9ICdkb25lJztcclxuICAgICAgICB9XHJcblxyXG4gICAgfSBlbHNlIGlmIChnYW1lU3RhdGUgPT0gJ2RvbmUnKSB7XHJcbiAgICAgICAgbGV0IHdpbm5lciA9IHBsYXllcjFTY29yZSA9PSAxMCA/IDEgOiAyO1xyXG4gICAgICAgIHRpdGxlLnRleHQgPSBgUGxheWVyICR7d2lubmVyfSB3aW5zIWA7XHJcbiAgICAgICAgc3VidGl0bGUudGV4dCA9ICdQcmVzcyBFbnRlciB0byBQbGF5ISc7XHJcbiAgICAgICAgdGl0bGUudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgc3VidGl0bGUudmlzaWJsZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGtleXMuVy5pc0Rvd24pIHtcclxuICAgICAgICBpZiAocGFkZGxlMS55ID4gcGFkZGxlMS5oZWlnaHQgLyAyKSB7XHJcbiAgICAgICAgICAgIHBhZGRsZTEueSA9IHBhZGRsZTEueSAtIFBBRERMRV9TUEVFRDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGtleXMuUy5pc0Rvd24pIHtcclxuICAgICAgICBpZiAocGFkZGxlMS55IDwgSEVJR0hUIC0gcGFkZGxlMS5oZWlnaHQgLyAyKSB7XHJcbiAgICAgICAgICAgIHBhZGRsZTEueSA9IHBhZGRsZTEueSArIFBBRERMRV9TUEVFRDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGtleXMuVVAuaXNEb3duKSB7XHJcbiAgICAgICAgaWYgKHBhZGRsZTIueSA+IHBhZGRsZTIuaGVpZ2h0IC8gMikge1xyXG4gICAgICAgICAgICBwYWRkbGUyLnkgPSBwYWRkbGUyLnkgLSBQQURETEVfU1BFRUQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChrZXlzLkRPV04uaXNEb3duKSB7XHJcbiAgICAgICAgaWYgKHBhZGRsZTIueSA8IEhFSUdIVCAtIHBhZGRsZTIuaGVpZ2h0IC8gMikge1xyXG4gICAgICAgICAgICBwYWRkbGUyLnkgPSBwYWRkbGUyLnkgKyBQQURETEVfU1BFRUQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChQaGFzZXIuSW5wdXQuS2V5Ym9hcmQuSnVzdERvd24oa2V5cy5FTlRFUikpIHtcclxuICAgICAgICBpZiAoZ2FtZVN0YXRlID09ICdzdGFydCcpIHtcclxuICAgICAgICAgICAgc2VydmluZ1BsYXllciA9IFBoYXNlci5NYXRoLlJORC5iZXR3ZWVuKDEsIDIpO1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSAnc2VydmUnO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGdhbWVTdGF0ZSA9PSAnc2VydmUnKSB7XHJcbiAgICAgICAgICAgIGJhbGxkeCA9IFBoYXNlci5NYXRoLlJORC5iZXR3ZWVuKDUsIDEwKTtcclxuICAgICAgICAgICAgYmFsbGR4ID0gc2VydmluZ1BsYXllciA9PSAxID8gYmFsbGR4IDogLWJhbGxkeDtcclxuICAgICAgICAgICAgYmFsbGR5ID0gUGhhc2VyLk1hdGguUk5ELmJldHdlZW4oLTUsIDUpO1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSAncGxheSc7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlID09ICdkb25lJykge1xyXG4gICAgICAgICAgICBnYW1lU3RhdGUgPSAnc2VydmUnO1xyXG4gICAgICAgICAgICBwbGF5ZXIxU2NvcmUgPSAwO1xyXG4gICAgICAgICAgICBwbGF5ZXIyU2NvcmUgPSAwO1xyXG5cclxuICAgICAgICAgICAgcGxheWVyMVNjb3JlVGV4dC50ZXh0ID0gcGxheWVyMVNjb3JlO1xyXG4gICAgICAgICAgICBwbGF5ZXIyU2NvcmVUZXh0LnRleHQgPSBwbGF5ZXIyU2NvcmU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXNldEJhbGwoKSB7XHJcbiAgICBiYWxsLnggPSBzY3JlZW5DZW50ZXJYO1xyXG4gICAgYmFsbC55ID0gc2NyZWVuQ2VudGVyWTtcclxufVxyXG4iXSwic291cmNlUm9vdCI6IiJ9