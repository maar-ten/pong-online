export default class Paddle extends Phaser.GameObjects.Rectangle {
    WIDTH = 15;
    HEIGHT = 80;
    dy = 0

    constructor(scene, x, y) {
        super(scene, x, y, this.WIDTH, this.HEIGHT);
        this.setOrigin(.5);
    }

    create() {

    }

    update() {
        this.y = this.y + this.dy;
    }

    setDy(dy) {
        this.dy = dy;
    }
}
