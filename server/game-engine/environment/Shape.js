// A general Shape class. Shapes are extended by Circles and Rectangles
module.exports = class Shape {
	constructor(position, colour) {
		this.position = position;
		this.colour = colour;
	}

	getStartingPosition() {
		return this.position;
	}

	getStartingX() {
		return this.position.x;
	}

	getStartingY() {
		return this.position.y;
	}
}