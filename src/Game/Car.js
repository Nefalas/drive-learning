import PorscheImage from './assets/Porsche.png';
import Keys from './utils/Keys';

const TURNING_POINT_DISTANCE = 1.5;

const TURNING_STEP = 0.07;
const MAX_DRIVING_SPEED = 4.8;
const DRIVING_STEP_MULTIPLIER = 0.03;

const VIEW_DISTANCE = 100;

const PADDING = 1/16;

const POINTS_BY_LENGTH = 16;

const MAP_SCORE_LIMIT = 80;

export default class Car {

	constructor(game) {
		this.game = game;
		this.x = this.game.boxSize * 1.5;
		this.y = this.game.height / 2;
		this.width = this.game.boxSize / 6;
		this.height = this.width * 2;
		this.carImage = null;

		this.drivingStep = 0;
		this.lastDirection = null;
		this.lastTurn = null;
		this.lastRoadTurn = null;

		this.maxDistance = PADDING * this.game.boxSize;

		this.angle = 0;
		this.goingForwards = false;
		this.goingBackwards = false;
		this.turningLeft = false;
		this.turningRight = false;

		this.corners = null;
		this.viewDistances = null;

		this.hasLost = false;
		this.mapScore = null;

		this.totalDistance = 0;
		this.totalTurns = 0;
		this.totalRoadTurns = 0;
		this.finalScore = null;

		this.showHelpers = false;
		this.showCar = true;
		this.showPoints = false;

		this.driveAction = null;

		this.updateDrivingStep = this.updateDrivingStep.bind(this);
		this.loadCarImage = this.loadCarImage.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.getViewDistances = this.getViewDistances.bind(this);

		this.loadCarImage();
	}

	update() {
		return new Promise((resolve) => {
			this.drive().then(() => {
				this.updateDrivingStep();

				let step = TURNING_STEP * this.getDrivingStep();
				if (this.turningLeft) {
					this.angle -= step;
					if (this.lastTurn !== 'left') this.totalTurns++;
					this.lastTurn = 'left';
				} else if (this.turningRight) {
					this.angle += step;
					if (this.lastTurn !== 'right') this.totalTurns++;
					this.lastTurn = 'right';
				}

				let newX = this.x, newY = this.y;
				if (this.drivingStep) {
					newX = this.x + Math.sin(this.angle) * this.getDrivingStep() * MAX_DRIVING_SPEED;
					newY = this.y - Math.cos(this.angle) * this.getDrivingStep() * MAX_DRIVING_SPEED;
				} else if (this.drivingStep && (this.goingBackwards || this.lastDirection === 'backward')) {
					newX = this.x - Math.sin(this.angle) * this.getDrivingStep() * MAX_DRIVING_SPEED;
					newY = this.y + Math.cos(this.angle) * this.getDrivingStep() * MAX_DRIVING_SPEED;
				}
				let futureY = newY + this.game.getSpeed() * this.game.boxSize;
				if (this.isInBoundingBox(newX, futureY)) {
					this.totalDistance += Math.sqrt(Math.pow(newX - this.x, 2) + Math.pow(newY - this.y, 2)) * Math.sign(this.getDrivingStep());
					this.x = newX;
					this.y = futureY;
				} else {
					this.loose();
				}

				let box = this.game.getBoxByPosition(this.x, this.y);
				let currentRoadTurn = null;
				if (box.type === 'corner') {
					if (box.direction.includes('left')) {
						currentRoadTurn = 'left';
					} else if (box.direction.includes('right')) {
						currentRoadTurn = 'right';
					}
				}

				if (currentRoadTurn !== null	&& this.lastRoadTurn !== currentRoadTurn) {
					this.lastRoadTurn = currentRoadTurn;
					this.totalRoadTurns++;
				}

				this.corners = this.getCorners();
				this.viewDistances = this.getViewDistances();

				resolve();
			})
		})
	}

	drive() {
		return new Promise((resolve) => {
			if (this.driveAction !== null && this.game.frame % 6 === 0) {
				this.driveAction().then(resolve);
			} else {
				resolve();
			}
		})
	}

	getDrivingStep() {
		return this.drivingStep * this.game.speedModifier;
	}

	updateDrivingStep() {
		if (this.goingForwards) {
			this.drivingStep += (1 - this.drivingStep) * DRIVING_STEP_MULTIPLIER;
		} else if (this.goingBackwards) {
			this.drivingStep -= (1 + this.drivingStep) * DRIVING_STEP_MULTIPLIER;
		} else if (this.drivingStep !== 0) {
			this.drivingStep -= this.drivingStep * DRIVING_STEP_MULTIPLIER * .2;
			if (Math.abs(this.drivingStep) < 0.05) this.drivingStep = 0;
		}
	}

