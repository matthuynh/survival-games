// Import the SingleplayerGame (this allows the server access to the game)
const SingleplayerGame = require("./GameSingleplayer.js");
const LobbyBase = require("./LobbyBase.js");

// A singleplayer lobby contains a single human player and can intiialize a singleplayer game
module.exports = class LobbySingleplayer extends LobbyBase {
	constructor(lobbyId, lobbyOwnerId, ws, wss) {
        super(lobbyId, lobbyOwnerId, ws, wss);
        this.maxLobbySize = 1;
        this.ws = ws;

        // Default generation settings for a singleplayer game
        this.generationSettings = {
			numBushes: 10,
			numCrates: 8,
			numHPPots: 5,
			numAmmo: 15,
			numSpeedBoost: 1,
			numRDS: 0,
			numSmallGun: 1,
			numBigGun: 1,
			stageWidth: 2000,
			stageHeight: 2000
		};

		this.singleplayerGame = null;
		this.singleplayerGameInterval = null;
		this.gameWinner = null;
    }
    
    // Return information about this lobby in a format readable by the client
	getLobbyJSON() {
		return {
			id: this.lobbyId,
			lobbyOwner: this.lobbyOwnerId,
			lobbyPlayers: this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
			gameInProgress: this.gameInProgress,
			numPlayers: this.lobbyPlayers.length,
			maxLobbySize: this.maxLobbySize
		};
	}

    // Send updates to a server from the client's controller
	updateGameState(clientUpdate) {
		if (this.gameInProgress) {
			this.singleplayerGame.updateState(clientUpdate);
		}
	}
	
	// Ends the singleplayer game in this lobby
	endGame(gameWinner) {
		// We set a timeout to allow the client stage to redraw the GUI (namely to redraw the bots remaining counter)
		setTimeout( () => {
			console.log("endGame() called!");
	
			// clearInterval(this.singleplayerGameInterval); // clearInterval is a library function
			this.singleplayerGame = null;
			this.gameWinner = gameWinner;
			this.gameInProgress = false;
			this.gameHasEnded = true;
	
			this.reinitializeLobby();

		}, 250)
	}
	
	// Player leaves the singleplayer game. This is called from socket-server, and is triggered only when the user clicks on "Leave game" in the game menu
	leaveGame(playerId, reason) {
		const playerIndex = 0; // there will always only be 1 human player
		this.lobbyPlayers[playerIndex].status = "In Lobby";
		
		// This is if the user chose to leave the ongoing game via the game menu
		this.endGame("");		
		this.reinitializeLobby();
	}

	// When a singleplayer game finishes, the lobby is "reinitialized"
	reinitializeLobby() {
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: this.gameWinner,
			isForced: false
		});
		
		clearInterval(this.singleplayerGameInterval);
		this.gameInProgress = false;
		this.singleplayerGame = null;
		this.gameHasEnded = false;
		this.gameWinner = null;
		
		// Delete all bot players that were previously added
		this.deleteAllBots();
		
		this.ws.send(updatedState);
	}

	// A player leaves a lobby. Return true if successful, otherwise false.
	deleteAllBots() {
		// Note that the human player is always the first player in the lobbyPlayers array
		this.lobbyPlayers.splice(1);
	}

	forceStageTermination() {
		
    }

	// Initialize a new singleplayer game. The game will run on an interval until the game finishes (user wins/loses or quits)
	// Takes in user-configured stage generation settings from the front-end
	initializeGame(stageGenerationSettings) {
		console.log(stageGenerationSettings);
        this.gameInProgress = true;
		this.lobbyPlayers.forEach((player) => {
			player.status = "In Game";
			player.type = "Human";
		})

		// Determine stage size
		if (stageGenerationSettings.stageSize === "Small") {
			this.generationSettings.stageWidth = 1250;
			this.generationSettings.stageHeight = 1250;
		}
		else if (stageGenerationSettings.stageSize === "Normal") {
			this.generationSettings.stageWidth = 2000;
			this.generationSettings.stageHeight = 2000;
		}
		else if (stageGenerationSettings.stageSize === "Large") {
			this.generationSettings.stageWidth = 3000;
			this.generationSettings.stageHeight = 3000;
		}

		this.generationSettings.numberEasyBots = stageGenerationSettings.numEasyBots;
		this.generationSettings.numberMediumBots = stageGenerationSettings.numMedBots;
		this.generationSettings.numberHardBots = stageGenerationSettings.numHardBots;

		// Initialize bot players here
		if (this.generationSettings && this.generationSettings.numberEasyBots) {
			for (let i = 0; i < this.generationSettings.numberEasyBots; i++) {
				this.lobbyPlayers.push({
					pid: `EasyBot${i}`,
					status: "Bot",
					type: "EasyBot"
				})
			}
		}
		if (this.generationSettings && this.generationSettings.numberMediumBots) {
			for (let i = 0; i < this.generationSettings.numberMediumBots; i++) {
				this.lobbyPlayers.push({
					pid: `MediumBot${i}`,
					status: "Bot",
					type: "MediumBot"
				})
			}
		}
		if (this.generationSettings && this.generationSettings.numberHardBots) {
			for (let i = 0; i < this.generationSettings.numberHardBots; i++) {
				this.lobbyPlayers.push({
					pid: `HardBot${i}`,
					status: "Bot",
					type: "HardBot"
				})
			}
		}

		// NOTE: We pass in an anonymous function so that it can be called by ./game-engine/StageSingleplayer.js and access the 'this' keyword to refer to this Lobby instance
		this.singleplayerGame = new SingleplayerGame(
			this.ws,
			this.wss,
			this.lobbyId,
            this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
            this.generationSettings,
			(playerId, playerWon) => {
				// function "name" is endSingleplayerGame
				console.log("endSingleplayerGame() in LobbySingleplayer called");
				console.log("The player won? " + playerWon);

				let gameWinner = this.singleplayerGame.getGameWinner();
				console.log("The game winner is " + gameWinner); // "-1 means bots won"
				if (playerWon) {
					let index = this.lobbyPlayers.findIndex(player => player.pid == playerId);
					this.lobbyPlayers[index].status = "In Lobby";
				}
				this.endGame(gameWinner);
			}
		);

		try {
			// Run the multiplayer game on an interval
			this.singleplayerGameInterval = setInterval(async () => {
				// console.log("[GAME STATUS] SENDING UPDATES TO PLAYERS");
				if (this.singleplayerGame && !this.singleplayerGame.gameHasEnded) {
					(this.singleplayerGame && this.singleplayerGame.calculateUpdates());
					(this.singleplayerGame && this.singleplayerGame.sendPlayerUpdates(this.wss));
				}
			}, 20);
		} catch (e) {
			console.log(`[WSS WARNING] ${e}`);
		}

		// Return initial game state
		let initialState = this.singleplayerGame.getInitialState();
		// console.log(initialState);
		return initialState;
    }
    
    getLobbyType() {
        return "singleplayer";
    }
}