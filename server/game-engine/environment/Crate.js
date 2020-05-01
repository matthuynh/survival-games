const Rectangle = require("./Rectangle.js");
const Pair = require("./Pair.js");

// A Crate class
module.exports = class Crate extends Rectangle {
	constructor(startingX, startingY, colour, width, height) {
		super(new Pair(startingX, startingY), colour, width, height);
		this.width = width;
		this.height = height;
    }
    
    // Return a JSON representation of this crate
    getJSONRepresentation() {
        return {
            crateColour: this.colour,
            crateX: this.position.x,
            crateY: this.position.y,
            crateWidth: this.width,
            crateHeight: this.height
        }
    }

	toString() {
		return `Crate: (${this.x},${this.y})`;
	}

	// Take one "step" for animation
	step() {
	}
}