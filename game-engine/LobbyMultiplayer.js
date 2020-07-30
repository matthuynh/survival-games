// Import the MultiplayerGame (this allows the server access to the game)
const MultiplayerGame = require("./GameMultiplayer.js");
const LobbyBase = require("./LobbyBase.js");

// A multiplayer lobby can contain multiple human players and can intiialize a multiplayer game
module.exports = class LobbyMultiplayer extends LobbyBase {
	constructor(lobbyId, lobbyOwnerId, ws, wss) {
        super(lobbyId, lobbyOwnerId, ws, wss);

		// NOTE: This is currently non-customizable by the user
		this.maxLobbySize = 4;

		// this.isReady = false;
		this.multiplayerGame = null;
		this.multiplayerGameInterval = null;
		this.gameWinner = null;
	}

	// Return information about this lobby in a format readable by the client
	getLobbyJSON() {
		// We use the map function to avoid sending back player.socket as well
		return {
			id: this.lobbyId,
			lobbyOwner: this.lobbyOwnerId,
			lobbyPlayers: this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
			gameInProgress: this.gameInProgress,
			numPlayers: this.lobbyPlayers.length,
			maxLobbySize: this.maxLobbySize
		};
	}

	// Get a list of players in this lobby
	getPlayers() {
		return this.lobbyPlayers;
	}

	// Get a list of players PIDs/usernames in this lobby
	getPlayersPIDs() {
		return this.lobbyPlayers.map(player => player.pid);
	}

	// Get a list of all the sockets in this lobby
	getPlayersSockets() {
		return this.lobbyPlayers.map(player => player.socket);
	}

	// A player joins a lobby. Return true if successful, otherwise false.
	joinLobby(playerId, playerSocket) {
		let playerIndex = this.lobbyPlayers.findIndex(player => player.pid == playerId);

		// Player is not in lobby yet; add them
		if (playerIndex == -1) {
			this.lobbyPlayers.push({ pid: playerId, socket: playerSocket, status: "In Lobby", type: "Human" });
			return true;
		}
		return false;
	}

	// A player leaves a lobby. Return true if successful, otherwise false.
	leaveLobby(playerId, reason) {
		let playerIndex = this.lobbyPlayers.findIndex(player => player.pid == playerId);

		// Player is in lobby; remove them
		if (playerIndex > -1) {
			this.lobbyPlayers.splice(playerIndex, 1);
			// console.log("Successfully removed player from lobby, at index " + playerIndex);

			// If there is an ongoing game, remove them from the game as well
			if (this.gameInProgress) {
				this.multiplayerGame.setPlayerDead(playerId, reason);
			}
			return true;
		}
		return false;
	}

	// Begins the multiplayer game in this lobby, returns the initial game state
	initializeGame() {
		this.gameInProgress = true;
		this.lobbyPlayers.forEach((player) => {
			player.status = "In Game";
		})

		// NOTE: We pass in an anonymous function so that it can be called by ./game-engine/StageMultiplayer.js and access the 'this' keyword to refer to this Lobby instance
		this.multiplayerGame = new MultiplayerGame(
			this.wss,
			this.lobbyId,
			this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status, type: player.type })),
			(playerId, status) => {
				// function "name" is setPlayerStatus, handles changing player status (eg. dead, spectating)
				// See LobbyBase constructor for possible statuses ("In Lobby", "In Game", "Winner!", "Spectating")
				console.log(`[WSS INFO] ${playerId} either died or won, status is ${status}`);
				let index = this.lobbyPlayers.findIndex(player => player.pid == playerId);
				this.lobbyPlayers[index].status = status;
				if (status === "Spectating") {
					this.lobbyPlayers[index].socket.send(JSON.stringify({
						pid: playerId,
						type: "lost-game"
					}));
				}
				// console.log(this.lobbyPlayers[index]);
				this.wss.broadcastUpdatedLobbies();
			}
		);

		try {
			// Run the multiplayer game on an interval
			this.multiplayerGameInterval = setInterval(async () => {
				// console.log("[GAME STATUS] SENDING UPDATES TO PLAYERS");
				this.multiplayerGame.calculateUpdates();
				this.multiplayerGame.sendPlayerUpdates(this.wss);

				// Check to see if the game has ended (only 1 player remaining)
				// TODO: There is probably a better way to trigger endGame() when a player wins.... pass in a callback to MultiplayerGame, like with initializeGame?
				let gameWinner = this.multiplayerGame.getGameWinner();
				if (gameWinner) {
					this.endGame(gameWinner);
				}
			}, 20);
		} catch (e) {
			console.log(`[WSS WARNING] ${e}`);
		}

		// Return initial game state
		let initialState = this.multiplayerGame.getInitialState();
		// console.log(initialState);
		return initialState;
    }
    
    // Send updates to a server from a client's controller
	updateGameState(clientUpdate) {
		if (this.gameInProgress) {
			this.multiplayerGame.updateState(clientUpdate);
		}
	}
	
	// Ends the multiplayer game in this lobby
	endGame(gameWinner) {
		clearInterval(this.multiplayerGameInterval); // clearInterval is a library function
		this.multiplayerGame = null;
		this.gameWinner = gameWinner;
		this.gameInProgress = false;
		this.gameHasEnded = true;
	}

	// Return the winner of the game
	getLobbyWinner() {
		return this.gameWinner;
	}

	// When a game finishes, the lobby is "reinitialized"
	reinitializeLobby() {
		this.gameInProgress = false;
		this.multiplayerGame = null;
		this.multiplayerGameInterval = null;
		// this.wss = wss; // TODO: Check to see if this is necessary
		this.gameHasEnded = false;

		// Send update to all clients, telling those who are connected
		// to this lobby to clear their own model instance
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: this.gameWinner,
			isForced: false
		});

		this.gameWinner = null;
		this.wss.broadcastToLobby(updatedState, this.lobbyId);
	}

	// A player leaves the currently ongoing game in the lobby
	leaveGame(playerId, reason) {
		let playerIndex = this.lobbyPlayers.findIndex(player => player.pid == playerId);

		if (playerIndex > -1) {
			this.lobbyPlayers[playerIndex].status = "In Lobby";
			if (this.gameInProgress) {
				this.multiplayerGame.setPlayerDead(playerId, reason);
			}
			return true;
		}
		return false;
    }
    
    // When the owner closes the lobby while a game is ongoing, forces
	// other players to terminate their stage and immediately head back to lobby page
	forceStageTermination() {
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: "",
			isForced: true
		});
		this.wss.broadcastToLobby(updatedState, this.lobbyId);
    }
    
    getLobbyType() {
        return "multiplayer";
    }
}