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


/**
 * A collection of functions that handle collisions for the game
 *
 * - Object to x collision is used during world generation to check if
 *   the object will intersect with x if generated
 * - Player to x collision is used during player movement to check if
 *   the player will intersect with x if they move in that direction
 * - Note that we for Player to x collisions, we check if MOVING the
 *   player in that direction will lead to a collision
 * 		- This is why we use destinationX and destinationY
 * 
 * Collision code needs to be refactored from: 
 * - Stage
 * - Player
 * - Bullet
 * 
 */
// Return the distance between two points, given the x and y coordinate of each point
function distanceBetweenTwoPoints(startingX, startingY, endingX, endingY) {
	return Math.sqrt((startingX - endingX) ** 2 + (startingY - endingY) ** 2);
}

// Return the distance between two Pairs
function distanceBetweenTwoPairs(startingPair, endingPair) {
	return Math.sqrt((startingPair.x - endingPair.x) ** 2 + (startingPair.y - endingPair.y) ** 2);
}

module.exports = CollisionEngine = {
	// Used by class WorldGenerator to check for collisions between objects
	// Return true if the object collides
	checkObjectToObjectCollision() {
	},

	// Used by class WorldGenerator to check for collisions between the object and world border
	// Return true if the object collides with world border
	checkObjectToBorderCollision(startingX, startingY, tolerance, stageWidth, stageHeight) {
		if (
			startingX < 0 + tolerance ||
			startingX > stageWidth - tolerance ||
			startingY < 0 + tolerance ||
			startingY > stageHeight - tolerance
		) {
			return true;
		}
		return false;
	},

	// Used by class Player to check for collisions between the Player and world border
	checkPlayerToBorderCollision(playerRadius, destinationX, destinationY, stageWidth, stageHeight) {
		return (
			destinationX < 0 + playerRadius ||
			destinationX > stageWidth - playerRadius ||
			destinationY < 0 + playerRadius ||
			destinationY > stageHeight - playerRadius
		);
	},

	// Used by class Player to check for collisions between the Player and any crate in the Stage
	// Returns collision information if player collides with crate, else false
	checkPlayerToCrateCollision(destinationX, destinationY, crateList, playerRadius) {
		// Check all crates in the stage. Crates are rectangles with equal sidelengths
		let collidesCrate = false;
		let crateObject;
		for (let i = 0; i < crateList.length; i++) {
			crateObject = crateList[i];
			let cratePosition = crateList[i].getStartingPosition();

			// x and y distance between where the player (a circle) will move to, and the Crate (a rectangle)
			let distanceX = Math.abs(destinationX - cratePosition.x - crateObject.getWidth() / 2);
			let distanceY = Math.abs(destinationY - cratePosition.y - crateObject.getHeight() / 2);

			// If the distance between the player and Crate is longer than the player radius + half(Crate Width), we know they are not colliding
			if ((distanceX > ((crateObject.getWidth() / 2) + playerRadius)) || (distanceY > ((crateObject.getHeight() / 2) + playerRadius))) {
				continue;
			}

			// If the distance between the player and Crate is too short (indicating that they are colliding)
			if (distanceX <= (crateObject.getWidth() / 2) || distanceY <= (crateObject.getHeight() / 2)) {
				// console.log("player collision detected -- player with Crate");
				collidesCrate = true;
				break;
			}
			// Check if the corners of the player and Crate are colliding
			else {
				let dx = distanceX - crateObject.getWidth() / 2;
				let dy = distanceY - crateObject.getHeight() / 2;
				if (dx * dx + dy * dy <= (playerRadius * playerRadius)) {
					// console.log("player collision detected -- player with Crate");
					collidesCrate = true;
					break;
				}
			}

		}
		// Determine which side of the crate the circle collided with
		if (collidesCrate) { 
			// console.log("Determining collision side");
			// Calculates the distance from the center of the player to the midpoint of each sidelength of the crate (this only works properly for SQUARES)
			let halfSideLength = crateObject.width / 2;
			let distToTop = distanceBetweenTwoPoints(destinationX, destinationY, crateObject.position.x + halfSideLength, crateObject.position.y);
			let distToBottom = distanceBetweenTwoPoints(destinationX, destinationY, crateObject.position.x + halfSideLength, crateObject.position.y + crateObject.height);
			let distToLeft = distanceBetweenTwoPoints(destinationX, destinationY, crateObject.position.x, crateObject.position.y + halfSideLength);
			let distToRight = distanceBetweenTwoPoints(destinationX, destinationY, crateObject.position.x + crateObject.width, crateObject.position.y + halfSideLength);

			// Check which corner the player is closest to
			let shortestDistance = Math.min(distToTop, distToBottom, distToLeft, distToRight);
			switch (shortestDistance) {
				case distToTop:
					return {
						side: "crateTop",
						y: crateObject.position.y
					};
				case distToBottom:
					return {
						side: "crateBottom",
						y: crateObject.position.y + crateObject.height
					};
				case distToLeft:
					return {
						side: "crateLeft",
						x: crateObject.position.x
					};
				case distToRight:
					return {
						side: "crateRight",
						x: crateObject.position.x + crateObject.width
					};
				default:
					console.log("BRUH, shortestDistance is " + shortestDistance);
					console.log(`distToTop: ${distToTop}, distToBottom: ${distToBottom}, distToLeft: ${distToLeft}, distToRight: ${distToRight}`);
					console.log(crateObject);
			}
		}
		return false;
	},

	// Used by class Player to check for collisions between the Player and any other Player
	checkPlayerToPlayerCollision(destinationX, destinationY, playersList, playerRadius) {
		// Check if the player (a circle) will collide with other players (also circles)
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
			if (distance < playerRadius + playersList[i].getRadius()) {
				// console.log("player collision detected -- player with player");
				return "player"
			}
		}
	},

	// Used by class Player to check for collisions between the Player and environment objects. Only the human player should be calling this method.
	// Return the type of actor it collides with, else null if no collision
	checkPlayerToObjectCollision(destinationX, destinationY, environmentList, playerRadius) {
		// TODO: Get rid of Line... it being in the env list will mess up other code
		for (let i = 0; i < environmentList.length; i++) {
			// console.log(environmentList[i]);
			if (environmentList[i] instanceof Line) { continue; }
			let objPosition = environmentList[i].getStartingPosition();
			let dx = destinationX - objPosition.x;
			let dy = destinationY - objPosition.y;
			let distance = Math.sqrt(dx * dx + dy * dy);
	
			if (distance < playerRadius + environmentList[i].getRadius()) {
				if (distance < playerRadius / 4 + environmentList[i].getRadius() / 2) {
					return {
						type: environmentList[i],
						overlap: "full"
					}
				}
				return {
					type: environmentList[i],
					overlap: "partial"
				}
			}
		}
	},

};