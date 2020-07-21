const WebSocketServer = require("ws").Server;
const server = require('http').createServer();
const app = require("./express-server.js");
const PORT = require("./express-server.js").port; // uses the PORT defined in express-server.js
let wss = new WebSocketServer({
	server: server
});

// HTTP requests will be handled by express-server.js
server.on('request', app);


// Import the MultiplayerGame (this allows the server access to the game)
const MultiplayerGame = require("./game-engine/MultiplayerGame.js");

// The ws server keeps track of connected clients and game lobbies
let connectedClients = [];

// The client joins the lobby
const associateClientLobby = (clientPID, lobbyNumber) => {
	for (let i = 0; i < connectedClients.length; i++) {
		if (connectedClients[i].PID === clientPID) {
			// console.log(`associating client ${clientPID} with a lobby`);
			connectedClients[i].lobbyID = lobbyNumber;
			break;
		}
	}
};

// The client leaves the lobby
const disassociateClientLobby = (clientPID) => {
	for (let i = 0; i < connectedClients.length; i++) {
		if (connectedClients[i].PID === clientPID) {
			// console.log(`disassociating client ${clientPID} with its lobby`);
			connectedClients[i].lobbyID = null;
			break;
		}
	}
}

// Send updated state of lobbies to only that specified socket
const sendUpdatedLobbies = (ws) => {
	ws.send(lobbyList = JSON.stringify({
		type: "view-lobbies",
		lobbies: serverInstance.getLobbiesJSON(),
	}));
}

// Send updated state of lobbies to all connected client sockets
const broadcastUpdatedLobbies = () => {
	wss.broadcast(JSON.stringify({
		type: "view-lobbies",
		lobbies: serverInstance.getLobbiesJSON(),
	}));
}

wss.on("close", function () {
	console.log("Server disconnected");
});

// Send an update to all connected clients -- used for lobbies
wss.broadcast = function (serverUpdate) {
	this.clients.forEach((clientSocket) => {
		clientSocket.send(serverUpdate);
	});
};

// Send an update to all clients in a specific lobby -- used for stage-update or stage-initialization
wss.broadcastToLobby = function (serverUpdate, lobbyId) {
	let lobbySockets = serverInstance.getLobby(lobbyId).getPlayersSockets();
	lobbySockets.forEach((socket) => {
		socket.send(serverUpdate);
	});
};

// Send an update to all clients in a specific lobby, except for the lobby owner
wss.broadcastToLobbyNonOwner = function (serverUpdate, lobbyId, lobbyOwnerId) {
	let lobbyMembers = serverInstance.getLobby(lobbyId).getPlayers();
	lobbyMembers.forEach((member) => {
		if (member.pid !== lobbyOwnerId) {
			member.socket.send(serverUpdate);
		}
	})
}

