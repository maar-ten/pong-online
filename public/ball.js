const BALL_SIZE = 16;

export default class Ball extends Phaser.GameObjects.Rectangle {
    dx = 0;
    dy = 0;

    constructor(scene, x, y) {
        super(scene, x, y, BALL_SIZE, BALL_SIZE, 0XFFFFFF);
        this.scene.physics.world.enableBody(this);
        this.setOrigin(.5);
        this.xOrigin = x;
        this.yOrigin = y;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    reset() {
        this.x = this.xOrigin;
        this.y = this.yOrigin;
    }

    addCollider(paddle) {
        this.scene.physics.add.collider(paddle, this, this.collisionFn.bind(this));
    }

    collisionFn() {
        this.dx *= -1.03;
        if (this.dy < 0) {
            this.dy = -Phaser.Math.RND.between(1, 5);
        } else {
            this.dy = Phaser.Math.RND.between(1, 5);
        }
    }
}
