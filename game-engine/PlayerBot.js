const CollisionEngine = require("./CollisionEngine.js");
const Player = require("./Player.js");
const Pair = require("./environment/Pair.js");
const GunPistolBot = require("./environment/GunPistolBot.js");
const GunRifleBot = require("./environment/GunRifleBot.js");
const GunShotgunBot = require("./environment/GunShotgunBot.js");

const EngineProperties = require("./EngineProperties.js");

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
const humanPlayerRadius = 30;

// A Player class that represents human players
module.exports = class PlayerBot extends Player {
    constructor(stage, position, colour, radius, hp, movementSpeed, playerID, playerType) {
        super(stage, position, colour, radius, hp, movementSpeed, playerID, playerType);

        // TODO: Revamp how weapons work for bots
        this.difficulty = playerType;
        if (this.difficulty === "HardBot") {
            this.weapon = new GunShotgunBot(this.stage, this);
            this.currentWeapon = 2;
        } else if (this.difficulty === "EasyBot") {
            this.weapon = new GunPistolBot(this.stage, this);
            this.currentWeapon = 1;
        } else if (this.difficulty === "MediumBot") {
            this.weapon = new GunRifleBot(this.stage, this);
            this.currentWeapon = 3;
        }

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
        if (humanPlayer) {
            // console.log(humanPlayer);
            if (humanPlayer.playerHP > 0) {
                let distanceFromPlayer = distanceBetweenTwoPoints(this.position.x, this.position.y, humanPlayer.playerPositionX, humanPlayer.playerPositionY);
    
                // The bot has run out of bullets, it will run from the player if player is close enough
                if (this.weapon.getRemainingBullets() <= 0) {
                    // If close enough, run directly away from player
                    if (distanceFromPlayer < humanPlayerRadius * 20) {
                        let xDistance = (this.position.x - humanPlayer.playerPositionX) * 4;
                        let yDistance = (this.position.y - humanPlayer.playerPositionY) * 4;
                        if (xDistance < this.movementSpeed && xDistance > 0 - this.movementSpeed) { xDistance = 0; }
                        if (yDistance < this.movementSpeed && yDistance > 0 - this.movementSpeed) { yDistance = 0; }
                        if (xDistance > 0) { this.dx = 1; }
                        if (xDistance < 0) { this.dx = -1; }
                        if (yDistance > 0) { this.dy = 1; }
                        if (yDistance < 0) { this.dy = -1; }
                    } 
                    // Move in random directions TODO: consolidate this with random moving method below
                    else if (new Date().getTime() - this.previousMoveTime >= randInt(maxMoveDelay)) {
                        maxMoveDelay = 50000;
                        this.faceRandomDirection();
                        this.dx = this.cursorDirection.x;
                        this.dy = this.cursorDirection.y;
                        this.setVelocity();
                        this.previousMoveTime = new Date().getTime();
                    }
                    this.setVelocity();
                }
                // If Player isn't hidden and within detection range, bot will try facing them and chasing after them while shooting them
                // If Player is hidden, but bot is still close enough, the bot will "see" the player and shoot them (eg. when bots wander into bushes)
                else if ((!humanPlayer.isHidden && distanceFromPlayer < EngineProperties.BotAbilities[this.difficulty].detectionRange) || distanceFromPlayer < humanPlayerRadius * 2) {
                    this.facePlayer(humanPlayer);
                    this.dx = 0;
                    this.dy = 0;
                    
                    // Move towards the player. There is a minimum distance bots will keep from players
                    if (distanceFromPlayer > humanPlayerRadius * 5) {
                        // Distance between bot and player
                        let xDistance = this.position.x - humanPlayer.playerPositionX;
                        let yDistance = this.position.y - humanPlayer.playerPositionY;
    
                        // Used as "tolerance" to prevent indefinite alternating between positions due to precision
                        if (xDistance < this.movementSpeed && xDistance > 0 - this.movementSpeed) { xDistance = 0; }
                        if (yDistance < this.movementSpeed && yDistance > 0 - this.movementSpeed) { yDistance = 0; }
                        
                        // Determines direction to move in
                        if (xDistance < 0) { this.dx = 1; }
                        if (xDistance > 0) { this.dx = -1; }
                        if (yDistance < 0) { this.dy = 1; }
                        if (yDistance > 0) { this.dy = -1; }
                    } 
    
                    this.setVelocity();
                    if (distanceFromPlayer <= this.weapon.range) {
                        this.shootPlayer(humanPlayer);
                    }
                    maxMoveDelay = 100000;
                } 
                // Player is hidden (in a bush), bot will choose a random direction to move in
                else if (new Date().getTime() - this.previousMoveTime >= randInt(maxMoveDelay)) {
                    maxMoveDelay = 50000;
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
                
                
                // Handle collision with human player and other bots
                // let collidesPlayer = CollisionEngine.checkPlayerToPlayerCollision(destinationX, destinationY, this, this.stage.getPlayerActors(), this.radius);
                // if (collidesPlayer) {
                //     console.log("bot collides with player or another bot");
                //     destinationX = this.position.x - this.velocity.x;
                // 	   destinationY = this.position.y - this.velocity.y;
                // }    
    
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
                
                // Handle collision against world border
                if (CollisionEngine.checkPlayerToBorderCollision(this.radius, this.position.x + this.velocity.x, this.position.y + this.velocity.y, this.stage.stageWidth, this.stage.stageHeight)) {
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
    
                // Update the player's location
                this.position.x = destinationX;
                this.position.y = destinationY;
                this.setPlayerPosition();
            }
        }
	}
}