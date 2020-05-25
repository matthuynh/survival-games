const Pair = require("./environment/Pair.js");
const Circle = require("./environment/Circle.js");
const Crate = require("./environment/Crate.js");
const BushEnv = require("./environment/BushEnv.js");
const AmmoEnv = require("./environment/AmmoEnv.js");
const SmallGunEnv = require("./environment/SmallGunEnv.js");
const BigGunEnv = require("./environment/BigGunEnv.js");
const SpeedBoostEnv = require("./environment/SpeedBoostEnv.js");
const HealthPotEnv = require("./environment/HealthPotEnv.js");
const ScopeEnv = require("./environment/ScopeEnv.js");
const Bullet = require("./environment/Bullet.js");
const Gun = require("./environment/Gun.js");
const GunPistol = require("./environment/GunPistol.js");
const GunRifle = require("./environment/GunRifle.js");
const Line = require("./environment/Line.js");

const Stage = require("./Stage.js");
const CollisionEngine = require("./CollisionEngine.js");

// Return a random integer between 0 and n, inclusive
function randInt(n) { return Math.round(Math.random() * n); }

// Return a random float between 0 and n, inclusive
function rand(n) { return Math.random() * n; }

// Return the distance between two points, given the x and y coordinate of each point
function distanceBetweenTwoPoints(startingX, startingY, endingX, endingY) {
	return Math.sqrt((startingX - endingX) ** 2 + (startingY - endingY) ** 2);
}

// Return the distance between two Pairs
function distanceBetweenTwoPairs(startingPair, endingPair) {
	return Math.sqrt((startingPair.x - endingPair.x) ** 2 + (startingPair.y - endingPair.y) ** 2);
}

