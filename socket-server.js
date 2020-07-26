const LobbyMultiplayer = require("./game-engine/LobbyMultiplayer");
const LobbySingleplayer = require("./game-engine/LobbySingleplayer");

const WebSocketServer = require("ws").Server;
const server = require('http').createServer();
const app = require("./express-server.js");
const PORT = require("./express-server.js").port; // uses the PORT defined in express-server.js
let wss = new WebSocketServer({
	server: server
});
server.on('request', app); // HTTP requests will be handled by express-server.js

// The ws server keeps track of connected clients and game lobbies
let connectedClients = [];

// The client joins the lobby; associate that lobby with the client object
const associateClientLobby = (clientPID, lobbyNumber) => {
	for (let i = 0; i < connectedClients.length; i++) {
		if (connectedClients[i].PID === clientPID) {
			// console.log(`[WSS INFO] Associating client ${clientPID} with lobby ${lobbyNumber}`);
			connectedClients[i].lobbyID = lobbyNumber;
			break;
		}
	}
};

// The client leaves the lobby; disassociate that lobby from the client object
const disassociateClientLobby = (clientPID) => {
	for (let i = 0; i < connectedClients.length; i++) {
		if (connectedClients[i].PID === clientPID) {
			// console.log(`[WSS INFO] Disassociating client ${clientPID} with lobby ${lobbyNumber}`);
			connectedClients[i].lobbyID = null;
			break;
		}
	}
}

// Send updated state of lobbies to the specified client web socket
const sendUpdatedLobbiesToClient = (ws) => {
	ws.send(lobbyList = JSON.stringify({
		type: "view-lobbies",
		lobbies: serverInstance.getLobbiesJSON(),
	}));
}

// TODO: Check difference between wss.broadcastUpdatedLobbies and const broadcastUpdatedLobbies
// Send updated state of lobbies to all connected client sockets
// This is called whenever the state of a lobby changes
const broadcastUpdatedLobbies = () => {
	wss.broadcast(JSON.stringify({
		type: "view-lobbies",
		lobbies: serverInstance.getLobbiesJSON(),
	}));
}

wss.on("close", function () {
	console.log(`[WSS INFO] Web socket server disconnected`);
});

// Send an update to all connected clients
wss.broadcast = function (serverUpdate) {
	this.clients.forEach((clientSocket) => {
		clientSocket.send(serverUpdate);
	});
};

// Send an update to all clients in a specific lobby
// Typically used to ensure client's stage are synced to the server stage for that lobby (eg. stage-update, stage-initialization, or stage-termination)
wss.broadcastToLobby = function (serverUpdate, lobbyId) {
	let lobbySockets = serverInstance.getLobby(lobbyId).getPlayersSockets();
	lobbySockets.forEach((socket) => {
		socket.send(serverUpdate);
	});
};

// Send an update to all clients in a specific multiplayer lobby, except for the lobby owner
wss.broadcastToLobbyNonOwner = function (serverUpdate, lobbyId, lobbyOwnerId) {
	let lobbyMembers = serverInstance.getLobby(lobbyId).getPlayers();
	lobbyMembers.forEach((member) => {
		if (member.pid !== lobbyOwnerId) {
			member.socket.send(serverUpdate);
		}
	})
}

// TODO: Check difference between wss.broadcastUpdatedLobbies and const broadcastUpdatedLobbies
// Send updated state of lobbies to all connected client sockets
// This is called whenever the state of a lobby changes
wss.broadcastUpdatedLobbies = function() {
	wss.broadcast(JSON.stringify({
		type: "view-lobbies",
		lobbies: serverInstance.getLobbiesJSON(),
	}));
}

