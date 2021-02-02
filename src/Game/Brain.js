import * as tf from '@tensorflow/tfjs';
import {Tensor} from '@tensorflow/tfjs';

/**
 * Class Brain
 * @property {Number[]} neurons
 * @property {Tensor[]} weights
 */
export default class Brain {

	/**
	 * Constructor for Brain
	 * @param {Number[]} neurons
	 * @param {Tensor[]} [weights]
	 */
	constructor(neurons, weights=null) {
		this.neurons = neurons;
		if (weights) {
			this.weights = weights;
		} else {
			this.weights = this.generateRandomWeights();
		}
	}

	/**
	 * Activates the network and returns the output values
	 * @param {Number[]} inputs
	 * @return {Number[]} outputs
	 */
	activate(inputs) {
		let outputs = [];
		tf.tidy(() => {
			let lastValues = tf.tensor(inputs, [1, this.neurons[0]]);
			this.weights.forEach((weights) => {
				lastValues = lastValues.matMul(weights).sigmoid();
			});
			outputs = lastValues.dataSync();
		});
		return outputs;
	}

	activateAsync(inputs) {
		return new Promise((resolve) => {
			tf.tidy(() => {
				let lastValues = tf.tensor(inputs, [1, this.neurons[0]]);
				this.weights.forEach((weights) => {
					lastValues = lastValues.matMul(weights).sigmoid();
				});
				lastValues.data()
				.then((data) => resolve(data));
			});
		});
	}

	/**
	 * Generates random weights from neurons
	 * @return {Tensor[]} weights
	 */
	generateRandomWeights() {
		let weights = [];
		for (let i = 0; i < this.neurons.length - 1; i++) {
			weights.push(tf.randomNormal([this.neurons[i], this.neurons[i + 1]]));
		}
		return weights;
	}

	/**
	 * Clones the weights and returns a new Brain
	 * @return {Brain} brain
	 */
	clone() {
		let weightsCopy = this.weights.map(weights => tf.clone(weights));
		return new Brain(this.neurons.slice(), weightsCopy);
	}

	/**
	 * Disposes of the weights from the GPU memory
	 */
	dispose() {
		this.weights.forEach(weights => weights.dispose());
	}

}