// A Player class that represents human players
module.exports = class Player extends Circle {
	constructor(stage, position, colour, radius, hp, movementSpeed, playerID) {
        super(position, colour, radius);
        this.stage = stage;
        this.playerID = playerID;

		this.setPlayerPosition(); // this.x, this.y are the int versions of this.position
		this.dx = 0; // displacement in x and y direction
		this.dy = 0;

		// Stores where the cursor is currently pointing at
		this.cursorX = 0;
		this.cursorY = 0;
		this.directionLine = new Line(this.x, this.y, 0, 0, 1, "rgba(255,0,0,0)"); // a player has an invisible line drawn in the direction they are facing
		this.stage.addActor(this.directionLine);

		this.velocity = new Pair(0, 0);
		this.cursorDirection = new Pair(0, 1); // represents the cursor direction, aka. where the player is facing
		// The coordinates of where this player's hands are located
		this.handX = 0;
		this.handY = 0;

		
		// Stores the player's buffs
		this.hidden = false; // set to true when the player is under a bush
		this.isUsingScope = false; // set to true when the player picks up the RDS buff

		// Design: weapons array is used to refer to all potential weapons the user can have
		// Index 0 is for fists, Index 1 is for GunPistol, Index 2 is for GunRifle
		this.weapons = [null, null, null];
		this.currentWeapon = 0; // index of the weapon is currently equipped with
		
		this.movementSpeed = movementSpeed;
		this.HP = hp;
		this.maxHP = hp;
    }
    
    // Return a JSON representation of this player
    getJSONRepresentation() {
        return {
            playerID: this.playerID,
            playerPositionX: this.x,
            playerPositionY: this.y,
            cursorDirectionX: this.cursorDirection.x,
            cursorDirectionY: this.cursorDirection.y,
            playerColour: this.colour,
            playerRadius: this.radius,
            playerHP: this.HP,
			playerMaxHP: this.maxHP,
			currentWeapon: this.currentWeapon,
			gunBullets: (this.weapons[this.currentWeapon] && this.weapons[this.currentWeapon].getRemainingBullets()) || 0,
			gunCapacity: (this.weapons[this.currentWeapon] && this.weapons[this.currentWeapon].getAmmoCapacity()) || 0
		}
    }

    // Returns this Player's ID
    getPlayerID() {
        return this.playerID;
    }

	// Decrease HP for this player
	decreaseHP(damage) {
		this.HP -= damage;
	}

	// Increase HP for this player
	increaseHP(hp) {
		// The mobile feature allows you to overload your health
		if (this.HP + hp <= 100) {
			this.HP += hp;
		} else {
			this.HP = 100;
		}
	}

	// Get this player's HP 
	getHP() {
		return this.HP;
	}

	// Get this player's max HP
	getMaxHP() {
		return this.maxHP;
	}

	setUsingScope() {
		this.isUsingScope = true;
	}

	// Return true if the player is in a bush
	isHidden() {
		return this.hidden;
	}

	// Change this player's movement speed
	setMovementSpeed(newSpeed) {
		this.movementSpeed = newSpeed;
	}

	// Get this player's living status
	isDead() {
		return this.HP <= 0;
	}

	// Returns a string representation of the Player's current location
	toString() {
		return "Player: " + this.position.toString() + " " + this.velocity.toString();
	}

	// Note that this.x and this.y is the ACTUAL location of the player
	setPlayerPosition() {
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}

	// Get the position of this player
	getPlayerPosition() {
		return new Pair(this.x, this.y);
	}

	// Set direction for which the player should move
	setMovementDirection(dx, dy) {
		this.hidden = false;
		this.dx = dx;
		this.dy = dy;
		this.setVelocity();
		
		// Used to calculate a new direction line
		this.handX = this.x + this.cursorDirection.x * this.radius;
		this.handY = this.y + this.cursorDirection.y * this.radius;
		this.setDirectionLine(this.cursorX, this.cursorY);
	}

	// When the human player moves the mouse, need to move the "direction" of the player's hands accordingly
	setCursorDirection(xCoordinate, yCoordinate, canvasWidth, canvasHeight) {
		this.cursorX = xCoordinate;
        this.cursorY = yCoordinate;

		// Calculate the cursor position relative to the canvas, as a unit vector
		let relativeX = xCoordinate - this.x - (canvasWidth / 2 - this.x);
		let relativeY = yCoordinate - this.y - (canvasHeight / 2 - this.y);
		this.cursorDirection = new Pair(relativeX, relativeY);
        this.cursorDirection.normalize();
        
        this.handX = this.x + this.cursorDirection.x * this.radius;
		this.handY = this.y + this.cursorDirection.y * this.radius;
		this.setDirectionLine(xCoordinate, yCoordinate);
		// console.log(`Cursor direction is (${xCoordinate},${yCoordinate})`);
	}

	// When human player clicks on the mouse (ie. shoots), need to move the bullet from the "direction" of the player's hands accordingly
	setFiringDirection(xCoordinate, yCoordinate, canvasWidth, canvasHeight) {
		if (!this.isDead() && this.currentWeapon >= 1) {
			const firingVector = new Pair(xCoordinate - this.x - (canvasWidth / 2 - this.x), yCoordinate - this.y - (canvasHeight / 2 - this.y));
			firingVector.normalize();

			this.weapons[this.currentWeapon].shoot(this.position, this.cursorDirection, firingVector, "rgba(0,0,0,1)");
		}
	}

	// Change the user's current weapon
	setWeapon(weaponNumber) {
		// console.log(`User wants to switch to weapon number ${weaponNumber}`);
		if (weaponNumber == 1) {
			this.currentWeapon = 0;
		}
		else if (this.weapons[weaponNumber - 1] != null) {
			this.currentWeapon = weaponNumber - 1;
		}
	}

	// When the player moves around, or the mouse moves, generate a new direction line from player to cursor
	setDirectionLine(xCoordinate, yCoordinate) {
		// Remove the previous direction line
		this.stage.removeActor(this.directionLine);

		// Only use this when the player picks up the powerup
		if (!this.isDead() && this.isUsingScope) {
			// Create a line between the player and the location of the mouse cursor
			let lineColour = "rgba(255,0,0,0.7)";
			let lineDestinationX = xCoordinate - (this.stage.getCanvasWidth() / 2 - this.x);
			let lineDestinationY = yCoordinate - (this.stage.getCanvasHeight() / 2 - this.y);
            this.directionLine = new Line(this.handX, this.handY, lineDestinationX, lineDestinationY, 2, lineColour);
			this.stage.addActor(this.directionLine);
		}
	}

	// Add speed to the player (combined with direction, this makes a vector)
	setVelocity() {
		const speedMultiplier = this.movementSpeed;
		this.velocity.x = this.dx * speedMultiplier;
		this.velocity.y = this.dy * speedMultiplier;
	}

	// Check for collisions between this player and other actors
	// Return the type of actor it collides with, else null
	checkForCollisions(destinationX, destinationY) {
		let collidesPlayer = false;
		let collidesCrate = false;
		let crateCollidingDirection = "";
		

		// Check for collision with buffs and debuffs (Bushes, HP, ammo, speed boost, RDS)
		let actorsList = this.stage.getEnvironmentActors();
		for (let i = 0; i < actorsList.length; i++) {
			// Only the human Player should pick up buffs / debuffs
			if (this instanceof Player) {
				// Player collides with Bush
				if (actorsList[i] instanceof BushEnv) {
					let bushPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - bushPosition.x;
					let dy = destinationY - bushPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy);

					// Make sure player is almost fully within the bush
					if (distance < this.radius / 4 + actorsList[i].getRadius() / 2) {
						// console.log("player collision detected -- Player with Bush");
						this.hidden = true;
					}
				}
				// Player collides with Ammo
				else if (actorsList[i] instanceof AmmoEnv) {
					// Check if player is within the Ammo
					const ammoPosition = actorsList[i].getStartingPosition();
					const dx = destinationX - ammoPosition.x;
					const dy = destinationY - ammoPosition.y;
					const distance = Math.sqrt(dx * dx + dy * dy) + 10;
					const userWeapon = this.weapons[this.currentWeapon];

					// The player should only pick up ammo if they are not full
					if (distance < this.radius + actorsList[i].getRadius() && userWeapon != null) {
						if (userWeapon.getRemainingBullets() < userWeapon.getAmmoCapacity()) {
							// console.log("player collision detected -- Player with Ammo");
							this.stage.removeActor(actorsList[i]);

							const bulletsToRefill = 10;
							const bulletDifference = userWeapon.getAmmoCapacity() - userWeapon.getRemainingBullets();
							if (bulletDifference < bulletsToRefill) {
								userWeapon.reloadGun(bulletDifference);
							} else {
								userWeapon.reloadGun(bulletsToRefill);
							}
						}
					}
				}
				// Player collides with HP Pot
				else if (actorsList[i] instanceof HealthPotEnv) {
					// Check if player is within the HP pot
					let HPPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - HPPosition.x;
					let dy = destinationY - HPPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					// Recover HP for the player
					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with HP");
						if (this.getHP() < this.getMaxHP()) {
							this.increaseHP(5);
							this.stage.removeActor(actorsList[i]);
						}
					}
				}
				// Player collides with Speed boost
				else if (actorsList[i] instanceof SpeedBoostEnv) {
					// Check if player is within the HP pot
					let speedBoostPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - speedBoostPosition.x;
					let dy = destinationY - speedBoostPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					// Give the player a speed boost
					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with Speed boost");
						this.setMovementSpeed(12);
						this.stage.removeActor(actorsList[i]);
					}
				}
				// Player collides with small gun
				else if (actorsList[i] instanceof SmallGunEnv) {
					// Check if player is within the small gun
					let smallGunPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - smallGunPosition.x;
					let dy = destinationY - smallGunPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
						// console.log("player collision detected -- Player with Small gun");
                        
						// Pick this up only if player doesn't already have the pistol
						if (this.weapons[1] == null) {
							this.stage.removeActor(actorsList[i]);
							const gunProps = {
								startingBullets: 20,
								bulletCapacity: 40,
								bulletSpeed: 17,
								bulletDamage: 15,
								bulletRadius: 7,
								range: 800,
								cooldown: 0
							}
							this.weapons[1] = new GunPistol(this.stage, this, gunProps);
						}

						// Makes the user switch their weapon
						this.currentWeapon = 1;
					}
				}
				// Player collides with big gun
				else if (actorsList[i] instanceof BigGunEnv) {
					// Check if player is within the big gun
					let bigGunPosition = actorsList[i].getStartingPosition();
					let dx = destinationX - bigGunPosition.x;
					let dy = destinationY - bigGunPosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
                        // console.log("player collision detected -- Player with big gun");
                        
                        // Pick this up only if the player doens't already own the rifle
						if (this.weapons[2] == null) {
							this.stage.removeActor(actorsList[i]);
							const gunProps = {
								startingBullets: 100,
								bulletCapacity: 200,
								bulletSpeed: 25,
								bulletDamage: 5,
								bulletRadius: 3,
								range: 1600,
								cooldown: 0
							}
							this.weapons[2] = new GunRifle(this.stage, this, gunProps);
						}
						
						// Makes the user switch their weapon
						this.currentWeapon = 2;
					}
				}
				// Player collides with RDS
				else if (actorsList[i] instanceof ScopeEnv) {
					// Check if player is within the scope
					let scopePosition = actorsList[i].getStartingPosition();
					let dx = destinationX - scopePosition.x;
					let dy = destinationY - scopePosition.y;
					let distance = Math.sqrt(dx * dx + dy * dy) + 10;

					if (distance < this.radius + actorsList[i].getRadius()) {
						// Player should only pick up RDS if they already have a gun
						if (this.weapons[1] != null || this.weapons[2] != null) {
							// console.log("player collision detected -- Player with Scope");
							this.setUsingScope();
							this.stage.removeActor(actorsList[i]);
						}
					}
				}
			}
		}

        // Check if the player (a circle) will collide with other players (also circles)
		let playersList = this.stage.getPlayerActors();
		for (let i = 0; i < playersList.length; i++) {
			// Check if the player is ANOTHER player
			if (playersList[i] == this) {
				// Skip this collision detection (player cannot collide with self)
				continue;
			}

			let playerPosition = playersList[i].getPlayerPosition();
			let dx = destinationX - playerPosition.x;
			let dy = destinationY - playerPosition.y;
			let distance = Math.sqrt(dx * dx + dy * dy) + 10;

			// player collides with the player
			if (distance < this.radius + playersList[i].getRadius()) {
				// console.log("player collision detected -- player with player");
				collidesPlayer = true;
				break;
			}
		}

		// Check for crate collision
		if (!collidesPlayer) {
			// Check if the player will collide with any crate
			let crateList = this.stage.getCrateActors();
			for (let i = 0; i < crateList.length; i++) {
				let crateObject = crateList[i];

				// Check for collision with Crates
				// https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
				// players only collide with Crates (guaranteed to have height and width)
				let objectPosition = crateList[i].getStartingPosition();

				// Check which corner the player is closest to
				let destinationPair = new Pair(destinationX, destinationY);
				let distanceToTopLeft = distanceBetweenTwoPoints(destinationX, destinationY, objectPosition.x, objectPosition.y);
				let distanceToBottomRight = distanceBetweenTwoPoints(destinationX, destinationY, objectPosition.x + crateObject.getWidth(), objectPosition.y + crateObject.getHeight());
				if (distanceToTopLeft < distanceToBottomRight) {
					crateCollidingDirection = "TopLeft";
				} else {
					crateCollidingDirection = "BottomRight";
				}

				// x and y distance between the player (a circle) and the Crate (a rectangle)
				let distanceX = Math.abs(this.x - objectPosition.x - crateObject.getWidth() / 2);
				let distanceY = Math.abs(this.y - objectPosition.y - crateObject.getHeight() / 2);

				// If the distance between the player and Crate is longer than the player radius + half(Crate Width), we know they are not colliding
				if ((distanceX > ((crateObject.getWidth() / 2) + this.radius) || distanceY > ((crateObject.getWidth() / 2) + this.radius))) {
					continue;
				}
				// If the distance between the player and Crate is too short (indicating that they are colliding)
				else if (distanceX <= (crateObject.getWidth() / 2) || distanceY <= (crateObject.getHeight() / 2)) {
					// console.log("player collision detected -- player with Crate");
					collidesCrate = true;
					break;
				}
				// Check if the corners of the player and Crate are colliding
				else {
					let dx = distanceX - crateObject.getWidth() / 2;
					let dy = distanceY - crateObject.getHeight() / 2;
					if (dx * dx + dy * dy <= (this.radius * this.radius)) {
						// console.log("player collision detected -- player with Crate");
						collidesCrate = true;
						break;
					}
				}

			}
		}
		if (collidesPlayer) {
			return "player";
		} else if (collidesCrate) {
			return "crate" + crateCollidingDirection;
		}
		return false;
	}

	// Take one "step" for animation
	step() {
		if (!this.isDead()) {
            this.setDirectionLine(this.cursorX, this.cursorY);

			// Check if where we are proposing to move will cause a collision
			let destinationX = this.position.x + this.velocity.x;
			let destinationY = this.position.y + this.velocity.y;
			let collided = this.checkForCollisions(destinationX + 10, destinationY + 10);

			// Collision with another actor
			if (collided) {
				// console.log("Collided with another actor!");
				// Move the player back so they are no longer colliding
				if (collided == "player") {
					this.position.x = this.position.x - (this.velocity.x / 10);
					this.position.y = this.position.y - (this.velocity.y / 10);
					this.setPlayerPosition();
				} else if (collided == "crateTopLeft") {
					// Move the player back so they are no longer colliding
					this.position.x = this.position.x - 5;
					this.position.y = this.position.y - 5;
					this.setPlayerPosition();
				} else if (collided == "crateBottomRight") {
					// Move the player back so they are no longer colliding
					this.position.x = this.position.x + 5;
					this.position.y = this.position.y + 5;
					this.setPlayerPosition();
				}
			}
			// Check for collision of player against world map
			else if (CollisionEngine.checkPlayerToBorderCollision(this.position.x + this.velocity.x, this.position.y + this.velocity.y, 30, this.stage.stageWidth, this.stage.stageHeight)) {
				// console.log("Collision with world border!");

				// Check which border we hit
				let tolerance = 30;
				let destinationX = this.position.x + this.velocity.x;
				let destinationY = this.position.y + this.velocity.y;

				// Hit left border
				if (destinationX < 0 + tolerance) {
					destinationX = this.position.x - this.velocity.x;
				}
				// Hit right border
				else if (destinationX > this.stage.stageWidth - tolerance) {
					destinationX = this.position.x - this.velocity.x;
				}
				// Hit top border
				else if (destinationY < 0 + tolerance) {
					destinationY = this.position.y - this.velocity.y;
				}
				// Hit bottom border
				else if (destinationY > this.stage.stageHeight - tolerance) {
					destinationY = this.position.y - this.velocity.y;
				}

				// Move the Player away from the world border
				this.setVelocity();
				this.position.x = destinationX;
				this.position.y = destinationY;
				this.setPlayerPosition();
			}
			else {
				// Update the player's location
				this.position.x = destinationX;
				this.position.y = destinationY;
				this.setPlayerPosition();
			}
		}
	}
}