// Client connects to the web socket server
wss.on("connection", function connection(ws, req) {
	console.log("[WSS INFO] Client is starting to connect to server");

	// Add this newly-connected client to our clients list
	let connectedUsername = req.url.split("=")[1];
	if (connectedUsername == null) {
		console.log("[WSS WARNING] Unable to identify connecting client");
	}
	connectedClients.push({
		socket: ws,
		PID: connectedUsername,
		lobbyID: null,
	});
	console.log(`[WSS INFO] Client with PID ${connectedUsername} connected. There are now ${connectedClients.length} connected clients`);

	// Send the current state of lobbies to the user
	sendUpdatedLobbies(ws);

	// Client closes socket connection on server; remove them from any lobbies and games
	ws.on("close", function () {
		console.log("[WSS INFO] Client closing socket connection to server");
		let disconnectedClient;
		let disconnectedClientIndex;
		// console.log(connectedClients);
		for (let i = 0; i < connectedClients.length; i++) {
			if (connectedClients[i].socket === ws) {
				disconnectedClient = connectedClients[i];
				disconnectedClientIndex = i;
				console.log(`[WSS INFO] Client with PID ${disconnectedClient.PID} disconnected.`);
				break;
			}
		}

		// Remove that client from any lobbies it is in
		let lobby = serverInstance.getLobby(disconnectedClient.lobbyID);
		if (lobby) {
			console.log(`[WSS INFO] The disconnected client is in the lobby with ID ${disconnectedClient.lobbyID}, removing them`);
			
			// If they are lobby owner, kick everyone else out
			if (lobby.getLobbyOwnerId() === disconnectedClient.PID) {
				wss.broadcastToLobbyNonOwner(JSON.stringify({
					type: "kicked-lobby"
				}), disconnectedClient.lobbyID, disconnectedClient.PID);
				serverInstance.deleteLobby(disconnectedClient.lobbyID);
			} else {
				lobby.leaveLobby(disconnectedClient.PID, "disconnection");
			}
			
			broadcastUpdatedLobbies();
		}

		// Remove the disconnected client from the connected clients list
		connectedClients.splice(disconnectedClientIndex, 1);
		console.log(`[WSS INFO] There are now ${connectedClients.length} connected clients \n`);
	});

	// When we receive an update from the client, take the appropriate action
	ws.on("message", function (clientUpdate) {
		clientUpdate = JSON.parse(clientUpdate);

		let lobby, connectedClient;
		switch (clientUpdate.type) {
			// Client interacts with ongoing game
			case "move":
			case "click":
			case "cursor":
			case "weapon-toggle":
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// console.log(clientUpdate);
					lobby.updateGameState(clientUpdate);
				}
				break;

			// Client wants to create a lobby. Only the lobby owner can do this.
			case "create-lobby":
				// The given user id creates and joins the lobby
				connectedClient = connectedClients.find((client) => 
					client.PID == clientUpdate.pid
				);
				let createdLobby = serverInstance.createLobby(
					clientUpdate.pid,
					connectedClient.socket
				);
				associateClientLobby(clientUpdate.pid, createdLobby.getLobbyId());
				
				// Send information back to client
				ws.send(
					JSON.stringify({
						type: "new-lobby",
						newLobbyId: createdLobby.getLobbyId(),
						lobbies: serverInstance.getLobbiesJSON(),
					})
				);

				broadcastUpdatedLobbies();
				// console.log("Client created and joined lobby with id " + createdLobby.getLobbyId());
				break;

			// A client attempts to delete the lobby. Only the lobby owner can do this.
			case "delete-lobby":
				// console.log("Client tries to delete lobby on server");

				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// Check if the player owns the lobby
					if (lobby.getLobbyOwnerId() == clientUpdate.pid) {
						// Kick out other non-owner lobby members
						let closeLobbyState = JSON.stringify({
							type: "kicked-lobby"
						});
						wss.broadcastToLobbyNonOwner(closeLobbyState, clientUpdate.lobbyId, clientUpdate.pid);

						// Delete lobby
						serverInstance.deleteLobby(clientUpdate.lobbyId);
						disassociateClientLobby(clientUpdate.pid);

						// Send status to user who deleted lobby
						let newLobbyState = JSON.stringify({
							type: "deleted-lobby",
							status: "success",
							lobbies: serverInstance.getLobbiesJSON(),
						});
						ws.send(newLobbyState);

						// Send updated state of lobbies to all clients
						broadcastUpdatedLobbies();
					}
				}
				break;

			// Client wants to start game. Only the lobby owner can do this.
			// The game can only start if all players have status "In Lobby"
			case "start-game":
				console.log("[WSS INFO] Attempting to start game");

				// Check to see if the lobby exists, and the user is the owner
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					if (lobby.getLobbyOwnerId() == clientUpdate.pid) {
						let initialGameStatus = lobby.initializeGame();

						// Successfully initialized game
						if (initialGameStatus) {
							// Send the game model state to the connecting player
							let initialGameState = JSON.stringify({
								type: "stage-initialization",
								stageWidth: initialGameStatus.width,
								stageHeight: initialGameStatus.height,
								playerActors: initialGameStatus.players,
								bulletActors: initialGameStatus.bullets,
								crateActors: initialGameStatus.crates,
								environmentActors:
									initialGameStatus.environment,
								startTime: initialGameStatus.gameStartTime,
								numAlive: initialGameStatus.numAlive,
								numPlayers: initialGameStatus.numPlayers,
							});

							// Start game for all players in lobby
							wss.broadcastToLobby(
								initialGameState,
								clientUpdate.lobbyId
							);

							broadcastUpdatedLobbies();
						}
					}
				}
				break;

			// Client wants to join a lobby. Only non-lobby owners can do this
			case "join-lobby":
				// console.log(`Client with id ${clientUpdate.pid} attempts to join lobby`);
				connectedClient = connectedClients.find((client) => 
					client.PID == clientUpdate.pid
				);

				// The given user id attempts to join the lobby
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby && !lobby.isFull()) {
					let successfulJoin = lobby.joinLobby(clientUpdate.pid, connectedClient.socket);
					if (successfulJoin) {
						associateClientLobby(clientUpdate.pid, lobby.getLobbyId());

						// Send update to client
						let joinedLobbyInformation = JSON.stringify({
							type: "joined-lobby",
							lobbyId: lobby.getLobbyId(),
							lobbies: serverInstance.getLobbiesJSON(),
						});
						ws.send(joinedLobbyInformation);

						// console.log("Client joined lobby");

						broadcastUpdatedLobbies();
					} else {
						// console.log("Could not join lobby. Are you already in the lobby?");
						let errorMessage = JSON.stringify({
							type: "error",
							message:
								"Could not join lobby. Are you already in the lobby?",
						});
						ws.send(errorMessage);
					}
				} else {
					// console.log("Could not join lobby. Make sure the lobby ID exists and the lobby is not ful.");
					let errorMessage = JSON.stringify({
						type: "error",
						message:
							"Could not join lobby. Make sure the lobby ID exists and the lobby is not full.",
					});
					ws.send(errorMessage);
				}
				break;

			// A client attempts to leave the lobby. Only non-lobby owners can do this
			case "leave-lobby":
				// console.log("Client tries to leave lobby on server");
				// Check to see if the lobby exists
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// Check to see if the user is in the lobby
					if (lobby.isPlayerInLobby(clientUpdate.pid)) {
						// console.log("The given client is in the lobby, removing them");

						lobby.leaveLobby(clientUpdate.pid, "disconnection");
						disassociateClientLobby(clientUpdate.pid);
						// If the lobby is empty, delete the lobby
						if (lobby.getPlayersPIDs().length == 0) {
							serverInstance.deleteLobby(clientUpdate.lobbyId);
						}

						// Successfully left lobby, alert user
						let newLobbyState = JSON.stringify({
							type: "left-lobby",
							status: "success",
						});
						ws.send(newLobbyState);

						broadcastUpdatedLobbies();
					} else {
						// console.log("The given client is NOT in the lobby");
						// Could not leave lobby, send message to that player
						let errorMessage = JSON.stringify({
							type: "left-lobby",
							status: "failure",
							message: "The given client is NOT in the lobby",
						});
						ws.send(errorMessage);
					}
				} else {
					// console.log("That lobby ID does not exist");
					let errorMessage = JSON.stringify({
						type: "left-lobby",
						status: "failure",
						message: "That lobby ID does not exist",
					});
					ws.send(errorMessage);
				}
				break;

			// All players in a lobby may choose to leave a game (but stay in the lobby)
			case "leave-game":
				console.log("[WSS INFO] Client tries to leave game on lobby on server");
				// Check to see if the lobby exists
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// Check to see if the user is in the lobby, if so, remove them from game
					if (lobby.isPlayerInLobby(clientUpdate.pid)) {
						// console.log("The given client is in the lobby, removing them from game");

						lobby.leaveGame(clientUpdate.pid, "quit");

						// Successfully left lobby, alert user
						// let newGameState = JSON.stringify({
						// 	type: "left-game",
						// 	pid: clientUpdate.pid,
						// 	status: "success",
						// });
						// ws.send(newGameState);
						broadcastUpdatedLobbies();
					} 
					// Could not leave lobby, send message to that player
					else {
						// console.log("The given client is NOT in the lobby");
						let errorMessage = JSON.stringify({
							type: "left-lobby",
							status: "failure",
							message: "The given client is NOT in the lobby",
						});
						ws.send(errorMessage);
					}
				} else {
					// console.log("That lobby ID does not exist");
					let errorMessage = JSON.stringify({
						type: "left-game",
						status: "failure",
						message: "That lobby ID does not exist",
					});
					ws.send(errorMessage);
				}
				break;


			default:
				console.log("[WSS INFO] Server received unrecognized command from client");
		}
	});
});

