Pong 🏓
===

Pong is a classic video game created in the 70s by [Atari](https://en.wikipedia.org/wiki/Pong). I recreated this game as the final project for the CS50 computer science course that I did in 2020.

The goal of this project is to recreate the game in such a way that you can play it against an opponent that is online elsewhere on the internet.

Development
---
To help with the development of the game I used a number of freely available resources:
- JavaScript game library [Phaser3](https://phaser.io/) 🐱‍🏍
- Sounds created with [Bfxr](https://www.bfxr.net/) 🏆
- Sounds converted to MP3 with [Convertio](https://convertio.co/)
- Press Start 2P font by [Codeman38](https://www.fontspace.com/codeman38) 🤩
- Server software [NodeJS](https://nodejs.org/)
- JavaScript 3rd party libraries as descripted in [package.json](package.json).

All this software is free to use and is created by many unsung heroes of the internet 🦸‍♀️ 


Local installation
---
First install [NodeJS](https://nodejs.org/) version LTS 12.13.0 or newer, if you haven't already.

Run `node install` inside the project folder. This will install the app and its dependencies.

Run `node src/main.js` to start the game server. It will be listening on port 3000 by default.

Then open http://localhost:3000 in a web browser to play solo against the computer.


Server installation
---
Equal to the local installation.
Optionally disable the robot and the performance logging in `src/public/config.js`.

Send the url of the server to your friend and play Pong together!


License
---
This project's is made public under the GNU GENERAL PUBLIC LICENSE. For more information see the project [LICENSE](LICENSE) file or visit [GNU.org](https://www.gnu.org/licenses/quick-guide-gplv3).


