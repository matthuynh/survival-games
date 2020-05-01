const Circle = require("./Circle.js");

// A buff that gives users a movement boost
module.exports = class SpeedBoostEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this speed boost
    getJSONRepresentation() {
        return {
            type: "SpeedBoostEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}