	draw() {
		if (this.carImage) {
			this.drawBoundingBox();

			this.game.ctx.save();
			this.game.ctx.translate(this.x, this.y);

			this.drawOrigin();

			this.game.ctx.rotate(this.angle);

			if (this.showCar) {
				this.game.ctx.drawImage(
					this.carImage,
					-this.width / 2, -(this.height / 2) * TURNING_POINT_DISTANCE,
					this.width, this.height
				);
			}

			this.drawHitbox();

			this.game.ctx.restore();

			this.activateUnits();
			this.drawCorners();

			this.drawViewDistances(this.viewDistancePoints, this.viewDistances);

			this.checkCarState();
		}
	}

	addDriveAction(drive) {
		this.driveAction = drive;
	}

	checkCarState() {
		if (this.mapScore !== null && this.mapScore < MAP_SCORE_LIMIT && this.game.canLoose) {
			this.loose();
		}
	}

	loose() {
		this.finalScore = this.game.score;
		this.hasLost = true;
	}

	activateUnits() {
		let {
			topLeftX, topLeftY,
			bottomLeftX, bottomLeftY,
			bottomRightX, bottomRightY
		} = this.corners;

		let wx = (bottomRightX - bottomLeftX) / (POINTS_BY_LENGTH / 2);
		let wy = (bottomRightY - bottomLeftY) / (POINTS_BY_LENGTH / 2);
		let lx = (topLeftX - bottomLeftX) / POINTS_BY_LENGTH;
		let ly = (topLeftY - bottomLeftY) / POINTS_BY_LENGTH;

		let total = 0;

		for (let l = 1; l < POINTS_BY_LENGTH; l++) {
			for (let w = 1; w < POINTS_BY_LENGTH / 2; w++) {
				let x = bottomLeftX + l * lx + w * wx;
				let y = bottomLeftY + l * ly + w * wy;

				let box = this.game.getBoxByPosition(x, y);
				if (box) {
					box.incrementUnitByPosition(x, y);
					total += box.getMapValueByPosition(x, y);
				}

				if (this.showPoints) {
					this.game.ctx.beginPath();
					this.game.ctx.arc(x, y, 2, 0, 2 * Math.PI);
					this.game.ctx.fill();
				}
			}
		}

		this.mapScore = total;
	}

	drawHitbox() {
		if (this.showHelpers) {
			this.game.ctx.strokeStyle = '#000aec';
			this.game.ctx.strokeRect(
				-this.width / 2, -(this.height / 2) * TURNING_POINT_DISTANCE,
				this.width, this.height
			);
		}
	}

