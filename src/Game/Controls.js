import Driver from './Driver';

export default class Controls {

	/**
	 * Constructor for Controls
	 * @param {Game} game
	 */
	constructor(game) {
		this.game = game;

		this.play = this.play.bind(this);
		this.pause = this.pause.bind(this);
		this.stop = this.stop.bind(this);
		this.setSpeed = this.setSpeed.bind(this);
		this.showScore = this.showScore.bind(this);
		this.toggleGrid = this.toggleGrid.bind(this);
		this.toggleCarLines = this.toggleCarLines.bind(this);
		this.toggleCar = this.toggleCar.bind(this);
		this.setEventListeners = this.setEventListeners.bind(this);
		this.toggleFrenchMode = this.toggleFrenchMode.bind(this);
		this.toggleImmortal = this.toggleImmortal.bind(this);
		this.showCarSpeed = this.showCarSpeed.bind(this);
		this.showCarVpos = this.showCarVpos.bind(this);
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

	setSpeed(event) {
		let value = event.target.value;
		this.game.speed = parseFloat(value);
		let label = document.getElementById('game-speed-label');
		label.innerText = 'Speed: ' + value;
	}

	getActiveCar() {
		if (this.game.cars.length === 0) return null;
		return this.game.cars[0];
	}

	showScore() {
		let scoreString = (this.game.score * 10).toFixed(0);
		document.getElementById('score-display').innerText = 'Score: ' + scoreString;
	}

	showCarSpeed() {
		let car = this.getActiveCar();
		if (!car) return;
		let speedString = (car.drivingStep).toFixed(3);
		document.getElementById('car-speed').innerText = 'Car speed: ' + speedString;
	}

	showCarVpos() {
		let car = this.getActiveCar();
		if (!car) return;
		let vposString = (1 - car.y / this.game.height).toFixed(3);
		document.getElementById('car-vpos').innerText = 'Car vpos: ' + vposString;
	}

	toggleGrid() {
		this.game.gridOn = !this.game.gridOn;
	}

	toggleCarLines() {
		let car = this.getActiveCar();
		if (!car) return;
		car.showHelpers = !car.showHelpers;
	}

	toggleCar() {
		let car = this.getActiveCar();
		if (!car) return;
		car.showCar = !car.showCar;
	}

	toggleFrenchMode() {
		this.game.frenchMode = !this.game.frenchMode;
	}

	toggleImmortal() {
		this.game.canLoose = !this.game.canLoose;
	}

	setEventListeners() {
		document.getElementById('play').onclick = this.play;
		document.getElementById('pause').onclick = this.pause;
		document.getElementById('stop').onclick = this.stop;
		document.getElementById('game-speed-input').oninput = this.setSpeed;
		document.getElementById('grid').onclick = this.toggleGrid;
		document.getElementById('car-lines').onclick = this.toggleCarLines;
		document.getElementById('hide-car').onclick = this.toggleCar;
		document.getElementById('french').onclick = this.toggleFrenchMode;
		document.getElementById('immortal').onclick = this.toggleImmortal;

		document.getElementById('game-speed-label').innerText = 'Speed: 0.015';
		document.getElementById('score-display').innerText = 'Score: 0';
		document.getElementById('car-speed').innerText = 'Car speed: 0';
		document.getElementById('car-vpos').innerText = 'Car vpos: 0.5';

		this.game.addPostRunEvent(this.showScore);
		this.game.addPostRunEvent(this.showCarSpeed);
		this.game.addPostRunEvent(this.showCarVpos);
	}

}