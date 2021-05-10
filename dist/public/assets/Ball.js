const BALL_SIZE = 20;
const ACCELERATION = 1.08;

export default class Ball extends Phaser.GameObjects.Image {

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        this.body.setCircle(this.width / 2, 0, 5);
        this.body.setBounce(1);
        this.body.setAngularVelocity(150); // slowly rotate the ball for visual effect
        this.setDisplaySize(BALL_SIZE, BALL_SIZE);
        this.xOrigin = this.x;
        this.yOrigin = this.y;
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
        if (this.body.wasTouching.none) {
            this.sound.play();

            const angle = this.body.velocity.angle();
            const angleChange = this.angleChanges.length ? this.angleChanges.shift() : 0;

            // increase speed
            this.body.velocity.setAngle(0);
            this.body.velocity.x = -this.body.velocity.x * ACCELERATION;

            // slightly change angle
            this.body.velocity.setAngle((angle + angleChange) * Phaser.Math.DEG_TO_RAD);

            // report back to get a new angle
            this.collisionCallbackFn();

        }
    }

    setVelocity(velocity, angle) {
        this.body.setVelocity(velocity, 0);
        this.body.velocity.setAngle(angle * Phaser.Math.DEG_TO_RAD);
    }

    setAngleChange(angle) {
        this.angleChanges.push(angle);
    }
}
