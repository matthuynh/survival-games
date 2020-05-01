const Circle = require("./Circle.js");

// An Ammo object that Players can use to restock ammo
module.exports = class AmmoEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this ammo
    getJSONRepresentation() {
        return {
            type: "AmmoEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}
