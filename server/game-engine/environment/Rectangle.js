const Shape = require("./Shape.js");

// A general Rectangle class. Rectangles include Ammo that can be picked up, Crates, and more
module.exports = class Rectangle extends Shape {
	constructor(position, colour, width, height) {
		super(position, colour);
		this.width = width;
		this.height = height;
	}

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}
}