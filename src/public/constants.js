export const GAME_STATE = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WAIT: 'wait',
    START: 'start',
    START_SERVE: 'start-serve',
    SERVE: 'serve',
    SERVE_PLAY: 'serve-play',
    PLAY: 'play',
    DONE: 'done',
    DONE_START: 'done-start'
};

export const GAME_ACTION = {
    SERVE: 'serve',
    SCORE: 'score',
    PADDLE_MOVE: 'paddle-move',
    PADDLE_HIT: 'paddle-hit'
};

export const MESSAGE = {
    GAME_STATE: 'game-state',
    ACTION: 'action',
    READY: 'ready',
    CONNECT_ERROR: 'connect_error'
}