const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");
const Pair = require("./Pair.js");

// Return a random float between 0 and n, inclusive
function rand(n) { return Math.random() * n; }
const spreadTolerance = 0.30;

// A Gun object of type Shotgun, that inherits from Gun
module.exports = class GunShotgunBot extends Gun {
	constructor(stage, owner) {
		const rifleProps = {
			startingBullets: 8,
			bulletCapacity: 8,
			bulletSpeed: 40,
			bulletDamage: 8,
			bulletRadius: 2,
			range: 300,
			cooldown: 3000
		}
		super(stage, owner, rifleProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingProps, colour) {
		if (this.numberBullets > 0 && (new Date().getTime() - this.previousFireTime >= this.cooldown)) {
			const firingVector = new Pair(firingProps.x, firingProps.y);
			firingVector.normalize();
			
			for (let i = 0; i < 5; i++) {
				let bullet = new Pair(firingVector.x - rand(spreadTolerance), firingVector.y - rand(spreadTolerance));
				bullet.normalize();
				this._spreadHelper(position, cursorDirection, bullet, colour);
			}
			for (let i = 0; i < 5; i++) {
				let bullet = new Pair(firingVector.x + rand(spreadTolerance), firingVector.y + rand(spreadTolerance));
				bullet.normalize();
				this._spreadHelper(position, cursorDirection, bullet, colour);
			}
	
			this.numberBullets -= 1;
			this.previousFireTime = new Date().getTime();
			return true;
		}
		return false;
	}

	_spreadHelper(position, cursorDirection, firingVector, colour) {
		// console.log(firingVector);
		let bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
		this.stage.addActor(bullet);
	}
}