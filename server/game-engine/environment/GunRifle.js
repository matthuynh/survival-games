const Bullet = require("./Bullet.js");
const Gun = require("./Gun.js");

// A Gun object of type Rifle, that inherits from Gun
module.exports = class GunRifle extends Gun {
	constructor(stage, owner, gunProps) {
		super(stage, owner, gunProps);
	}

	// Return True if the gun is able to create and shoot a Bullet, else False
	shoot(position, cursorDirection, firingVector, colour) {
		// TODO: Make a helper to structure this better
		if (this.numberBullets < 1) {
			return false;
		} else {
			if (this.numberBullets > 0) {
				this.bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
				this.stage.addActor(this.bullet);
				this.numberBullets -= 1;
			}

			if (this.numberBullets > 0) {
				setTimeout( () => {
					this.bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
					this.stage.addActor(this.bullet);
					this.numberBullets -= 1;

					if(this.numberBullets > 0) {

						setTimeout( () => {
							this.bullet = new Bullet(position, cursorDirection, firingVector, colour, this.bulletRadius, this.range, this.bulletSpeed, this.bulletDamage, this.owner);
							this.stage.addActor(this.bullet);
							this.numberBullets -= 1;
						}, 50)
					}
				}, 50
				)	
			}


			this.previousFireTime = new Date().getTime();
			return true;
		}
	}
}