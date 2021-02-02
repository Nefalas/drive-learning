import Driver from './Driver';
import Helpers from './utils/Helpers';
import StateSaver from './utils/StateSaver';

const FREQUENCY = 10;

export default class NeuroControls {

	constructor(game, evolution) {
		this.game = game;
		this.evolution = evolution;

		this.round = 0;

		this.exec = this.exec.bind(this);
		this.reset = this.reset.bind(this);
		this.setEventListeners = this.setEventListeners.bind(this);
		this.play = this.play.bind(this);
		this.pause = this.pause.bind(this);
		this.stop = this.stop.bind(this);
		this.showGameScore = this.showGameScore.bind(this);
		this.showGameSpeed = this.showGameSpeed.bind(this);
		this.showCarScores = this.showCarScores.bind(this);

		this.setEventListeners();
		this.game.addPostRunEvent(this.exec);
	}

	exec() {
		this.round++;
		if (this.round % FREQUENCY === 0) {
			this.showGameScore();
			this.showGameSpeed();
			this.showCarScores();
		}
	}

	reset() {
		this.game.addPostRunEvent(this.exec);
	}

	setEventListeners() {
		document.getElementById('neuro-play').onclick = this.play;
		document.getElementById('neuro-pause').onclick = this.pause;
		document.getElementById('neuro-stop').onclick = this.stop;
		document.getElementById('weight-download').onclick = StateSaver.downloadPopulation;
		document.getElementById('file-upload').addEventListener('change', StateSaver.uploadPopulation, false);
		document.getElementById('weight-delete').onclick = StateSaver.deletePopulation;
	}

	play() {
		if (this.game.isRunning) return;
		if (this.game.hasLost) {
			this.stop();
			this.game.hasLost = false;
		}
		this.game.isRunning = true;
		this.game.run();
	}

	pause() {
		this.game.isRunning = false;
	}

	stop() {
		this.pause();
		this.game.reset();
		this.game.clear();
		new Driver(this.game);
	}

	showGameScore() {
		let score = Math.floor(this.game.score * 10);
		document.getElementById('game-score-display').innerText = 'Game score: ' + Helpers.formatInt(score);
	}

	showGameSpeed() {
		let speed = Math.floor(this.game.speedModifier * 100);
		document.getElementById('game-speed-display').innerText = 'Game speed: ' + Helpers.formatInt(speed) + '%';
	}

	showCarScores() {
		let container = document.getElementById('car-score-body');
		container.innerHTML = '';

		let population = this.evolution.population.concat(this.evolution.deadPopulation);
		population.sort((a, b) => b.getScore() - a.getScore());

		population.forEach((driver) => {
			container.innerHTML +=
				'<tr class="car-score">' +
					`<td>${driver.uniqueID}</td>` +
					`<td>${Helpers.formatInt(Math.floor(driver.getScore()))}</td>` +
					`<td>${driver.hasLost()? 'Dead' : 'Alive'}</td>` +
				'</tr>';
		})
	}

}