	getViewDistances() {
		let points = {
			front: {},
			back: {},
			left: {},
			right: {},
			topLeft: {},
			topRight: {},
			bottomLeft: {},
			bottomRight: {}
		};

		// Front
		points.front.startX = this.corners.topX;
		points.front.startY = this.corners.topY;
		points.front.endX = points.front.startX + Math.sin(this.angle) * VIEW_DISTANCE;
		points.front.endY = points.front.startY - Math.cos(this.angle) * VIEW_DISTANCE;
		// Back
		points.back.startX = this.corners.bottomX;
		points.back.startY = this.corners.bottomY;
		points.back.endX = points.back.startX - Math.sin(this.angle) * VIEW_DISTANCE;
		points.back.endY = points.back.startY + Math.cos(this.angle) * VIEW_DISTANCE;
		// Left
		points.left.startX = (this.corners.topLeftX - this.corners.bottomLeftX) / 2 + this.corners.bottomLeftX;
		points.left.startY = (this.corners.topLeftY - this.corners.bottomLeftY) / 2 + this.corners.bottomLeftY;
		points.left.endX = points.left.startX + Math.sin(this.angle - Math.PI / 2) * VIEW_DISTANCE;
		points.left.endY = points.left.startY - Math.cos(this.angle - Math.PI / 2) * VIEW_DISTANCE;
		// Right
		points.right.startX = (this.corners.topRightX - this.corners.bottomRightX) / 2 + this.corners.bottomRightX;
		points.right.startY = (this.corners.topRightY - this.corners.bottomRightY) / 2 + this.corners.bottomRightY;
		points.right.endX = points.right.startX - Math.sin(this.angle - Math.PI / 2) * VIEW_DISTANCE;
		points.right.endY = points.right.startY + Math.cos(this.angle - Math.PI / 2) * VIEW_DISTANCE;
		// Top Left
		points.topLeft.startX = this.corners.topLeftX;
		points.topLeft.startY = this.corners.topLeftY;
		points.topLeft.endX = points.topLeft.startX + Math.sin(this.angle - Math.PI / 4) * VIEW_DISTANCE;
		points.topLeft.endY = points.topLeft.startY - Math.cos(this.angle - Math.PI / 4) * VIEW_DISTANCE;
		// Top Right
		points.topRight.startX = this.corners.topRightX;
		points.topRight.startY = this.corners.topRightY;
		points.topRight.endX = points.topRight.startX + Math.sin(this.angle + Math.PI / 4) * VIEW_DISTANCE;
		points.topRight.endY = points.topRight.startY - Math.cos(this.angle + Math.PI / 4) * VIEW_DISTANCE;
		// Bottom Left
		points.bottomLeft.startX = this.corners.bottomLeftX;
		points.bottomLeft.startY = this.corners.bottomLeftY;
		points.bottomLeft.endX = points.bottomLeft.startX + Math.sin(this.angle - Math.PI * (3 / 4)) * VIEW_DISTANCE;
		points.bottomLeft.endY = points.bottomLeft.startY - Math.cos(this.angle - Math.PI * (3 / 4)) * VIEW_DISTANCE;
		// Bottom Right
		points.bottomRight.startX = this.corners.bottomRightX;
		points.bottomRight.startY = this.corners.bottomRightY;
		points.bottomRight.endX = points.bottomRight.startX + Math.sin(this.angle + Math.PI * (3 / 4)) * VIEW_DISTANCE;
		points.bottomRight.endY = points.bottomRight.startY - Math.cos(this.angle + Math.PI * (3 / 4)) * VIEW_DISTANCE;

		this.viewDistancePoints = points;

		let distances = {};
		Object.keys(points).map((key) => {
			let dx = (points[key].endX - points[key].startX) / VIEW_DISTANCE;
			let dy = (points[key].endY - points[key].startY) / VIEW_DISTANCE;
			for (let dist = 0; dist < VIEW_DISTANCE; dist++) {
				let x = points[key].startX + dist * dx;
				let y = points[key].startY + dist * dy;
				if (
					x <= 0 || y <= 0 ||
					x >= this.game.width || y >= this.game.height ||
					this.game.getBoxByPosition(x, y).getMapValueByPosition(x, y) === 0
				) {
					distances[key] = {
						normalised: 1 - (dist / VIEW_DISTANCE),
						dist,	x, y
					};
					return;
				}
			}
			distances[key] = {
				normalised: 0,
				dist: VIEW_DISTANCE,
				x: points[key].endX,
				y: points[key].endY
			};
		});

		return distances;
	}

	drawViewDistances(points, distances) {
		if (this.showHelpers) {
			this.game.ctx.strokeStyle = '#000';
			this.game.ctx.fillStyle = '#ff0000';

			Object.keys(points).forEach((key) => {
				this.game.ctx.beginPath();
				this.game.ctx.moveTo(points[key].startX, points[key].startY);
				this.game.ctx.lineTo(points[key].endX, points[key].endY);
				this.game.ctx.stroke();
				this.game.ctx.beginPath();
				this.game.ctx.arc(distances[key].x, distances[key].y, 2, 0, 2 * Math.PI);
				this.game.ctx.fill();
			});

		}
	}

	getCorners() {
		let cosAngle = Math.cos(this.angle);
		let sinAngle = Math.sin(this.angle);

		let topHeight = (TURNING_POINT_DISTANCE / 2 * this.height);
		let bottomHeight = ((TURNING_POINT_DISTANCE - 2) / 2 * this.height);

		let topX = this.x + topHeight * sinAngle;
		let topY = this.y - topHeight * cosAngle;

		let bottomX = this.x + bottomHeight * sinAngle;
		let bottomY = this.y - bottomHeight * cosAngle;

		let halfWidth = this.width / 2;
		let xDist = halfWidth * cosAngle;
		let yDist = halfWidth * sinAngle;

		return {
			topX,
			topY,
			bottomX,
			bottomY,
			topLeftX: topX - xDist,
			topLeftY: topY - yDist,
			topRightX: topX + xDist,
			topRightY: topY + yDist,
			bottomLeftX: bottomX - xDist,
			bottomLeftY: bottomY - yDist,
			bottomRightX: bottomX + xDist,
			bottomRightY: bottomY + yDist
		};
	}

