export const GAME_STATE = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    SERVER_REJECT: 'server-reject',
    WAIT: 'wait',
    START: 'start',
    START_SERVE: 'start-serve',
    SERVE: 'serve',
    SCORED: 'scored',
    PLAY: 'play',
    DONE: 'done'
};

export const GAME_ACTION = {
    READY: 'ready',
    SERVE: 'serve',
    SCORE: 'score',
    PADDLE_MOVE: 'paddle-move',
    PADDLE_HIT: 'paddle-hit'
};

export const MESSAGE = {
    GAME_STATE: 'game-state',
    ACTION: 'action',
    CONNECTION: 'connection',
    CONNECT_ERROR: 'connect-error',
    DISCONNECT: 'disconnect',
    LATENCY: 'latency'
}