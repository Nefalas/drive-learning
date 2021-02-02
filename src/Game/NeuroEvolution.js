import Driver from './Driver';
import Helpers from './utils/Helpers';
import NeuroControls from './NeuroControls';
import StateSaver from './utils/StateSaver';

const ALL_TIME_BEST_LIMIT = 5;
const GAME_SCORE_LIMIT = 500;

export default class NeuroEvolution {

	constructor(totalPopulation, game) {
		this.totalPopulation = totalPopulation;
		this.game = game;
		if (StateSaver.hasPopulation()) {
			this.population = StateSaver.restorePopulation(totalPopulation, game);
		} else {
			this.population = this.generatePopulation();
		}
		this.deadPopulation = [];
		this.generation = 0;
		this.controls = new NeuroControls(this.game, this);

		this.run = this.run.bind(this);
		this.reset = this.reset.bind(this);
		this.generatePopulation = this.generatePopulation.bind(this);
		this.checkPopulation = this.checkPopulation.bind(this);
		this.evolve = this.evolve.bind(this);
		this.killAll = this.killAll.bind(this);

		this.game.addPostRunEvent(this.killAll);
	}

	run() {
		if (!this.game.isRunning) {
			this.game.addPostRunEvent(this.checkPopulation);
			this.game.isRunning = true;
			this.game.run();
		}
	}

	reset() {
		return new Promise((resolve) => {
			this.game.isRunning = false;
			setTimeout(() => {
				this.game.reset();
				this.game.clear();
				this.controls.reset();
				this.game.addPostRunEvent(this.killAll);
				resolve();
			}, 50);
		})
	}

	checkPopulation() {
		let remainingPopulation = [];
		let remainingCars = [];
		this.population.forEach((driver) => {
			if (driver.hasLost()) {
				this.deadPopulation.push(driver);
			} else {
				remainingPopulation.push(driver);
				remainingCars.push(driver.car);
			}
		});
		this.population = remainingPopulation;
		this.game.cars = remainingCars;
		if (this.population.length === 0) {
			this.reset()
			.then(() => {
				this.evolve();
				this.run();
			});
		}
	}

	killAll() {
		if (this.game.score >= GAME_SCORE_LIMIT) {
			this.population.forEach((driver) => driver.car.hasLost = true);
		}
	}

	evolve() {
		this.generation++;
		this.deadPopulation.sort((a, b) => b.getScore() - a.getScore());

		StateSaver.savePopulation(this.deadPopulation);

		console.log('(' + this.deadPopulation[0].uniqueID + ')[' + this.generation
			+ '] Best: '+ this.deadPopulation[0].getScore().toFixed(3));
		//this.printLeaderBoard();

		let weights = this.deadPopulation.map((driver) => driver.getScore());
		let newPopulation = [];
		let newCars = [];
		for (let i = 0; i < this.totalPopulation; i++) {
			if (i < ALL_TIME_BEST_LIMIT) {
				this.deadPopulation[i].reset();
				newPopulation.push(this.deadPopulation[i]);
				newCars.push(this.deadPopulation[i].car);
			} else {
				let parent1 = Helpers.randomWeighted(this.deadPopulation, weights);
				let parent2 = Helpers.randomWeighted(this.deadPopulation, weights);
				let child = parent1.mate(parent2).mutate();
				newPopulation.push(child);
				newCars.push(child.car);
			}
		}
		this.deadPopulation.forEach((driver, i) => {
			if (i >= ALL_TIME_BEST_LIMIT) {
				driver.brain.dispose();
			}
		});
		this.game.cars = newCars;
		this.population = newPopulation;
		this.deadPopulation = [];
	}

	generatePopulation() {
		let population = [];
		for (let i = 0; i < this.totalPopulation; i++) {
			population.push(new Driver(this.game));
		}
		return population;
	}

	printLeaderBoard() {
		console.log('----------------------------------');
		console.log('---------- Leader board ----------\n');
		this.deadPopulation.forEach((driver, i) => {
			console.log('Driver ' + (i+1) + ': ' + driver.getScore());
		});
		console.log('----------------------------------\n');
	}

}