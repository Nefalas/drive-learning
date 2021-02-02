import * as tf from '@tensorflow/tfjs';
import Driver from '../Driver';

export default class StateSaver {

	static savePopulation(sortedPopulation) {
		let savedData = [];
		for (let i = 0; i < 5; i++) {
			if (i >= sortedPopulation.length) return;
			let driverData = sortedPopulation[i];
			let driver = {};
			driver.id = driverData.uniqueID;
			driver.weights = [];
			for (let weightData of driverData.brain.weights) {
				let weight = {};
				weight.shape = weightData.shape;
				weight.values = weightData.dataSync();
				driver.weights.push(weight);
			}
			savedData.push(driver);
		}
		window.localStorage.setItem('population', JSON.stringify(savedData));
		console.log('Weights saved');
	}

	static restorePopulation(total, game) {
		let population = [];
		let savedPopulation = JSON.parse(window.localStorage.getItem('population'));
		for (let i = 0; i < total; i++) {
			let index = i % savedPopulation.length;
			let driverData = savedPopulation[index];
			let driverWeightData = driverData.weights;
			let weights = [];
			driverWeightData.forEach((weightData) => {
				weights.push(tf.tensor(Object.values(weightData.values), weightData.shape));
			});
			let driver = new Driver(game, weights);
			if (i >= savedPopulation.length) {
				driver.mutate();
			} else {
				driver.uniqueID = driverData.id;
			}
			population.push(driver);
		}
		return population;
	}

	static downloadPopulation() {
		let populationString = window.localStorage.getItem('population');
		let link = document.createElement('a');
		link.download = 'population.json';
		let blob = new Blob([populationString], {type: 'text/plain'});
		link.href = URL.createObjectURL(blob);
		link.click();
	}

	static uploadPopulation(event) {
		let weightFile = event.target.files[0];
		if (!weightFile) return;

		let reader = new FileReader();
		reader.onload = function(e) {
			let content = e.target['result'];
			window.localStorage.setItem('population', content);
			console.log('Population uploaded');
		};
		reader.readAsText(weightFile);
	}

	static deletePopulation() {
		window.localStorage.removeItem('population');
		console.log('Population deleted');
	}

	static hasPopulation() {
		return window.localStorage.getItem('population') != null;
	}

}