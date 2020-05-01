const Circle = require("./Circle.js");

// A Bush object that Players can use to hide themselves in
module.exports = class BushEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
    }
    
    // Return a JSON representation of this bush
    getJSONRepresentation() {
        return {
            type: "BushEnv",
            bushX: this.x,
            bushY: this.y,
            bushRadius: this.radius,
            bushColour: this.colour
        }
    }

	// Included this empty method here, as all actors need a Step method
	step() {
	}
}