const Shape = require("./Shape.js");

// A general Circle class. Circles include the Player, Bullets, Enemies, Bushes, and more
module.exports = class Circle extends Shape {
	constructor(position, colour, radius) {
		super(position, colour);
		this.radius = radius;
	}

	getJSONRepresentation() {
	}

	step() {
	}

	getRadius() {
		return this.radius;
	}
}