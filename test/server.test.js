import test from 'ava';
import io from 'socket.io-client';

const SERVER_URI = 'http://localhost:3000';

test.serial('emits game state wait to first player', t => {
    return new Promise((resolve) => {
        const clientSocket = io(SERVER_URI, { autoConnect: false });
        clientSocket.on('game_state', data => {
            t.is(data.state, 'wait');
            clientSocket.close();
            resolve();
        });
        clientSocket.open();
    });
});

test.serial('emits game state start to second player', t => {
    return new Promise((resolve) => {
        const firstClient = io(SERVER_URI);
        const secondClient = io(SERVER_URI, { autoConnect: false });
        secondClient.on('game_state', data => {
            t.is(data.state, 'start');
            firstClient.close();
            secondClient.close();
            resolve();
        });
        secondClient.open();
    });
});
