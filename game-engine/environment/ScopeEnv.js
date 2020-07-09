const Circle = require("./Circle.js");

// A buff that allows a user to see a Line originating from their player to the mouse
module.exports = class ScopeEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }

    // Return a JSON representation of this ScopeEnv
    getJSONRepresentation() {
        return {
            type: "ScopeEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}
