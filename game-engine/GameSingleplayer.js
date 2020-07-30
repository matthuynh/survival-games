
// Import the Stage (this allows the server access to the game)
const SingleplayerStage = require("./StageSingleplayer.js");

// A singleplayer game has a single human player and 1 or more bot players in it
module.exports = class GameSingleplayer {
	constructor(ws, wss, gameId, gamePlayers, generationSettings, endSingleplayerGame) {
		this.ws = ws;
        this.wss = wss;
		this.gameId = gameId; // a game has the same ID as its lobby
		this.players = gamePlayers;
		const numPlayers = gamePlayers.length;

		// Function 'pointer' that is defined in class LobbySingleplayer
		this.endSingleplayerGame = endSingleplayerGame;

		// Initialize the server-side stage
		this.stage = new SingleplayerStage(
			this.gameId,
			this.players,
			numPlayers,
			this.endSingleplayerGame,
			generationSettings
		);
	}

	// Return the initial starting state of this stage (called when the game starts)
	getInitialState() {
		return this.stage.getInitialStageState();
	}

	// Given a player's movement or mouse click, update the state
	updateState(update) {
		// console.log("Fetching player updates");

		// Get the ID of the player who triggered this update
		let pid = update.pid;
		let player = this.stage.getPlayer(pid);

		// Only clients with a player that is still alive can make updates
		if (player) {
			if (update.type == "move") {
				player.setMovementDirection(update.x, update.y);
			} else if (update.type == "cursor") {
				player.setCursorDirection(update.x, update.y, update.width, update.height);
			} else if (update.type == "click") {
				player.setFiringDirection(update.x, update.y, update.width, update.height);
			} else if (update.type == "weapon-toggle") {
				player.setWeapon(update.toggle);
			}
		}
	}

	// Triggers a step in the stage, allowing stage model to re-calculate all logic
	calculateUpdates() {
		this.stage.step();
	}

	// Send the state of the stage to the human single player
	sendPlayerUpdates() {
		// console.log("Sending player updates");
		let update = this.stage.getUpdatedStageState();

		let updatedState = JSON.stringify({
			type: "stage-update",
			playerActors: update.players,
			bulletActors: update.bullets,
			environmentActors: update.environment,
			numAlive: update.numAlive,
			hasEnded: update.hasEnded,
        });
        
        this.ws.send(updatedState);
	}

	// Return the PID of the winner of the game, else if game is still ongoing, return null
	getGameWinner() {
		return this.stage.getWinner();
	}
}