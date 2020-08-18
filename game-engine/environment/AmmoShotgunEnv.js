const AmmoEnv = require("./AmmoEnv.js");

// An Ammo object that Players can use to restock ammo
module.exports = class AmmoShotgunEnv extends AmmoEnv {
	constructor(position, colour, radius) {
		super(position, colour, radius);
	}
    
    // Return a JSON representation of this ammo
    getJSONRepresentation() {
        return {
            type: "AmmoShotgunEnv",
            x: this.x,
            y: this.y,
            radius: this.radius,
            colour: this.colour
        }
    }
}