	drawCorners() {
		if (this.showHelpers) {
			let {
				topLeftX, topLeftY,
				topRightX, topRightY,
				bottomLeftX, bottomLeftY,
				bottomRightX, bottomRightY
			} = this.corners;

			this.game.ctx.fillStyle = '#000aec';

			this.game.ctx.beginPath();
			this.game.ctx.arc(topLeftX, topLeftY, 2, 0, 2 * Math.PI);
			this.game.ctx.fill();

			this.game.ctx.beginPath();
			this.game.ctx.arc(topRightX, topRightY, 2, 0, 2 * Math.PI);
			this.game.ctx.fill();

			this.game.ctx.beginPath();
			this.game.ctx.arc(bottomLeftX, bottomLeftY, 2, 0, 2 * Math.PI);
			this.game.ctx.fill();

			this.game.ctx.beginPath();
			this.game.ctx.arc(bottomRightX, bottomRightY, 2, 0, 2 * Math.PI);
			this.game.ctx.fill();
		}
	}

	drawBoundingBox() {
		if (this.showHelpers) {
			this.game.ctx.beginPath();
			this.game.ctx.strokeStyle = '#e20200';
			this.game.ctx.strokeRect(
				this.maxDistance, this.maxDistance,
				this.game.width - 2 * this.maxDistance, this.game.height - 2 *
				this.maxDistance
			);
		}
	}

	drawOrigin() {
		if (this.showHelpers) {
			this.game.ctx.strokeStyle = '#000aec';
			this.game.ctx.beginPath();
			this.game.ctx.moveTo(-this.x, 0);
			this.game.ctx.lineTo(this.game.width - this.x, 0);
			this.game.ctx.moveTo(0, -this.y);
			this.game.ctx.lineTo(0, this.game.height - this.y);
			this.game.ctx.stroke();
		}
	}



	isInBoundingBox(newX, newY) {
		return (
			newX > this.maxDistance
			&& newX < (this.game.width - this.maxDistance)
			&& newY > this.maxDistance
			&& newY < (this.game.height - this.maxDistance)
		)
	}

	loadCarImage() {
		let image = new Image();
		image.src = PorscheImage;
		this.carImage = image;
	}

	handleKeyDown(event) {
		if (this.game.frenchMode) {
			switch (event.keyCode) {
				case Keys.q:
				case Keys.left:
					if (!this.turningLeft) {
						this.turningRight = false;
						this.turningLeft = true;
					}
					return;
				case Keys.d:
				case Keys.right:
					if (!this.turningRight) {
						this.turningLeft = false;
						this.turningRight = true;
					}
					return;
				case Keys.z:
				case Keys.up:
					if (!(this.goingBackwards || this.goingForwards)) {
						this.goingForwards = true;
						this.lastDirection = 'forward';
					}
					return;
				case Keys.s:
				case Keys.down:
					if (!(this.goingForwards || this.goingBackwards)) {
						this.goingBackwards = true;
						this.lastDirection = 'backward';
					}
					return;
			}
		} else {
			switch (event.keyCode) {
				case Keys.a:
				case Keys.left:
					if (!this.turningLeft) {
						this.turningRight = false;
						this.turningLeft = true;
					}
					return;
				case Keys.d:
				case Keys.right:
					if (!this.turningRight) {
						this.turningLeft = false;
						this.turningRight = true;
					}
					return;
				case Keys.w:
				case Keys.up:
					if (!(this.goingBackwards || this.goingForwards)) {
						this.goingForwards = true;
						this.lastDirection = 'forward';
					}
					return;
				case Keys.s:
				case Keys.down:
					if (!(this.goingForwards || this.goingBackwards)) {
						this.goingBackwards = true;
						this.lastDirection = 'backward';
					}
					return;
			}
		}
	}

	handleKeyUp(event) {
		if (this.game.frenchMode) {
			switch (event.keyCode) {
				case Keys.q:
				case Keys.left:
					this.turningLeft = false;
					return;
				case Keys.d:
				case Keys.right:
					this.turningRight = false;
					return;
				case Keys.z:
				case Keys.up:
					this.goingForwards = false;
					return;
				case Keys.s:
				case Keys.down:
					this.goingBackwards = false;
					return;
			}
		} else {
			switch (event.keyCode) {
				case Keys.a:
				case Keys.left:
					this.turningLeft = false;
					return;
				case Keys.d:
				case Keys.right:
					this.turningRight = false;
					return;
				case Keys.w:
				case Keys.up:
					this.goingForwards = false;
					return;
				case Keys.s:
				case Keys.down:
					this.goingBackwards = false;
					return;
			}
		}
	}

}