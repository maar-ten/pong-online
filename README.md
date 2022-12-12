[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/maar-ten/pong-online)
[![Github workflow](https://github.com/maar-ten/pong-online/actions/workflows/node.js.yml/badge.svg)](https://github.com/maar-ten/pong-online/actions/workflows/node.js.yml)

This is Pong 🏓
===

Pong is a classic video game created in the 70s by [Atari](https://en.wikipedia.org/wiki/Pong). I recreated this game as
the final project for the CS50 computer science course that I did in 2020.

The goal of this project is to create an online multiplayer version of the original Pong game.

Local installation
---
First install [NodeJS](https://nodejs.org/) version 12 or newer, if you haven't got it already.

Then run `node install` inside the project folder. This will install the app and its dependencies.

Run `node src/main.js` to start the game server. It will be listening on port 3000 by default.

Then go to http://localhost:3000 in a web browser.

The game starts in offline mode. In this mode you can play on the same computer against another player or against the robot 🤖.

Press [M] to listen to some music. Press [H] to see what other game options there are.


Server installation
---
If you want to play online against a friend, you need to install the software on a public server that can accept incoming connnections.

In this case you might want to turn online mode on by default. This can be configured in [src/public/config.js](src/public/config.js).

Then send the url of the server to your friend and have some fun! 🏓

Development
---
To help with the development of the game I used a number of freely available resources:
- JavaScript game library [Phaser3](https://phaser.io/) 🦄
- Another beek beep beer please music by [Rolemusic](https://freemusicarchive.org/music/Rolemusic/) 🤘
- Sounds created with [Bfxr](https://www.bfxr.net/) 🏆
- Sounds converted to MP3 with [Convertio](https://convertio.co/)
- Press Start 2P font by [Codeman38](https://www.fontspace.com/codeman38)
- Dead Space font by [DC-designs](https://www.dafont.com/devin-chandra.d8755) 🤩
- Lava texture by [Outworldz](https://www.outworldz.com/cgi/free-seamless-textures.plx)
- Server software [NodeJS](https://nodejs.org/)
- JavaScript 3rd party libraries as descripted in [package.json](package.json).
- I might have used [Stack Overflow](https://stackoverflow.com/questions?tab=Frequent) once or twice 🤣

All this software is free to use and is created by many unsung heroes of the internet 🦸‍♀️ 

Game States
---
![Game State Diagram](dist/public/assets/images/game-state-diagram.svg)

Game states progress by user actions like pressing \<enter\>, or the game logic like scoring a point.

When playing online the game waits after connecting to the server for another opponent to join the session before continuing on to the next state.

The play state finishes when a player scores a point. The game logic decides which state comes next: **Serve** if there is no winner yet, otherwise **Done**.

License
---
This project's is made public under the GNU GENERAL PUBLIC LICENSE. For more information see the project [LICENSE](LICENSE) file or visit [GNU.org](https://www.gnu.org/licenses/quick-guide-gplv3).


CI 🧪
---
To run tests locally first start the server with `npm start`, and then start the tests with `npm test`.
