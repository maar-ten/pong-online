export class AbstractText {

    constructor(scene, x, y, size) {
        this.textObj = addText(scene, x, y, size, '');
    }

    updateOnline(isOnline) {
        // noop, subclass needs to implement this
    }

    updateGameState(data) {
        // noop, subclass needs to implement this
    }
}

const FONT = 'DeadSpace';
const COLOR = '#FD5F3F';

export function addText(scene, x, y, size, text, fontFamily = FONT, color = COLOR) {
    return scene.add
        .text(x, y, text, {
            fontFamily: fontFamily,
            fontSize: size + 'px',
            color: color
        })
        .setOrigin(0.5); // sets the origin of the object in the center
}