// TODO: See if we need to import Stage?
const Circle = require("./Circle.js");
const Crate = require("./Crate.js");

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
			let collidesPlayer = false;
			let playersList = stage.getPlayerActors();
			for (let i = 0; i < playersList.length; i++) {
				// Check if the player is shooting ANOTHER player (not the one shooting the bullet)
				if (playersList[i] == this.owner) {
					// Skip this collision detection (player cannot collide with their own bullet)
					continue;
				}

				let playerPosition = playersList[i].getPlayerPosition();
				let dx = destinationX - playerPosition.x;
				let dy = destinationY - playerPosition.y;
				let distance = Math.sqrt(dx * dx + dy * dy);

				// Bullet collides with the player
				if (distance < this.radius + playersList[i].getRadius()) {
					// console.log("Bullet collision detected -- Bullet with player");

					// Decrease the player's HP
					playersList[i].decreaseHP(this.bulletDamage);
					// console.log("players HP: " + playersList[i].HP);
					collidesPlayer = true;
				}
			}

			// Player collision takes precendence over crate collision
			if (collidesPlayer) {
				stage.removeActor(this);
			} else {
				// Check if the bullet will collide with anything else in the environment
				let collidesCrate = false;
				let crateList = stage.getCrateActors();
				for (let i = 0; i < crateList.length; i++) {
					let crateObject = crateList[i];

					// Bullets do not collide with Bushes
					// Check for collision with Crates
					if (crateList[i] instanceof Crate) {
						// Bullets only collide with Crates (guaranteed to have height and width)
						let objectPosition = crateList[i].getStartingPosition();

						// x and y distance between the Bullet (a circle) and the Crate (a rectangle)
						let distanceX = Math.abs(this.x - objectPosition.x - crateObject.getWidth() / 2);
						let distanceY = Math.abs(this.y - objectPosition.y - crateObject.getHeight() / 2);

						// If the distance between the Bullet and Crate is longer than the Bullet radius + half(Crate Width), we know they are not colliding
						if ((distanceX > ((crateObject.getWidth() / 2) + this.radius) || distanceY > ((crateObject.getWidth() / 2) + this.radius))) {
							continue;
						}
						// If the distance between the Bullet and Crate is too short (indicating that they are colliding)
						else if (distanceX <= (crateObject.getWidth() / 2) || distanceY <= (crateObject.getHeight() / 2)) {
							// console.log("Bullet collision detected -- Bullet with Crate");
							collidesCrate = true;
							break;
						}
					}
				}

				// Bullet collides with crate; remove it
				if (collidesCrate || false) {
					stage.removeActor(this);
				} else {
					this.x = destinationX;
					this.y = destinationY;
					// console.log(`Coordinates of bullet: (${this.x}, ${this.y})`);
				}
			}
		}
	}
}