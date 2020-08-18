const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");
const Pair = require("./Pair.js");

// A Gun object of type Shotgun, that inherits from Gun
module.exports = class GunShotgun extends Gun {
	constructor(stage, owner) {
		const rifleProps = {
			startingBullets: 10,
			bulletCapacity: 40,
			bulletSpeed: 20,
			bulletDamage: 30,
			bulletRadius: 10,
			range: 400,
			cooldown: 500
		}
		
		super(stage, owner, rifleProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingProps, colour) {
		if (this.numberBullets > 0 && (new Date().getTime() - this.previousFireTime >= this.cooldown)) {
			const firingVector = new Pair(firingProps.x, firingProps.y);
			firingVector.normalize();
			console.log(firingVector);
			let bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(bullet);

			firingVector.x -= 0.10;
			console.log(firingVector);
			bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(bullet);

			firingVector.x += 0.20;
			console.log(firingVector);
			bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
			this.stage.addActor(bullet);
			

			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
		return false;
	}

	_spreadHelper(position, cursorDirection, firingVector, colour) {
		let bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
		this.stage.addActor(bullet);
	}
}