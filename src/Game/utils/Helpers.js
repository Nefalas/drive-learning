export default class Helpers {

	static randomGaussian() {
		let x1, x2, rad;
		do {
			x1 = 2 * Math.random() - 1;
			x2 = 2 * Math.random() - 1;
			rad = Math.pow(x1, 2) + Math.pow(x2, 2);
		} while (rad >= 1 || rad === 0);
		let c = Math.sqrt(-2 * Math.log(rad) / rad);
		return x1 * c;
	}

	static random(min, max) {
		return Math.random() * (max - min) + min;
	}

	static randomWeighted(array, weights) {
		let weightTotal = weights.reduce((prev, cur) => prev + cur);
		let randomIndex = Helpers.random(0, weightTotal);

		let sum = 0;
		for (let i = 0; i < array.length; i++) {
			sum += weights[i];

			if (randomIndex <= sum) return array[i];
		}
	}

	static formatInt(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	}

}