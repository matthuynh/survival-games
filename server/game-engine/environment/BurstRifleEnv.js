const Circle = require("./Circle.js");

// A big gun that Players can use to pick up
module.exports = class BurstRifleEnv extends Circle {
	constructor(position, colour, radius) {
		super(position, colour, radius);
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Included this empty method here, as all actors need a Step method
	step() {
    }
    
    // Return a JSON representation of this big gun
    getJSONRepresentation() {
        return {
            type: "BurstRifleEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }   
}
