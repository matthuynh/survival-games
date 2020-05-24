const Bullet = require("./Bullet.js");

// A Gun object. A Player has a Gun object, and uses it to shoot Bullet objects. Gun objects create Bullets. A Gun knows who owns it
module.exports = class Gun {
	constructor(stage, owner, gunProps) {
		this.stage = stage;
		this.owner = owner;

		this.numberBullets = gunProps.startingBullets;
		this.bulletCapacity = gunProps.bulletCapacity;
		this.bulletSpeed = gunProps.bulletSpeed; // the gun determines how fast a bullet is fired
		this.bulletDamage = gunProps.bulletDamage; // the gun determines how much damage its bullets do
		this.bulletRadius = gunProps.bulletRadius;
		this.range = gunProps.range;
		this.cooldown = gunProps.cooldown; // cooldown of fire rate in milliseconds

		this.previousFireTime = new Date().getTime(); // the previous time at which a bullet was fired (total milliseconds since Jan 1, 1970)
	}

	// Reloads a gun by giving it more bullets
	reloadGun(bulletCount) {
		this.numberBullets += bulletCount;
	}

	// Return the range of this gun
	getRange() {
		return this.range;
	}

	// Return the number of bullets this gun has left
	getRemainingBullets() {
		return this.numberBullets;
	}

	// Return the ammo capacity of this gun
	getAmmoCapacity() {
		return this.bulletCapacity;
	}
}