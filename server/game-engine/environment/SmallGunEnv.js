const Circle = require("./Circle.js");

// A small gun that Players can use to pick up
module.exports = class SmallGunEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this small gun
    getJSONRepresentation() {
        return {
            type: "SmallGunEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}