// This server instance keeps track of lobbies and multiplayer games
class ServerInstance {
	constructor() {
		this.lobbies = [];
		this.newLobbyId = 0;
	}

	// Create a lobby for players to join, initially has the player ID of the lobby creator
	createLobby(lobbyOwnerId, playerSocket) {
		let newLobby = new Lobby(this.newLobbyId, lobbyOwnerId, playerSocket);
		this.lobbies.push(newLobby);
		this.newLobbyId++;
		return newLobby;
	}

	// Return the lobby with the given id
	getLobby(lobbyId) {
		for (let i = 0; i < this.lobbies.length; i++) {
			if (this.lobbies[i].getLobbyId() == lobbyId) {
				// console.log("Found lobby with with id " + lobbyId);
				return this.lobbies[i];
			}
		}
		return false;
	}

	// Get a list of all lobbies, with each lobby represented in a JSON format understandable by the client
	getLobbiesJSON() {
		let lobbiesJSON = [];
		this.lobbies.forEach((lobby) => {
			lobbiesJSON.push(lobby.getLobbyJSON());
		});
		// console.log(lobbiesJSON);
		return lobbiesJSON;
	}

	// Delete a lobby
	deleteLobby(lobbyId) {
		let lobbyToDelete = this.getLobby(lobbyId);
		if (lobbyToDelete) {
			lobbyToDelete.forceStageTermination();
			lobbyToDelete.endGame("");
			for (let i = 0; i < this.lobbies.length; i++) {
				if (this.lobbies[i].getLobbyId() == lobbyId) {
					this.lobbies.splice(i, 1);
				}
			}
		}
	}

