import cfg from './config.js';

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;

export default class Paddle extends Phaser.GameObjects.Image {
    dy = 0;

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.world.enableBody(this);
        this.body.setCollideWorldBounds(true);
        this.body.setImmovable();
        this.setOrigin(.5);
        const width = this.width / this.height * PADDLE_HEIGHT; // maintain aspect ratio of the image
        this.setDisplaySize(width, PADDLE_HEIGHT);
    }

    update() {
        this.y += this.dy;
    }

    up() {
        this.dy = -cfg.PADDLE_SPEED;
        this.update();
    }

    down() {
        this.dy = cfg.PADDLE_SPEED;
        this.update();
    }
}
