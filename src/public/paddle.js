const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;

export const PADDLE_SPEED = 600;

export default class Paddle extends Phaser.GameObjects.Rectangle {
    dy = 0;

    constructor(scene, x, y) {
        super(scene, x, y, PADDLE_WIDTH, PADDLE_HEIGHT, 0XFFFFFF);
        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.setCollideWorldBounds(true);
        this.body.setImmovable();
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
