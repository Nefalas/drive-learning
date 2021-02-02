import * as tf from '@tensorflow/tfjs';
import {Tensor} from '@tensorflow/tfjs';
import Car from './Car';
import Brain from './Brain';
import Helpers from './utils/Helpers';
import Keys from './utils/Keys';

const INPUT_NEURONS = 10;
const FIRST_HIDDEN_NEURONS = 80;
const SECOND_HIDDEN_NEURONS = 40;
const OUTPUT_NEURONS = 4;

const MUTATION_THRESHOLD = 0.05;

/**
 * Class Driver
 * @property {Game} game
 * @property {Car} car
 * @property {Brain} brain
 */
export default class Driver {

	constructor(game, weights=null) {
		this.uniqueID = Math.random().toString(36).substr(2, 9);
		this.game = game;
		this.car = new Car(game);
		this.brain = new Brain([INPUT_NEURONS, FIRST_HIDDEN_NEURONS, SECOND_HIDDEN_NEURONS, OUTPUT_NEURONS], weights);

		this.drive = this.drive.bind(this);
		this.getCarInputs = this.getCarInputs.bind(this);
		this.pressKeys = this.pressKeys.bind(this);
		this.mutate = this.mutate.bind(this);
		this.mate = this.mate.bind(this);

		this.game.addCar(this.car);
		this.car.addDriveAction(this.drive);
	}

	drive() {
		return new Promise((resolve) => {
			let inputs = this.getCarInputs();
			if (!inputs) {
				this.pressKeys([0, 0, 0, 0]);
				return resolve();
			}

			// let outputs = this.brain.activate(inputs);
			// return this.pressKeys(outputs);

			this.brain.activateAsync(inputs).then((outputs) => {
				this.pressKeys(outputs);
				resolve();
			})
		});
	}

	getCarInputs() {
		let distances = this.car.viewDistances;
		let speed = (this.car.drivingStep + 1) / 2;
		let vpos = 1 - this.car.y / this.game.height;

		if (distances === null || speed === null || vpos === null) return null;

		return [
			distances.front.normalised,
			distances.back.normalised,
			distances.left.normalised,
			distances.right.normalised,
			distances.topLeft.normalised,
			distances.topRight.normalised,
			distances.bottomLeft.normalised,
			distances.bottomRight.normalised,
			speed,
			vpos
		];
	}

	reset() {
		this.car = new Car(this.game);
		this.car.addDriveAction(this.drive);
		return this;
	}

	pressKeys(outputs) {
		let keys = [ Keys.w, Keys.a, Keys.s, Keys.d ];
		outputs.forEach((output, i) => {
			let event = { keyCode: keys[i] };
			if (output > 0.5) {
				this.car.handleKeyDown(event);
			} else {
				this.car.handleKeyUp(event);
			}
		})
	}

	hasLost() {
		return this.car.hasLost;
	}

	getScore() {
		// let score = this.car.totalDistance + 5 * (this.car.totalRoadTurns + 1
		// - this.car.totalTurns);
		let score = this.car.totalDistance * ((this.car.totalRoadTurns + 1) / (this.car.totalTurns + 1));
		if (score >= 0 && this.car.totalTurns > 0) return score;
		return 0;
	}

	mutate() {
		for (let i = 0; i < this.brain.weights.length; i++) {
			let mutatedWeights = [];
			for (let weight of this.brain.weights[i].dataSync()) {
				let newWeight;
				if (Math.random() < MUTATION_THRESHOLD) {
					newWeight = weight + Helpers.randomGaussian();
				} else {
					newWeight = weight;
				}
				mutatedWeights.push(newWeight);
			}
			let shape = this.brain.weights[i].shape;
			this.brain.weights[i].dispose();
			this.brain.weights[i] = tf.tensor(mutatedWeights, shape);
		}
		return this;
	}

	mate(partner) {
		let newWeights = [];
		for (let i = 0; i < this.brain.weights.length; i++) {
			let driverWeights = this.brain.weights[i].dataSync();
			let partnerWeights = partner.brain.weights[i].dataSync();
			let offspringWeights = [];
			for (let j = 0; j < driverWeights.length; j++) {
				if (Math.random() > 0.5) {
					offspringWeights.push(driverWeights[j]);
				} else {
					offspringWeights.push(partnerWeights[j]);
				}
			}
			newWeights.push(tf.tensor(offspringWeights, this.brain.weights[i].shape));
		}
		return new Driver(this.game, newWeights);
	}

}