const BALL_SIZE = 16;

export default class Ball extends Phaser.GameObjects.Rectangle {

    constructor(scene, x, y) {
        super(scene, x, y, BALL_SIZE, BALL_SIZE, 0XFFFFFF);
        scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        this.body.setBounce(1);
        this.setOrigin(.5);
        this.xOrigin = x;
        this.yOrigin = y;
        this.angleChanges = [];
    }

    reset() {
        this.setVelocity(0, 0);
        this.x = this.xOrigin;
        this.y = this.yOrigin;
        this.angleChanges = [];
    }

    addCollider(paddle, sound, callbackFn) {
        this.sound = sound;
        this.collisionCallbackFn = callbackFn;
        this.scene.physics.add.collider(paddle, this, this.collisionFn, null, this);
    }

    collisionFn() {
        // detect first contact and change ball's speed and direction
        if (this.body.wasTouching.none) {
            this.sound.play();
            let angle = this.body.velocity.angle();

            // increase speed
            this.body.velocity.setAngle(0);
            this.body.velocity.x = -this.body.velocity.x * 1.05;

            // slightly change angle
            this.body.velocity.setAngle(angle + this.angleChanges.shift());

            // report back
            this.collisionCallbackFn();
        }
    }

    setVelocity(velocity, angle) {
        this.body.setVelocity(velocity, 0);
        this.body.velocity.setAngle(angle);
        this.angleChanges.push(angle);
    }

    setAngleChange(angle) {
        this.angleChanges.push(angle);
    }
}
