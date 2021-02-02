import BackgroundImg from './assets/background.png';
import CornerRoad_right from './assets/road_corner_right.png';
import CornerRoad_left from './assets/road_corner_left.png';
import CornerRoad_up_right from './assets/road_corner_up_right.png';
import CornerRoad_up_left from './assets/road_corner_up_left.png';
import StraightRoad_h from './assets/road_straight_horizontal.png';
import StraightRoad_v from './assets/road_straight_vertical.png';
import BoxMaps from './BoxMaps';

const UNITS_BY_LENGTH = 16;

function loadImage(source) {
    let image = new Image();
    image.src = source;

    return image;
}

const images = {
	background: loadImage(BackgroundImg),
	cornerRight: loadImage(CornerRoad_right),
	cornerLeft: loadImage(CornerRoad_left),
	cornerUpRight: loadImage(CornerRoad_up_right),
	cornerUpLeft: loadImage(CornerRoad_up_left),
	straightHorizontal: loadImage(StraightRoad_h),
	straightVertical: loadImage(StraightRoad_v)
};

export default class Box {

	constructor(type, direction, row, col, game) {
		this.type = type;
		this.direction = direction;
		this.row = row;
		this.col = col;
		this.game = game;

		this.x = this.col * this.game.boxSize;
		this.y = (this.row + this.game.yOffset) * this.game.boxSize;

		this.units = JSON.parse(JSON.stringify(BoxMaps.empty));
		this.activeUnits = JSON.parse(JSON.stringify(BoxMaps.empty));

		this.setRoadImageAndUnits();
	}

	incrementUnitByPosition(x, y) {
		let row = Math.floor((((y - this.game.boxSize * this.game.yOffset) % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		let col = Math.floor(((x % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		if (row < 0) row = UNITS_BY_LENGTH + row;
		this.activeUnits[row][col]++;
	}

	setUnitByPosition(x, y, value) {
		let row = Math.floor((((y - this.game.boxSize * this.game.yOffset) % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		let col = Math.floor(((x % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		if (row < 0) row = UNITS_BY_LENGTH + row;
		this.activeUnits[row][col] = value;
	}

	getMapValueByPosition(x, y) {
		let row = Math.floor((((y - this.game.boxSize * this.game.yOffset) % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		let col = Math.floor(((x % this.game.boxSize) / this.game.boxSize) * UNITS_BY_LENGTH);
		if (row < 0) row = UNITS_BY_LENGTH + row;
		return this.units[row][col];
	}

	lower() {
		this.row++;
	}

	setTypeAndDirection(type, direction) {
		this.type = type;
		this.direction = direction;
		this.setRoadImageAndUnits();
	}

	resetTypeAndDirection() {
		this.type = null;
		this.direction = null;
		this.roadImage = null;
		this.units = JSON.parse(JSON.stringify(BoxMaps.empty));
		this.activeUnits = JSON.parse(JSON.stringify(BoxMaps.empty));
	}

	facingDirection() {
		if (this.type === null || this.direction === null) return null;
		if (this.direction === 'right') return 'right';
		if (this.direction === 'left') return 'left';
		if (this.direction.includes('up')) return 'up';
	}

	draw() {
		if (this.row > this.game.maxRows) {
			this.row = -1;
			this.resetTypeAndDirection();
		}

		this.x = this.col * this.game.boxSize;
		this.y = (this.row + this.game.yOffset) * this.game.boxSize;

		if (this.roadImage) {
			this.game.ctx.drawImage(this.roadImage,	this.x, this.y,	this.game.boxSize, this.game.boxSize);
		} else {
			this.game.ctx.drawImage(images.background,	this.x, this.y,	this.game.boxSize, this.game.boxSize);
		}

		if (this.game.gridOn) {
			this.drawMap();
			this.drawUnits();
			this.drawActiveUnits();
			this.activeUnits = JSON.parse(JSON.stringify(BoxMaps.empty));
		}
	}

	drawUnits() {
		let unitLength = this.game.boxSize / UNITS_BY_LENGTH;
		this.game.ctx.beginPath();
		for (let i = 1; i < UNITS_BY_LENGTH; i++) {
			// Horizontal lines
			this.game.ctx.moveTo(this.x, this.y + unitLength * i);
			this.game.ctx.lineTo(this.x + this.game.boxSize, this.y + unitLength * i);
			// Vertical lines
			this.game.ctx.moveTo(this.x + unitLength * i, this.y);
			this.game.ctx.lineTo(this.x + unitLength * i, this.y + this.game.boxSize);
		}
		this.game.ctx.strokeStyle = '#7d7d7d';
		this.game.ctx.stroke();
	}

	drawActiveUnits() {
		let unitLength = this.game.boxSize / UNITS_BY_LENGTH;
		for (let row = 0; row < UNITS_BY_LENGTH; row++) {
			for (let col = 0; col < UNITS_BY_LENGTH; col++) {
				let unitValue = this.activeUnits[col][row];
				let alpha = (unitValue <= 40)? (unitValue / 40) : 1;
				this.game.ctx.beginPath();
				this.game.ctx.fillStyle = 'rgba(0,0,255,' + alpha + ')';
				for (let i = 0; i < unitValue; i++) {
					this.game.ctx.fillRect(
						this.x + row * unitLength,
						this.y + col * unitLength,
						unitLength, unitLength
					)
				}
			}
		}
	}

	drawMap() {
		let unitLength = this.game.boxSize / UNITS_BY_LENGTH;
		this.game.ctx.fillStyle = 'rgba(255,0,0,0.4)';
		this.game.ctx.beginPath();
		for (let row = 0; row < UNITS_BY_LENGTH; row++) {
			for (let col = 0; col < UNITS_BY_LENGTH; col++) {
				let unitValue = this.units[col][row];
				switch (unitValue) {
					case 0:
						this.game.ctx.rect(
							this.x + row * unitLength,
							this.y + col * unitLength,
							unitLength, unitLength
						)
				}
			}
		}
		this.game.ctx.fill();
	}

	setRoadImageAndUnits() {
		if (this.type === 'straight') {
			switch (this.direction) {
				case 'right':
				case 'left':
					this.roadImage = images.straightHorizontal;
					this.units = BoxMaps.StraightRoad_h;
					break;
				case 'up':
					this.roadImage = images.straightVertical;
					this.units = BoxMaps.StraightRoad_v;
					break;
				default:
					return;
			}
		} else if (this.type === 'corner') {
			switch (this.direction) {
				case 'left':
					this.roadImage = images.cornerLeft;
					this.units = BoxMaps.CornerRoad_left;
					break;
				case 'right':
					this.roadImage = images.cornerRight;
					this.units = BoxMaps.CornerRoad_right;
					break;
				case 'up_left':
					this.roadImage = images.cornerUpLeft;
					this.units = BoxMaps.CornerRoad_up_left;
					break;
				case 'up_right':
					this.roadImage = images.cornerUpRight;
					this.units = BoxMaps.CornerRoad_up_right;
					break;
				default:
					return;
			}
		}
	}

}