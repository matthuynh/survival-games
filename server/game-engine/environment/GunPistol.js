const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");

// A Gun object of type Pistol, that inherits from Gun
module.exports = class GunPistol extends Gun {
	constructor(stage, owner, gunProps) {
		super(stage, owner, gunProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour) {
		// Gun has enough ammo
		if (this.numberBullets < 1) {
			return false;
		} 
		// Checks cooldown period
		else if (new Date().getTime() - this.previousFireTime >= this.cooldown) {
			this.bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(this.bullet);
			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
	}
}