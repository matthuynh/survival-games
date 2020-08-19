const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");

// A Gun object of type Pistol, that inherits from Gun
module.exports = class GunPistolBot extends Gun {
	constructor(stage, owner) {
		const pistolProps = {
			startingBullets: 20,
			bulletCapacity: 20,
			bulletSpeed: 35,
			bulletDamage: 5,
			bulletRadius: 4,
			range: 800,
			cooldown: 1000
		}
		super(stage, owner, pistolProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour) {
		// Check if gun has enough ammo, and if cooldown period is over firing
		if (this.numberBullets > 0 && (new Date().getTime() - this.previousFireTime >= this.cooldown)) {
			let bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(bullet);
			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
		return false;
	}
}