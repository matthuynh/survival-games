const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");

// A Gun object of type Rifle, that inherits from Gun
module.exports = class GunRifle extends Gun {
	constructor(stage, owner) {
		const rifleProps = {
			startingBullets: 100,
			bulletCapacity: 200,
			bulletSpeed: 30,
			bulletDamage: 5,
			bulletRadius: 3,
			range: 1600,
			cooldown: 0
		}
		
		super(stage, owner, rifleProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour) {
		if (this.numberBullets < 1) {
			return false;
		} else {
			// 3-burst fire behaviour
			if (this.numberBullets > 0) {
				this._burstHelper(position, cursorDirection, firingVector, colour);
				if (this.numberBullets > 0) {
					setTimeout( () => {
						this._burstHelper(position, cursorDirection, firingVector, colour);
						if (this.numberBullets > 0) {
							setTimeout( () => {
								this._burstHelper(position, cursorDirection, firingVector, colour);
							}, 50);
						}
					}, 50);
				}
			}
			this.previousFireTime = new Date().getTime();
			return true;
		}
	}

	_burstHelper(position, cursorDirection, firingVector, colour) {
		let bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
		this.stage.addActor(bullet);
		this.numberBullets -= 1;
	}
}