// Client connects to the web socket server
wss.on("connection", function connection(ws, req) {
	// Add this newly-connected client to our clients list
	let connectedUsername = req.url.split("=")[1];
	if (connectedUsername == null) {
		console.log("[WSS WARNING] Unable to identify connecting client... disconnecting client");
		// TODO: Test this out. Boot out the new connection instead of continuing with this process
		ws.close(1000, "Unable to identify client");
	}
	connectedClients.push({
		socket: ws,
		PID: connectedUsername,
		lobbyID: null,
	});
	console.log(`[WSS INFO] Client ${connectedUsername} connected. There are now ${connectedClients.length} connected clients`);

	// Send the current state of lobbies to the user
	sendUpdatedLobbiesToClient(ws);

	// Client closes socket connection on server; remove them from any lobbies and games
	ws.on("close", function () {
		console.log(`[WSS INFO] Client closing socket connection to server`);
		let disconnectedClient;
		let disconnectedClientIndex;

		// Identify the disconnected client
		for (let i = 0; i < connectedClients.length; i++) {
			if (connectedClients[i].socket === ws) {
				disconnectedClient = connectedClients[i];
				disconnectedClientIndex = i;
				console.log(`[WSS INFO] Client identified as ${disconnectedClient.PID}. Client disconnected.`);
				break;
			}
		}

		// Remove that client from any lobbies it is in
		let lobby = serverInstance.getLobby(disconnectedClient.lobbyID);
		if (lobby) {
			console.log(`[WSS INFO] The disconnected client is in the lobby with ID ${disconnectedClient.lobbyID}, removing them from lobby`);
			
			// If lobby type is multiplayer, remove them from lobby
			if (lobby.getLobbyType() === "multiplayer") {
				// If they are lobby owner, kick everyone else out and then delete lobby
				if (lobby.getLobbyOwnerId() === disconnectedClient.PID) {
					wss.broadcastToLobbyNonOwner(JSON.stringify({
						type: "kicked-lobby"
					}), disconnectedClient.lobbyID, disconnectedClient.PID);
					serverInstance.deleteLobby(disconnectedClient.lobbyID);
					console.log(`[WSS INFO] The disconnected client is also lobby owner. Deleting multiplayer lobby ${disconnectedClient.lobbyID}`);
				} 
				// Non-lobby owners just leave the lobby
				else {
					lobby.leaveLobby(disconnectedClient.PID, "disconnection");
				}
			} 
			// If lobby type is singleplayer, just delete the lobby
			else {
				// TODO: Refactor this to be more proper for singleplayer
				// If they are lobby owner, kick everyone else out
				if (lobby.getLobbyOwnerId() === disconnectedClient.PID) {
					serverInstance.deleteLobby(disconnectedClient.lobbyID);
					console.log(`[WSS INFO] Deleting singleplayer lobby ${disconnectedClient.lobbyID}`);
				}
			}
			
			broadcastUpdatedLobbies();
		}

		// Remove the disconnected client from the connected clients list
		connectedClients.splice(disconnectedClientIndex, 1);
		console.log(`[WSS INFO] There are now ${connectedClients.length} connected clients`);
	});

	// When we receive an update from the client, take the appropriate action
	ws.on("message", function (clientUpdate) {
		clientUpdate = JSON.parse(clientUpdate);
		let lobby, connectedClient;
		// console.log(clientUpdate);

		switch (clientUpdate.type) {
			// Client interacts with ongoing game on client side stage. Apply changes to server side stage
			case "move":
			case "click":
			case "cursor":
			case "weapon-toggle":
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					lobby.updateGameState(clientUpdate);
				}
				break;

			// Client wants to create a multiplayer lobby. Only the lobby owner can do this.
			case "create-lobby-multiplayer":
				// The given user id creates and joins the lobby
				connectedClient = connectedClients.find((client) => 
					client.PID == clientUpdate.pid
				);
				let multiplayerLobby = serverInstance.createLobby(
					clientUpdate.pid,
					connectedClient.socket,
					"multiplayer"
				);
				associateClientLobby(clientUpdate.pid, multiplayerLobby.getLobbyId());
				
				// Send information back to client
				ws.send(
					JSON.stringify({
						type: "new-lobby-multiplayer",
						newLobbyId: multiplayerLobby.getLobbyId(),
						lobbies: serverInstance.getLobbiesJSON(),
					})
				);

				broadcastUpdatedLobbies();
				console.log(`[WSS INFO] Client ${clientUpdate.pid} created and joined multiplayer lobby ${multiplayerLobby.getLobbyId()}`);
				break;

			// Client wants to create a singleplayer lobby
			case "create-lobby-singleplayer":
				// The given user id creates and joins the lobby
				connectedClient = connectedClients.find((client) => 
					client.PID == clientUpdate.pid
				);
				console.log(`[WSS INFO] Client ${clientUpdate.pid} attempting to create singleplayer lobby`);

				let singleplayerLobby = serverInstance.createLobby(
					clientUpdate.pid,
					connectedClient.socket,
					"singleplayer"
				);
				associateClientLobby(clientUpdate.pid, singleplayerLobby.getLobbyId());
				
				// Send information back to client
				ws.send(
					JSON.stringify({
						type: "new-lobby-singleplayer",
						newLobbyId: singleplayerLobby.getLobbyId(),
						lobbies: serverInstance.getLobbiesJSON(),
					})
				);

				broadcastUpdatedLobbies();
				console.log(`[WSS INFO] Client ${clientUpdate.pid} created and joined singleplayer lobby ${singleplayerLobby.getLobbyId()}`);
				break;

			// A client attempts to delete the lobby. Only the lobby owner can do this.
			case "delete-lobby-multiplayer":
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

						console.log(`[WSS INFO] Client ${clientUpdate.pid} deleted multiplayer lobby ${clientUpdate.lobbyId}`);
					}
				}
				break;
			
			// A client attempts to delete the lobby. Only the lobby owner can do this.
			case "delete-lobby-singleplayer":
				// console.log("Client tries to delete lobby on server");

				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// Check if the player owns the lobby
					if (lobby.getLobbyOwnerId() == clientUpdate.pid) {
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

						console.log(`[WSS INFO] Client ${clientUpdate.pid} deleted singleplayer lobby ${clientUpdate.lobbyId}`);
					}
				}
				break;

			// Client wants to start game. Only the lobby owner can do this.
			// The game can only start if all players have status "In Lobby"
			case "start-game-multiplayer":
				console.log(`[WSS INFO] Client ${clientUpdate.pid} attempting to start multiplayer game`);

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

			case "start-game-singleplayer":
				console.log(`[WSS INFO] Client ${clientUpdate.pid} attempting to start singleplayer game`);

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
							ws.send(initialGameState);

							broadcastUpdatedLobbies();
						}
					}
				}
				break;

			// Client wants to join a multiplayer lobby. Only non-lobby owners can do this
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
			case "leave-lobby-multiplayer":
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
			// This is triggered client-side only via the game menu 
			case "leave-game":
				console.log(`[WSS INFO] Client ${clientUpdate.pid} left game on client side. Trying to reflect changes in server stage`);

				// Check to see if the lobby exists
				lobby = serverInstance.getLobby(clientUpdate.lobbyId);
				if (lobby) {
					// Check to see if the user is in the lobby, if so, remove them from game
					if (lobby.isPlayerInLobby(clientUpdate.pid)) {
						console.log(`[WSS INFO] Client ${clientUpdate.pid} was in lobby ${clientUpdate.lobbyId}. Removing them from game`);

						lobby.leaveGame(clientUpdate.pid, "quit");

						// Successfully left lobby, alert user
						let newGameState = JSON.stringify({
							type: "left-game",
							pid: clientUpdate.pid,
							status: "success",
						});
						ws.send(newGameState);
						broadcastUpdatedLobbies();
					} 
					// Could not leave lobby, send message to that player
					else {
						console.log(`[WSS WARNING] The given client is NOT currently in the lobby`);
						let errorMessage = JSON.stringify({
							type: "left-lobby",
							status: "failure",
							message: "The given client is NOT in the lobby",
						});
						ws.send(errorMessage);
					}
				} else {
					console.log(`[WSS WARNING] That lobby ID does not exist`);
					let errorMessage = JSON.stringify({
						type: "left-game",
						status: "failure",
						message: "That lobby ID does not exist",
					});
					ws.send(errorMessage);
				}
				break;

			default:
				console.log("[WSS WARNING] Server received unrecognized command from client");
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
	createLobby(lobbyOwnerId, playerSocket, lobbyType) {
		// TODO: Refactor this
		// Create a multiplayer lobby
		if (lobbyType === "multiplayer") {
			let newLobby = new LobbyMultiplayer(this.newLobbyId, lobbyOwnerId, playerSocket, wss);
			this.lobbies.push(newLobby);
			this.newLobbyId++;
			return newLobby;
		} 
		// Create a singleplayer lobby
		else {
			let newLobby = new LobbySingleplayer(this.newLobbyId, lobbyOwnerId, playerSocket, wss);
			this.lobbies.push(newLobby);
			this.newLobbyId++;
			return newLobby;
		}
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
			// If a lobby owner suddenly disconnects, all other players in lobby will forcibly have stage terminate
			if (lobbyToDelete.getLobbyType() === "multiplayer") {
				lobbyToDelete.forceStageTermination();
			}
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