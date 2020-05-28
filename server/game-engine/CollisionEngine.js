/**
 * A collection of functions that handle collisions for the game
 *
 * - Object to x collision is used during world generation to check if
 *   the object will intersect with x if generated
 * - Player to x collision is used during player movement to check if
 *   the player will intersect with x if they move in that direction
 * 
 * Collision code needs to be refactored from: 
 * 
 */
module.exports = CollisionEngine = {
	// Used by class WorldGenerator to check for collisions between objects
	// Return true if the object collides
	checkObjectToObjectCollision() {
	},

	// Used by class Player to check for collisions between the Player and other actors (includes other players and objects)
	// Return the type of actor it collides with, else null if no collision
	checkPlayerToObjectCollision() {
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
};