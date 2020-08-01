const CollisionEngine = require("./CollisionEngine.js");
const Player = require("./Player.js");
const Pair = require("./environment/Pair.js");
const GunPistolBot = require("./environment/GunPistolBot.js");
const GunRifleBot = require("./environment/GunRifleBot.js");

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

let maxMoveDelay = 25000;

// A Player class that represents human players
module.exports = class PlayerBot extends Player {
    constructor(stage, position, colour, radius, hp, movementSpeed, playerID, playerType) {
        super(stage, position, colour, radius, hp, movementSpeed, playerID, playerType);

        this.difficulty = playerType;

        // TODO: Implement this better, different bots should have different weapons
        this.weapon = new GunPistolBot(this.stage, this);

        this.previousMoveTime = new Date().getTime(); // used to store when the bot last changed movement direction
    }

    // Make the bot face the human player
	facePlayer(humanPlayer) {
        this.cursorDirection = new Pair(humanPlayer.playerPositionX - this.x, humanPlayer.playerPositionY - this.y);
        this.cursorDirection.normalize();
    }
    
    // Make the bot face a random direction
	faceRandomDirection() {
        this.cursorDirection = new Pair(1 - rand(2), 1 - rand(2));
        this.cursorDirection.normalize();
	}


    // Make the bot shoot in the direction of the player
    shootPlayer(humanPlayer) {
        if (distanceBetweenTwoPoints(this.x, this.y, humanPlayer.playerPositionX, humanPlayer.playerPositionY) < this.weapon.getRange()) {
            const firingVector = new Pair(humanPlayer.playerPositionX - this.x, humanPlayer.playerPositionY - this.y);
			firingVector.normalize();
			this.weapon.shoot(this.position, this.cursorDirection, firingVector, "rgba(0,0,0,1)");
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
        // console.log(humanPlayer);
		if (humanPlayer.playerHP > 0) {
            // Player isn't hidden -- bot will try facing them and shooting them
            if (!humanPlayer.isHidden) {
                this.facePlayer(humanPlayer);
                this.shootPlayer(humanPlayer);

                // Move towards the player
				if (this.position.x - humanPlayer.playerPositionX < 0) { this.dx = 1; }
				if (this.position.x - humanPlayer.playerPositionX >= 0) { this.dx = -1; }
				if (this.position.y - humanPlayer.playerPositionY < 0) { this.dy = 1; }
				if (this.position.y - humanPlayer.playerPositionY >= 0) { this.dy = -1; }
                this.setVelocity();
                maxMoveDelay = 100000;
            } 
            // Player is hidden (in a bush), bot will choose a random direction to move in
            else if (new Date().getTime() - this.previousMoveTime >= randInt(maxMoveDelay)) {
                maxMoveDelay = 25000;
                this.faceRandomDirection();
                this.dx = this.cursorDirection.x;
                this.dy = this.cursorDirection.y;
				this.setVelocity();
				this.previousMoveTime = new Date().getTime();
			}
                
            // Check if where we are proposing to move will cause a collision
            let destinationX = this.position.x + this.velocity.x;
            let destinationY = this.position.y + this.velocity.y;
                
            let crateCollision = CollisionEngine.checkPlayerToCrateCollision(destinationX, destinationY, this.stage.getCrateActors(), this.radius);
            // Handle crate collision -- move bot away from colliding side
            if (crateCollision) {                    
                if (crateCollision.side === "crateTop") {
                    destinationY = crateCollision.y - this.radius;
                } else if (crateCollision.side === "crateBottom") {
                    destinationY = crateCollision.y + this.radius + 1;
                } else if (crateCollision.side === "crateLeft") {
                    destinationX = crateCollision.x - this.radius;
                } else if (crateCollision.side === "crateRight") {
                    destinationX = crateCollision.x + this.radius;
                }
                this.previousMoveTime = 0;
            }
            // Check for collision of bot against world map
            else if (CollisionEngine.checkPlayerToBorderCollision(this.radius, this.position.x + this.velocity.x, this.position.y + this.velocity.y, this.stage.stageWidth, this.stage.stageHeight)) {
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
                this.previousMoveTime = 0;
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