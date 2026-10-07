// V2 entry: web là canonical platform — boot Game vào #app.
import { Game } from './app/Game.js';

const container = document.getElementById('app');
if (!container) throw new Error('Thiếu #app trong index.html');

const game = new Game(container);
game.start();
