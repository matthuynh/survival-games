const Pair = require("./environment/Pair.js");
const Circle = require("./environment/Circle.js");

// A Player class that represents human players
module.exports = class Player extends Circle {
	constructor(stage, position, colour, radius, hp, movementSpeed, playerID, playerType) {
        super(position, colour, radius);
        this.stage = stage;
		this.playerID = playerID;
		this.playerType = playerType;

		this.setPlayerPosition(); // this.x, this.y are the int versions of this.position
		this.dx = 0; // displacement in x and y direction
		this.dy = 0;

		// The coordinates of where this player's hands are located
		this.handX = 0;
		this.handY = 0;
		// Stores where the cursor is currently pointing at
		this.cursorX = 0;
		this.cursorY = 0;

		this.movementSpeed = movementSpeed;
		this.velocity = new Pair(0, 0);
		this.velocity.x = 0;
		this.velocity.y = 0;
		this.setVelocity(); 
		this.cursorDirection = new Pair(0, 1); // represents the cursor direction, aka. where the player is facing

		// Design: weapons array is used to refer to all potential weapons the user can have
		// Index 0 is for fists, Index 1 is for GunPistol, Index 2 is for GunRifle, index 3 is for GunShotgun
		this.weapons = [null, null, null, null];
		this.currentWeapon = 0; // index of the weapon is currently equipped with
		this.hidden = false; // set to true when the player is under a bush
		
		this.HP = hp;
		this.maxHP = hp;
    }
    
    // Return a JSON representation of this player
    getJSONRepresentation() {
        return {
			playerID: this.playerID,
			playerType: this.playerType,
            playerPositionX: this.x,
            playerPositionY: this.y,
            cursorDirectionX: this.cursorDirection.x,
            cursorDirectionY: this.cursorDirection.y,
            playerColour: this.colour,
            playerRadius: this.radius,
            playerHP: this.HP,
			playerMaxHP: this.maxHP,
			isHidden: this.hidden,
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

	// Add speed to the player (combined with direction, this makes a vector)
	setVelocity() {
		// Movement speed is basically the speed multiplier
		this.velocity.x = this.dx * this.movementSpeed;
		this.velocity.y = this.dy * this.movementSpeed;
	}
}