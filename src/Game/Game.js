import Box from './Box';
import Car from './Car';

const FPS = 60;
const SPEED_MODIFIER_INCREMENT = 0.00005;

/**
 * Class Game
 *
 * @property {Car[]} cars
 */
export default class Game {

	constructor(canvas) {
		this.canvas = canvas;
		this.setupCanvas();
		this.ctx = canvas.getContext("2d");
		this.speed = .015;
		this.speedModifier = 1;
		this.yOffset = 0;

		this.isRunning = false;
		this.gridOn = false;
		this.frenchMode = false;
		this.canLoose = true;
		this.hasLost = false;

		this.cars = [];
		this.boxes = [];
		this.previousBox = null;

		this.preRun = [];
		this.postRun = [];

		this.score = 0;
		this.frame = 0;

		this.addCar = this.addCar.bind(this);
		this.resetCars = this.resetCars.bind(this);
		this.run = this.run.bind(this);
		this.loose = this.loose.bind(this);
		this.getSpeed = this.getSpeed.bind(this);
		this.incrementSpeedModifier = this.incrementSpeedModifier.bind(this);
		this.setupCanvas = this.setupCanvas.bind(this);
		this.reset = this.reset.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);

		//window.onresize = this.reset;
		window.onkeydown = this.handleKeyDown;
		window.onkeyup = this.handleKeyUp;
	}

	run() {
		if (!this.isRunning) return;
		this.frame++;

		let start = (new Date()).getTime();

		this.updateBoxes();

		Promise.all(this.cars.map((car) => {
			return car.update();
		}))
		.then(() => {
			this.clear();
			this.drawBoxes();

			if (this.gridOn) {
				this.drawGrid();
			}

			this.cars.forEach(car => car.draw());

			this.yOffset += this.getSpeed();
			if (this.yOffset >= 1) {
				this.lowerBoxes();
				this.yOffset = 0;
			}

			this.score += this.getSpeed();

			this.postRun.forEach((func) => func());

			this.setNextBox();

			let elapsed = (new Date()).getTime() - start;
			let remaining = (1000 / FPS) - elapsed;

			this.incrementSpeedModifier();

			if (remaining <= 0) {
				this.run();
			} else {
				setTimeout(this.run, remaining);
			}
		});
	}

	loose() {
		this.isRunning = false;
		this.hasLost = true;
		setTimeout(() => {
			this.ctx.beginPath();
			this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
			this.ctx.fillRect(
				this.boxSize / 2,
				this.boxSize * 2,
				this.width - this.boxSize,
				this.height - 4 * this.boxSize
			);
			this.ctx.beginPath();
			this.ctx.font = '50px sans-serif';
			this.ctx.fillStyle = '#000000';
			this.ctx.textAlign = "center";
			this.ctx.fillText("You lost!", this.width / 2, this.height / 2 + 15);
		}, 50);
	}

	addCar(car) {
		this.cars.push(car);
	}

	resetCars() {
		this.cars = [];
	}

	getSpeed() {
		return this.speed * this.speedModifier;
	}

	incrementSpeedModifier() {
		this.speedModifier += SPEED_MODIFIER_INCREMENT;
	}

	getBoxByPosition(x, y) {
		let boxRow = Math.floor((y - this.boxSize * this.yOffset) / this.boxSize);
		let boxCol = Math.floor(x / this.boxSize);

		for (let row = 0; row < this.maxRows + 2; row++) {
			let index = row * 4 + boxCol;
			if (this.boxes[index] && this.boxes[index].row === boxRow) {
				return this.boxes[index];
			}
		}
		return null;
	}

	addPreRunEvent(func) {
		this.preRun.push(func);
	}

	addPostRunEvent(func) {
		this.postRun.push(func);
	}

	drawBoxes() {
		this.boxes.forEach((box) => {
			box.draw();
		});
	}

	updateBoxes() {
		if (this.boxes.length === 0) {
			this.initBoxes();
		}
	}

	lowerBoxes() {
		this.boxes.forEach((box) => {
			box.lower();
		})
	}

	initBoxes() {
		for (let row = 0; row < this.maxRows + 2; row++) {
			for (let col = 0; col < 4; col++) {
				if (col === 1) {
					this.boxes.push(new Box('straight', 'up', row, col, this));
					if (row === 0) {
						this.previousBox = this.boxes[this.boxes.length - 1];
					}
				} else {
					this.boxes.push(new Box(null, null, row, col, this));
				}
			}
		}
		this.setNextBox();
	}

	drawGrid() {
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		for (let i = 1; i < 4; i++) {
			this.ctx.moveTo(this.boxSize * i, 0);
			this.ctx.lineTo(this.boxSize * i, this.height);
		}
		for (let i = 0; i * this.boxSize < this.height; i++) {
			this.ctx.moveTo(0, this.boxSize * i + this.yOffset * this.boxSize);
			this.ctx.lineTo(this.width, (i + this.yOffset) * this.boxSize);
		}
		this.ctx.strokeStyle = '#000000';
		this.ctx.stroke();
	}

	clear() {
		this.ctx.beginPath();
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	setupCanvas() {
		this.canvas.width = this.canvas.scrollWidth;
		this.canvas.height = this.canvas.scrollHeight;
		this.height = this.canvas.height;
		this.width = this.canvas.width;
		this.boxSize = this.width / 4;
		this.maxRows = Math.floor(this.height / this.boxSize) + 2;
	}

	reset() {
		this.setupCanvas();
		this.boxes = [];
		this.previousBox = null;
		this.initBoxes();
		this.score = 0;
		this.cars = [];
		this.preRun = [];
		this.postRun = [];
		this.speedModifier = 1;
	}

	setNextBox() {
		if (this.previousBox === null) {
			let box = this.getBoxByRowCol(this.maxRows + 1, 0);
			box.setTypeAndDirection('straight', 'up');
			this.previousBox = box;
		} else {
			let box = this.getNextBox();
			if (box === null) return;
			let { type, direction } = this.getRandomTypeAndDirection();
			box.setTypeAndDirection(type, direction);
			this.previousBox = box;
			this.setNextBox();

		}
		this.setNextBox();
	}

	getRandomTypeAndDirection() {
		if (this.previousBox.col === 2 && this.previousBox.facingDirection() === 'right') {
			return { type: 'corner', direction: 'up_left'}
		}
		if (this.previousBox.col === 1 && this.previousBox.facingDirection() === 'left') {
			return { type: 'corner', direction: 'up_right'}
		}
		if (this.previousBox.col === 3 && this.previousBox.facingDirection() === 'up') {
			return this.getOneOf([ ['straight', 'up'], ['corner', 'left'] ]);
		}
		if (this.previousBox.col === 0 && this.previousBox.facingDirection() === 'up') {
			return this.getOneOf([ ['straight', 'up'], ['corner', 'right'] ]);
		}
		if (this.previousBox.facingDirection() === 'up') {
			return this.getOneOf([ ['straight', 'up'], ['corner', 'right'], ['corner', 'left'] ]);
		}
		if (this.previousBox.facingDirection() === 'right') {
			return this.getOneOf([ ['straight', 'right'], ['corner', 'up_left'] ]);
		}
		if (this.previousBox.facingDirection() === 'left') {
			return this.getOneOf([ ['straight', 'left'], ['corner', 'up_right'] ]);
		}
		return null;
	}

	getOneOf(types) {
		let index = Math.floor(Math.random() * types.length);
		return { type: types[index][0], direction: types[index][1] };
	}

	getNextBox() {
		if (this.previousBox === null) return null;
		if (this.previousBox.type === 'straight') {
			switch (this.previousBox.direction) {
				case 'right':
					return this.getBoxByRowCol(this.previousBox.row, this.previousBox.col + 1);
				case 'left':
					return this.getBoxByRowCol(this.previousBox.row, this.previousBox.col - 1);
				case 'up':
					return this.getBoxByRowCol(this.previousBox.row - 1, this.previousBox.col);
				default:
					return null;
			}
		} else if (this.previousBox.type === 'corner') {
			switch (this.previousBox.direction) {
				case 'left':
					return this.getBoxByRowCol(this.previousBox.row, this.previousBox.col - 1);
				case 'right':
					return this.getBoxByRowCol(this.previousBox.row, this.previousBox.col + 1);
				case 'up_left':
				case 'up_right':
					return this.getBoxByRowCol(this.previousBox.row - 1, this.previousBox.col);
				default:
					return null;
			}
		}
		return null;
	}

	getBoxByRowCol(row, col) {
		for (let i = 0; i < this.boxes.length; i++) {
			if ((this.boxes[i].row === row) && (this.boxes[i].col === col)) return this.boxes[i];
		}
		return null;
	}

	handleKeyDown(event) {
		this.cars.forEach(car => car.handleKeyDown(event));
	}

	handleKeyUp(event) {
		this.cars.forEach(car => car.handleKeyUp(event));
	}

}