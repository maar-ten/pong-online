import test from 'ava';
import GameSession from '../dist/public/assets/GameSession.js';
import { GAME_ACTION } from '../dist/public/constants.js';

let gameSession;

test.beforeEach(() => {
    gameSession = new GameSession();
    gameSession.setRandomValueCallback(() => .5);
    gameSession.setGameStateChangeCallback(() => { });
    gameSession.setGameActionCallback(() => { });
    gameSession.addPlayer('foo');
    gameSession.addPlayer('bar');
});

test('calls game state callback when a player scores a point', t => {
    gameSession.setGameStateChangeCallback(() => t.pass());

    gameSession.handleGameAction({
        action: GAME_ACTION.SCORE,
        player: 1
    });
});

test('sends flight data after every 2 paddle hits', t => {
    t.plan(1);
    gameSession.setGameActionCallback(data => t.is(data.flightData.length, 2));

    gameSession.handleGameAction({
        action: GAME_ACTION.PADDLE_HIT,
        flightData: { player: 1, flightNumber: 1 }
    });

    gameSession.handleGameAction({
        action: GAME_ACTION.PADDLE_HIT,
        flightData: { player: 2, flightNumber: 1 }
    });
});