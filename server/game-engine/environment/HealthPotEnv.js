const Circle = require("./Circle.js");

// A buff that restores the player's health
module.exports = class HealthPotEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this HealthPot
    getJSONRepresentation() {
        return {
            type: "HealthPotEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}