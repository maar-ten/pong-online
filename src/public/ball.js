const BALL_SIZE = 16;

export default class Ball extends Phaser.GameObjects.Rectangle {

    constructor(scene, x, y) {
        super(scene, x, y, BALL_SIZE, BALL_SIZE, 0XFFFFFF);
        this.scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        this.body.setBounce(1);
        this.setOrigin(.5);
        this.xOrigin = x;
        this.yOrigin = y;
    }

    reset() {
        this.setVelocity(0, 0);
        this.x = this.xOrigin;
        this.y = this.yOrigin;
    }

    addCollider(paddle, sound) {
        this.sound = sound;
        this.scene.physics.add.collider(paddle, this, this.collisionFn, null, this);
    }

    collisionFn() {
        // detect first contact and change ball's direction
        if (this.body.wasTouching.none) {
            this.sound.play();
            this.body.velocity.x = -this.body.velocity.x * 1.025
            this.body.velocity.y *= 1.025

            // todo somehow make the angle change the same for local and remote player
            // let a = this.body.velocity.angle();
            // let da = Phaser.Math.RND.between(0, 17) * Phaser.Math.RND.pick([-1, 1]);

            // this.body.velocity.setAngle(0);
            // this.body.velocity.x *= -1.05;

            // this.body.velocity.setAngle(a + (da  / 100));
        }
    }

    setVelocity(velocity, angle) {
        this.body.setVelocity(velocity, 0);
        this.body.velocity.setAngle(angle);
    }
}
