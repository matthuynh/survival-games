const Player = require("./Player.js");
// const Line = require("./environment/Line.js");
const Pair = require("./environment/Pair.js");
const BushEnv = require("./environment/BushEnv.js");
const AmmoPistolEnv = require("./environment/AmmoPistolEnv.js");
const AmmoRifleEnv = require("./environment/AmmoRifleEnv.js");
const AmmoShotgunEnv = require("./environment/AmmoShotgunEnv.js");
const PistolEnv = require("./environment/PistolEnv.js");
const BurstRifleEnv = require("./environment/BurstRifleEnv.js");
const ShotgunEnv = require("./environment/ShotgunEnv.js");
const SpeedBoostEnv = require("./environment/SpeedBoostEnv.js");
const HealthPotEnv = require("./environment/HealthPotEnv.js");
// const ScopeEnv = require("./environment/ScopeEnv.js");
const GunPistol = require("./environment/GunPistol.js");
const GunRifle = require("./environment/GunRifle.js");
const GunShotgun = require("./environment/GunShotgun.js");

// A Player class that represents human players
module.exports = class PlayerHuman extends Player {
	constructor(stage, position, colour, radius, hp, movementSpeed, playerID, playerType) {
        super(stage, position, colour, radius, hp, movementSpeed, playerID, playerType);
		
		// this.directionLine = new Line(this.x, this.y, 0, 0, 1, "rgba(255,0,0,0)"); // a player has an invisible line drawn in the direction they are facing
		// this.stage.addActor(this.directionLine);

		// Stores the player's buffs
		// this.isUsingScope = false; // set to true when the player picks up the RDS buff
    }

	// setUsingScope() {
	// 	this.isUsingScope = true;
	// }

	// Set direction for which the player should move
	setMovementDirection(dx, dy) {
		this.hidden = false;
		this.dx = dx;
		this.dy = dy;
		this.setVelocity();
		
		// Used to calculate a new direction line
		this.handX = this.x + this.cursorDirection.x * this.radius;
		this.handY = this.y + this.cursorDirection.y * this.radius;
		// this.setDirectionLine(this.cursorX, this.cursorY);
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
		// this.setDirectionLine(xCoordinate, yCoordinate);
		// console.log(`Cursor direction is (${xCoordinate},${yCoordinate})`);
	}

	// When human player clicks on the mouse (ie. shoots), need to move the bullet from the "direction" of the player's hands accordingly
	setFiringDirection(xCoordinate, yCoordinate, canvasWidth, canvasHeight) {
		if (!this.isDead() && this.currentWeapon >= 1) {
			// const firingVector = new Pair(xCoordinate - this.x - (canvasWidth / 2 - this.x), yCoordinate - this.y - (canvasHeight / 2 - this.y));
			// firingVector.normalize();
			
			const firingProps = {
				x: xCoordinate - this.x - (canvasWidth / 2 - this.x),
				y: yCoordinate - this.y - (canvasHeight / 2 - this.y)
			};

			this.weapons[this.currentWeapon].shoot(this.position, this.cursorDirection, firingProps, "rgba(0,0,0,1)");
			// this.weapons[this.currentWeapon].shoot(new Pair(this.handX, this.handY), this.cursorDirection, firingVector, "rgba(0,0,0,1)");
		}
	}

	// Change the user's current weapon
	setWeapon(weaponChange) {
		// console.log(`User wants to switch to weapon number ${weaponChange}`);
		if (weaponChange == 1 || weaponChange - 1 == this.currentWeapon) {
			this.currentWeapon = 0;
		}
		else if (this.weapons[weaponChange - 1] != null) {
			this.currentWeapon = weaponChange - 1;
		}
		else if (weaponChange == "t" || weaponChange == "scrolldown") {
			// TODO: Pretty janky right now. Can improve by using modulo (to wrap around indices) if actually implementing Fists (punching) as it's currently null
			// If the user only has Fists
			if (this.weapons[1] === null && this.weapons[2] === null && this.weapons[3] === null) { } 
			else if (this.currentWeapon == 3) {
				this.currentWeapon = 0;	
			} else {
				this.currentWeapon += 1;
				while(this.weapons[this.currentWeapon] === null) {
					this.currentWeapon += 1;
				}
				if (this.currentWeapon == 4) {
					this.currentWeapon = 0;
				}
			}
		} else if (weaponChange == "scrollup") {
			if (this.weapons[1] === null && this.weapons[2] === null && this.weapons[3] === null) { }
			else if (this.currentWeapon == 0) {
				this.currentWeapon = 3;
			} else {
				this.currentWeapon -= 1;
				while(this.weapons[this.currentWeapon] === null && this.currentWeapon > 0) {
					this.currentWeapon -= 1;
				}
			}
		}
		// console.log(`User ended up with weapon number ${this.currentWeapon}`);
	}

	// When the player moves around, or the mouse moves, generate a new direction line from player to cursor
	// setDirectionLine(xCoordinate, yCoordinate) {
	// 	// Remove the previous direction line
	// 	this.stage.removeActor(this.directionLine);

	// 	// Only use this when the player picks up the powerup
	// 	if (!this.isDead() && this.isUsingScope) {
	// 		// Create a line between the player and the location of the mouse cursor
	// 		let lineColour = "rgba(255,0,0,0.7)";
	// 		let lineDestinationX = xCoordinate - (this.stage.getCanvasWidth() / 2 - this.x);
	// 		let lineDestinationY = yCoordinate - (this.stage.getCanvasHeight() / 2 - this.y);
    //         this.directionLine = new Line(this.handX, this.handY, lineDestinationX, lineDestinationY, 2, lineColour);
	// 		this.stage.addActor(this.directionLine);
	// 	}
	// }

	// Take one "step" for animation
	step() {
		if (!this.isDead()) {
			// console.log(this.toString());
			// this.setDirectionLine(this.cursorX, this.cursorY);

			// Check if where we are proposing to move will cause a collision
			let destinationX = this.position.x + this.velocity.x;
			let destinationY = this.position.y + this.velocity.y;

			// Check for collisions with any other environment object. Only human players will have this collision check. Objects include bushes, HP, ammo, speed boost, RDS
			let collidedObj = CollisionEngine.checkPlayerToObjectCollision(destinationX, destinationY, this.stage.getEnvironmentActors(), this.radius);
			// console.log(collidedObj.objectType);
			if (collidedObj) {
				if (collidedObj.type instanceof BushEnv && collidedObj.overlap === "full")  {
					this.hidden = true;
				}
				else if (collidedObj.type instanceof AmmoPistolEnv) {
					// console.log("Colliding with ammo of type " + JSON.stringify(collidedObj.type.getJSONRepresentation()));

					const userWeapon = this.weapons[this.currentWeapon];
					if (userWeapon instanceof GunPistol && userWeapon.getRemainingBullets() < userWeapon.getAmmoCapacity()) {
						// console.log("player collision detected -- Player with Ammo");
						this.stage.removeActor(collidedObj.type);

						const bulletsToRefill = 10;
						const bulletDifference = userWeapon.getAmmoCapacity() - userWeapon.getRemainingBullets();
						if (bulletDifference < bulletsToRefill) {
							userWeapon.reloadGun(bulletDifference);
						} else {
							userWeapon.reloadGun(bulletsToRefill);
						}
					}
				}
				else if (collidedObj.type instanceof AmmoRifleEnv) {
					// console.log("Colliding with ammo of type " + JSON.stringify(collidedObj.type.getJSONRepresentation()));

					const userWeapon = this.weapons[this.currentWeapon];
					if (userWeapon instanceof GunRifle && userWeapon.getRemainingBullets() < userWeapon.getAmmoCapacity()) {
						// console.log("player collision detected -- Player with Ammo");
						this.stage.removeActor(collidedObj.type);

						const bulletsToRefill = 20;
						const bulletDifference = userWeapon.getAmmoCapacity() - userWeapon.getRemainingBullets();
						if (bulletDifference < bulletsToRefill) {
							userWeapon.reloadGun(bulletDifference);
						} else {
							userWeapon.reloadGun(bulletsToRefill);
						}
					}
				}
				else if (collidedObj.type instanceof AmmoShotgunEnv) {
					// console.log("Colliding with ammo of type " + JSON.stringify(collidedObj.type.getJSONRepresentation()));

					const userWeapon = this.weapons[this.currentWeapon];
					if (userWeapon instanceof GunShotgun && userWeapon.getRemainingBullets() < userWeapon.getAmmoCapacity()) {
						// console.log("player collision detected -- Player with Ammo");
						this.stage.removeActor(collidedObj.type);

						const bulletsToRefill = 4;
						const bulletDifference = userWeapon.getAmmoCapacity() - userWeapon.getRemainingBullets();
						if (bulletDifference < bulletsToRefill) {
							userWeapon.reloadGun(bulletDifference);
						} else {
							userWeapon.reloadGun(bulletsToRefill);
						}
					}
				}
				else if (collidedObj.type instanceof HealthPotEnv) {
					// Heal player
					// console.log("player collision detected -- Player with HP");
					if (this.getHP() < this.getMaxHP()) {
						this.increaseHP(5);
						this.stage.removeActor(collidedObj.type);
					}
				}
				else if (collidedObj.type instanceof SpeedBoostEnv) {
					// Give the player a speed boost
					// console.log("player collision detected -- Player with Speed boost");
					this.setMovementSpeed(10);
					this.stage.removeActor(collidedObj.type);
				}
				else if (collidedObj.type instanceof PistolEnv) { 
					// console.log("player collision detected -- Player with Small gun"); 
					// Pick this up only if player doesn't already have the pistol
					if (this.weapons[1] == null) {
						this.stage.removeActor(collidedObj.type);
						this.weapons[1] = new GunPistol(this.stage, this);

						// Makes the user switch their weapon
						this.currentWeapon = 1;
					}

				}
				else if (collidedObj.type instanceof BurstRifleEnv) {
					// console.log("player collision detected -- Player with big gun");
					// Pick this up only if the player doens't already own the rifle
					if (this.weapons[2] == null) {
						this.stage.removeActor(collidedObj.type);
						this.weapons[2] = new GunRifle(this.stage, this);

						// Makes the user switch their weapon
						this.currentWeapon = 2;
					}
				} else if (collidedObj.type instanceof ShotgunEnv) {
					// console.log("player collision detected -- Player with shotgun");
					// Pick this up only if the player doens't already own the shotgun
					if (this.weapons[3] == null) {
						this.stage.removeActor(collidedObj.type);
						this.weapons[3] = new GunShotgun(this.stage, this);

						// Makes the user switch their weapon
						this.currentWeapon = 3;
					}
				}
				// else if (collidedObj.type instanceof ScopeEnv) {
				// 	// Player should only pick up RDS if they already have a gun
				// 	if (this.weapons[1] != null || this.weapons[2] != null) {
				// 		// console.log("player collision detected -- Player with Scope");
				// 		this.setUsingScope();
				// 		this.stage.removeActor(collidedObj.type);
				// 	}
				// }
			}
			
            // Check for collision of player against crate
            let crateCollision = CollisionEngine.checkPlayerToCrateCollision(destinationX, destinationY, this.stage.getCrateActors(), this.radius)
			if (crateCollision) {
				// console.log("Collided with another actor!");
                
                // If collides, move the player away from correct side of crate so they are no longer colliding
				if (crateCollision.side === "crateTop") {
					destinationY = crateCollision.y - this.radius;
				} else if (crateCollision.side === "crateBottom") {
					destinationY = crateCollision.y + this.radius;
				} else if (crateCollision.side === "crateLeft") {
					destinationX = crateCollision.x - this.radius;
				} else if (crateCollision.side === "crateRight") {
					destinationX = crateCollision.x + this.radius;
				}

			}
			// Check for collision of player against world map
			else if (CollisionEngine.checkPlayerToBorderCollision(this.radius, this.position.x + this.velocity.x, this.position.y + this.velocity.y, this.stage.stageWidth, this.stage.stageHeight)) {
				// console.log("Colliding with world border");
				destinationX = this.position.x + this.velocity.x;
				destinationY = this.position.y + this.velocity.y;
				
				// Check which border we hit
				if (destinationX < 0 + this.radius) {
					destinationX = this.radius; // Hit left border
				}
				if (destinationX > this.stage.stageWidth - this.radius) {
					destinationX = this.stage.stageWidth - this.radius; // Hit right border
				}
				if (destinationY < 0 + this.radius) {
					destinationY = this.radius; // Hit top border
				}
				if (destinationY > this.stage.stageHeight - this.radius) {
					destinationY = this.stage.stageHeight - this.radius; // Hit bottom border
				}
			}

			// Update the player's location
			this.position.x = destinationX;
			this.position.y = destinationY;
			this.setPlayerPosition();
		}
	}
}