import css from './index.css';
import Game from './Game/Game';
import Controls from './Game/Controls';
import Car from './Game/Car';
import Brain from './Game/Brain';
import Driver from './Game/Driver';
import NeuroEvolution from './Game/NeuroEvolution';
import Helpers from './Game/utils/Helpers';

let canvas = document.getElementById('game0');

let game = new Game(canvas);
let ne = new NeuroEvolution(100, game);

// let controls = new Controls(game);
// controls.setEventListeners();

ne.run();