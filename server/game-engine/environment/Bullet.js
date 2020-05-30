const Circle = require("./Circle.js");
const Crate = require("./Crate.js");
const CollisionEngine = require("../CollisionEngine.js");

// Return the distance between two points, given the x and y coordinate of each point
function distanceBetweenTwoPoints(startingX, startingY, endingX, endingY) {
	return Math.sqrt((startingX - endingX) ** 2 + (startingY - endingY) ** 2);
}

// A Bullet object. A Gun object has Bullet objects, which it can shoot. A Bullet also knows which player shot it.
module.exports = class Bullet extends Circle {
	constructor(playerPosition, cursorDirection, bulletVector, colour, radius, range, bulletSpeed, bulletDamage, owner) {
		super(playerPosition, colour, radius);
		this.originalPosition = playerPosition; // the position where the bullet was shot
		this.setBulletPosition(); // this.x, this.y are the int versions of this.position
		this.dx = 0;
		this.dy = 0;
		this.cursorDirection = cursorDirection;
		this.setBulletVector(bulletVector.x, bulletVector.y, bulletSpeed);
		this.bulletSpeed = bulletSpeed;
		this.bulletDamage = bulletDamage;
		this.range = range;
		this.owner = owner; // bullet knows who fired it
	}

    // Return a JSON representation of this bullet
    getJSONRepresentation() {
        return {
            bulletX: this.x,
            bulletY: this.y,
            bulletRadius: this.radius,
            bulletColour: this.colour,
            bulletCursorDirectionX: this.cursorDirection.x,
            bulletCursorDirectionY: this.cursorDirection.y
        }
    }
    

	// Set this.x and this.y to the original position of the bullet
	setBulletPosition() {
		this.x = Math.round(this.originalPosition.x);
		this.y = Math.round(this.originalPosition.y);
	}

	// Returns a string representation of the Bullet's current location
	toString() {
		return "Bullet (starting position): " + this.originalPosition.toString();
	}

	// Sets the movement direction and speed for the bullet
	setBulletVector(dx, dy, bulletSpeed) {
		if (dx != 0) { this.dx = dx * bulletSpeed; }
		if (dy != 0) { this.dy = dy * bulletSpeed; }
	}

	// Take one "step" for animation, checking for collisions and the like
	step(stage) {
		let destinationX = this.x + this.dx;
        let destinationY = this.y + this.dy;

		// Remove the bullet from the stage if it has exceeded its maximum range
		if (distanceBetweenTwoPoints(this.originalPosition.x, this.originalPosition.y, this.x, this.y) > this.range) {
			stage.removeActor(this);
		}
		// Remove the bullet from the stage if it will hit the border
		else if (destinationX < 0 || destinationX > stage.stageWidth || destinationY < 0 || destinationY > stage.stageHeight) {
			stage.removeActor(this);
		}
		else {
			// Check if the bullet will collide with other players
			let collidesPlayer = CollisionEngine.checkBulletToPlayerCollision(destinationX, destinationY, stage.getPlayerActors(), this.radius, this.owner);
			if (collidesPlayer) {
				stage.removeActor(this);
			} 
			
			// Check if the bullet will collide with a crate
			else {
				let collidesCrate = CollisionEngine.checkBulletToCrateCollision(destinationX, destinationY, stage.getCrateActors(), this.radius);
				let crateList = stage.getCrateActors();
				if (collidesCrate) {
					stage.removeActor(this);
				} 
				
				// No collisions -- move the bullet
				else {
					this.x = destinationX;
					this.y = destinationY;
					// console.log(`Coordinates of bullet: (${this.x}, ${this.y})`);
				}
			}
		}
	}
}