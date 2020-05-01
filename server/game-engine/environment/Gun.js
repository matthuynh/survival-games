// TODO: See if we need to import Stages
const Bullet = require("./Bullet.js");

// A Gun object. A Player has a Gun object, and uses it to shoot Bullet objects. Gun objects create Bullets. A Gun knows who owns it
module.exports = class Gun {
	constructor(stage, startingBullets, bulletCapacity, range, bulletSpeed, cooldown, bulletDamage, owner) {
		this.stage = stage;
		this.numberBullets = startingBullets;
		this.bulletCapacity = bulletCapacity;
		this.range = range;
		this.bulletSpeed = bulletSpeed; // the gun determines how fast a bullet is fired
		this.bulletDamage = bulletDamage; // the gun determines how much damage its bullets do
		this.owner = owner;

		// Used to calculate the cooldown of the weapon
		this.cooldown = cooldown; // cooldown of fire rate in milliseconds
		this.previousFireTime = new Date().getTime(); // the previous time at which a bullet was fired (total milliseconds since Jan 1, 1970)
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour, bulletRadius) {
		if (this.numberBullets < 1) {
			return false;
		} else if (new Date().getTime() - this.previousFireTime >= this.cooldown) {
			this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(this.bullet);
			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shootBurst(position, cursorDirection, firingVector, colour, bulletRadius) {
		if (this.numberBullets < 1) {
			return false;
		} else {
			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed / 1.1, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, bulletRadius, this.range, this.bulletSpeed / 1.2, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			this.previousFireTime = new Date().getTime();
			return true;
		}
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