	// Runs on an interval
	// Check to see if any games in lobbies have finished. Start ready lobbies
	checkLobbies() {
		// TODO: There is probably a better way of doing this.... pass in a callback to MultiplayerGame, like with initializeGame?
		this.lobbies.forEach((lobby) => {
			if (
				lobby.isGameInProgress() == false &&
				lobby.hasGameEnded() == true
			) {
				lobby.reinitializeLobby();
			}
		});
	}
}

// A Lobby contains players and can intiialize a multiplayer game
class Lobby {
	constructor(lobbyId, lobbyOwnerId, ws) {
		this.lobbyId = lobbyId;
		this.lobbyOwnerId = lobbyOwnerId;
		// possible statuses: "In Lobby", "In Game", "Winner!", "Spectating"
		this.lobbyPlayers = [{ pid: lobbyOwnerId, socket: ws, status: "In Lobby" }];

		// NOTE: This is currently non-customizable by the user
		this.maxLobbySize = 4;

		this.gameInProgress = false;
		this.gameHasEnded = false;

		// this.isReady = false;
		this.multiplayerGame = null;
		this.multiplayerGameInterval = null;
		this.gameWinner = null;

		// Reference to server socket
		this.wss = null;
	}

	// Return information about this lobby in a format readable by the client
	getLobbyJSON() {
		return {
			id: this.lobbyId,
			lobbyOwner: this.lobbyOwnerId,
			lobbyPlayers: this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status })),
			gameInProgress: this.gameInProgress,
			numPlayers: this.lobbyPlayers.length,
			maxLobbySize: this.maxLobbySize
		};
	}

	// Get the id of this lobby
	getLobbyId() {
		return this.lobbyId;
	}

	// Return true if the given player ID is in lobby, else false
	isPlayerInLobby(playerId) {
		let foundPlayer = this.lobbyPlayers.find(player => 
			player.pid == playerId
		);
		return foundPlayer !== "undefined";
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

	getLobbyOwnerId() {
		return this.lobbyOwnerId;
	}

	// A player joins a lobby. Return true if successful, otherwise false.
	joinLobby(playerId, playerSocket) {
		let playerIndex = this.lobbyPlayers.findIndex(player => player.pid == playerId);

		// Player is not in lobby yet; add them
		if (playerIndex == -1) {
			this.lobbyPlayers.push({ pid: playerId, socket: playerSocket, status: "In Lobby" });
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

		// NOTE: We pass in an anonymous function so that it can be called by ./game-engine/Stage.js and access the 'this' keyword to refer to this Lobby instance
		this.multiplayerGame = new MultiplayerGame(
			wss,
			this.lobbyId,
			this.lobbyPlayers.map(player => ({ pid: player.pid, status: player.status})),
			(playerId, status) => {
				// function "name" is setPlayerStatus, handles changing player status (eg. dead, spectating)
				// See Lobby for possible statuses ("In Lobby", "In Game", "Winner!", "Spectating")
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
				broadcastUpdatedLobbies();
			}
		);

		try {
			// Run the multiplayer game on an interval
			this.multiplayerGameInterval = setInterval(async () => {
				// console.log("[GAME STATUS] SENDING UPDATES TO PLAYERS");
				await this.multiplayerGame.calculateUpdates();
				await this.multiplayerGame.sendPlayerUpdates(wss);

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

	// Return true if the game is in progress
	isGameInProgress() {
		return this.gameInProgress;
	}

	// Return true if the game has ended
	hasGameEnded() {
		return this.gameHasEnded;
	}

	// Return the winner of the game
	getLobbyWinner() {
		return this.gameWinner;
	}

	// Return true if the lobby is full
	isFull() {
		return this.lobbyPlayers.length >= this.maxLobbySize;
	}

	// When the owner closes the lobby while a game is ongoing, forces
	// other players to terminate their stage
	forceStageTermination() {
		let updatedState = JSON.stringify({
			type: "stage-termination",
			lobbyID: this.lobbyId,
			winningPID: "",
			isForced: true
		});
		wss.broadcastToLobby(updatedState, this.lobbyId);
	}

	// When a game finishes, the lobby is "reinitialized"
	reinitializeLobby() {
		this.gameInProgress = false;
		this.multiplayerGame = null;
		this.multiplayerGameInterval = null;
		this.wss = wss;
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
		wss.broadcastToLobby(updatedState, this.lobbyId);
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
}

let globalInterval = null;
let serverInstance = new ServerInstance();

// Global server interval
const startGlobalInterval = (server) => {
	// This does not need to run that frequently, as it only checks for lobbies where games have finished
	globalInterval = setInterval(() => {
		if (process.env.PORT) {
			// We only print this on dev environment
			console.log(`[WSS INFO] Checking lobbies... there are ${serverInstance.getLobbiesJSON().length} lobbies`);
		}
		// console.log(serverInstance.getLobbiesJSON());
		server.checkLobbies();
	}, 5000);

	// TODO: Add a maintenance interval that runs once every 10 minutes, clearing AFK lobbies
};

startGlobalInterval(serverInstance);


// Creates a listener on the specified port
server.listen(PORT, function() {
	console.log(`[WSS INFO] Express and WebSocket server listening on ${PORT}`)
});