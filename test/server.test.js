import test from 'ava';
import io from 'socket.io-client';
import {GAME_STATE, MESSAGE} from '../dist/public/constants.js';

const SERVER_URI = 'http://localhost:3000';

test.serial('emits game state wait to first player', t => {
    return new Promise((resolve) => {
        const client = io(SERVER_URI, { autoConnect: false });
        client.on(MESSAGE.GAME_STATE, data => {
            t.is(data.state, GAME_STATE.WAIT);
            client.close();
            resolve();
        });
        client.open();
    });
});

test.serial('emits game state start to second player', t => {
    return new Promise((resolve) => {
        const firstClient = io(SERVER_URI);
        const secondClient = io(SERVER_URI, { autoConnect: false });
        secondClient.on(MESSAGE.GAME_STATE, data => {
            t.is(data.state, GAME_STATE.START);
            firstClient.close();
            secondClient.close();
            resolve();
        });
        secondClient.open();
    });
});
