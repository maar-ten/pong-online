const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 10;

export default class Paddle extends Phaser.GameObjects.Rectangle {
    dy = 0;

    constructor(scene, x, y) {
        super(scene, x, y, PADDLE_WIDTH, PADDLE_HEIGHT, 0XFFFFFF);
        scene.physics.world.enableBody(this);
        this.setOrigin(.5);
    }

    update() {
        this.y += this.dy;
    }

    up() {
        this.dy = -PADDLE_SPEED;
        this.update();
    }

    down() {
        this.dy = PADDLE_SPEED;
        this.update();
    }
}
