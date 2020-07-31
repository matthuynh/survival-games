const CollisionEngine = require("./CollisionEngine.js");
const Player = require("./Player.js");
const Pair = require("./environment/Pair.js");
const BushEnv = require("./environment/BushEnv.js");
const AmmoEnv = require("./environment/AmmoEnv.js");
const PistolEnv = require("./environment/PistolEnv.js");
const BurstRifleEnv = require("./environment/BurstRifleEnv.js");
const SpeedBoostEnv = require("./environment/SpeedBoostEnv.js");
const HealthPotEnv = require("./environment/HealthPotEnv.js");
const GunPistol = require("./environment/GunPistol.js");
const GunRifle = require("./environment/GunRifle.js");

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
module.exports = class PlayerBot extends Player {
    constructor(stage, position, colour, radius, hp, movementSpeed, playerID, playerType) {
        super(stage, position, colour, radius, hp, movementSpeed, playerID, playerType);
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
		// console.log(`Cursor direction is (${xCoordinate},${yCoordinate})`);
	}

	// When human player clicks on the mouse (ie. shoots), need to move the bullet from the "direction" of the player's hands accordingly
	setFiringDirection(xCoordinate, yCoordinate, canvasWidth, canvasHeight) {
		if (!this.isDead() && this.currentWeapon >= 1) {
			const firingVector = new Pair(xCoordinate - this.x - (canvasWidth / 2 - this.x), yCoordinate - this.y - (canvasHeight / 2 - this.y));
			firingVector.normalize();

			this.weapons[this.currentWeapon].shoot(this.position, this.cursorDirection, firingVector, "rgba(0,0,0,1)");
			// this.weapons[this.currentWeapon].shoot(new Pair(this.handX, this.handY), this.cursorDirection, firingVector, "rgba(0,0,0,1)");
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

	// Take one "step" for animation. As a bot, also calculates movement direction and firing direction
	step() {
        const humanPlayer = this.stage.getHumanPlayer();
        console.log(humanPlayer);
		if (isHumanPlayerDead) {
            const isHumanPlayerHidden = false;
            if (!isHumanPlayerHidden) {
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
                    else if (collidedObj.type instanceof AmmoEnv) {
                        // console.log("Colliding with ammo");
                        // TODO: Make diff types of ammo
                        const userWeapon = this.weapons[this.currentWeapon];
                        if (userWeapon && userWeapon.getRemainingBullets() < userWeapon.getAmmoCapacity()) {
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
                            this.stage.removeActor(collidedObj.type)
                            this.weapons[2] = new GunRifle(this.stage, this);
    
                            // Makes the user switch their weapon
                            this.currentWeapon = 2;
                        }
                    }
                }
                
                let crateCollision = CollisionEngine.checkPlayerToCrateCollision(destinationX, destinationY, this.stage.getCrateActors(), this.radius);
                // Handle crate collision
                if (crateCollision) {
                    // console.log("Collided with another actor!");
                    
                    if (crateCollision.side === "crateTop") {
                        // Move the player back so they are no longer colliding
                        // destinationX = this.position.x;
                        destinationY = crateCollision.y - this.radius;
                    } else if (crateCollision.side === "crateBottom") {
                        // Move the player back so they are no longer colliding
                        // destinationX = this.position.x;
                        destinationY = crateCollision.y + this.radius + 1;
                    } else if (crateCollision.side === "crateLeft") {
                        destinationX = crateCollision.x - this.radius;
                        // destinationY = this.position.y;
                    } else if (crateCollision.side === "crateRight") {
                        destinationX = crateCollision.x + this.radius;
                        // destinationY = this.position.y;
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
    
                // Player collision -- currently disabled
                // let collidesPlayer = CollisionEngine.checkPlayerToPlayerCollision(destinationX, destinationY, playersList[i].getPlayerPosition[i], this.radius);
                
                // Update the player's location
                this.position.x = destinationX;
                this.position.y = destinationY;
                this.setPlayerPosition();
            }

		}
	}
}