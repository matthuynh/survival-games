import React from "react";
// import Button from "react-bootstrap/Button";
// import Table from "react-bootstrap/Table";
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import { Link } from 'react-router-dom';
// import Auth from "../Routing/auth";
import "../css/LobbiesPage.css";

import LobbyList from "./lobby_components/LobbyList";
import Lobby from "./lobby_components/Lobby";
import CloseLobby from "./lobby_components/CloseLobby";
import GameView from "./lobby_components/GameView";
import Auth from "../Routing/auth";

import UIFx from 'uifx';
import revolverSoundImport from "../assets/audio/revolver.mp3";
import burstSoundImport from "../assets/audio/3-burst.mp3";
import emptyGunImport from "../assets/audio/empty-gun.wav";

const revolverSound = new UIFx(revolverSoundImport, {
	volume: 0.5
});

const burstSound = new UIFx(burstSoundImport, {
	volume: 0.5
});

const emptyGunSound = new UIFx(emptyGunImport, {
	volume: 0.5
});

const localIPAddress = "localhost";
const wssServerURL = `ws://${localIPAddress}:10000`;

// Note: disabled React Strict Mode in index.js, as it would cause the constructor to load twice
class LobbiesPage extends React.Component {
	_isMounted = false;
	constructor(props) {
		super(props);
		this.state = {
			showGameView: false,
			playerId: null,
			userWon: false,
			userLost: false,
			joinedLobbyId: null,
			lobbies: [],
			lobbyClosed: false,

			// Player movement code
			movingUp: false,
			movingLeft: false,
			movingDown: false,
			movingRight: false,
			horizontalDirection: 0,
			verticalDirection: 0,

			// Browser screen dimension
			width: 0,
			height: 0
		};

		// Set ref for canvas (alternative to document.getElementById(...))
		this.canvasRef = React.createRef();

		// Controller functions
		this.returnToDashboard = this.returnToDashboard.bind(this);
		this.sendMovement = this.sendMovement.bind(this);
		this.sendMouseClick = this.sendMouseClick.bind(this);
		this.sendMouseMove = this.sendMouseMove.bind(this);
		this.sendWeaponSwitch = this.sendWeaponSwitch.bind(this);
		this.sendGUIToggle = this.sendGUIToggle.bind(this);

		this.handleCreateLobby = this.handleCreateLobby.bind(this);
		this.handleJoinLobby = this.handleJoinLobby.bind(this);
		this.handleLeaveLobby = this.handleLeaveLobby.bind(this);
		this.handleDeleteLobby = this.handleDeleteLobby.bind(this);
		this.handleStartGame = this.handleStartGame.bind(this);
		this.handleLeaveGame = this.handleLeaveGame.bind(this);
		this.handleCloseLobbyDialog = this.handleCloseLobbyDialog.bind(this);

		// Keyboard/mouse listener functions
		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleKeyRelease = this.handleKeyRelease.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);

		this.updateDimensions = this.updateDimensions.bind(this);
	}

	// Called whenever the user resizes their browser screen
	updateDimensions(width, height) {
		this.setState({ width: width, height: height });
	}

	// Return to lobby view after lobby owner closed lobby
	handleCloseLobbyDialog() {
		this.setState({
			lobbyClosed: false
		})
	}

	// Return to dashboard, close sockets, and reset state
	returnToDashboard(reason) {
		this.clientSocket.close();
		window.stopStageGame();
		document.removeEventListener("keydown", this.handleKeyPress);
		document.removeEventListener("keyup", this.handleKeyRelease);
		document.removeEventListener("mousemove", this.handleMouseMove);
		document.removeEventListener("mousedown", this.handleMouseDown);

		this.setState({
			showGameView: false,
			userWon: false,
			userLost: false,
			joinedLobbyId: null,
			lobbies: [],
			lobbyClosed: false,
			movingUp: false,
			movingLeft: false,
			movingDown: false,
			movingRight: false,
			horizontalDirection: 0,
			verticalDirection: 0
		});

		if (reason == "socket-server-closed") {
			this.props.history.push("/dashboard", { response: "socket-server-closed" });
		} else {
			this.props.history.push("/dashboard");
		}
	}

	// Runs when the page unloads (eg. a game finishes)
	componentWillUnmount() {
		// This variable is used to prevent unnecessary setstates on this unmounted component
		this._isMounted = false;
	}

	// Runs when the page loads
	async componentDidMount() {
		this._isMounted = true;
		
		try {
			// Check user authentication status and username to connect to socket server
			let playerId = await Auth.getUsername();
			if (playerId === "") {
				// Unable to get username, handled in catch statement
				throw Error("Unable to get player ID -- cannot connect to socket server");
			}
			this.clientSocket = new WebSocket(`${wssServerURL}?connectingUID=${playerId}`);
			if (this._isMounted) { 
				this.setState({ playerId: playerId });
			}
			
			this.clientSocket.onopen = () => {
				console.log("Front-end connected to the web server");
			};
	
			this.clientSocket.onclose = (event) => {
				console.log("Front-end closing connectiong to web server");
				this.returnToDashboard("socket-server-closed");
			};
	
			// When the client receives a message from the server, we will update our client accordingly
			this.clientSocket.onmessage = (event) => {
				let serverUpdate = JSON.parse(event.data);
				// console.log(serverUpdate);
				if (serverUpdate && this._isMounted) {
					switch (serverUpdate.type) {
						// Update the client's game model state
						case "stage-update":
							window.updateStageModel(
								serverUpdate.playerActors,
								serverUpdate.bulletActors,
								serverUpdate.environmentActors,
								serverUpdate.numAlive,
								serverUpdate.hasEnded
							);
							break;
	
						// Initialize client game model state by receiving initial model state from server
						case "stage-initialization":
							this.setState({ showGameView: true });
							console.log("Starting client stage model");
	
							// Initialize state of the client model
							window.setupStageModel(
								this.canvasRef.current,
								serverUpdate.stageWidth,
								serverUpdate.stageHeight,
								serverUpdate.playerActors,
								serverUpdate.bulletActors,
								serverUpdate.crateActors,
								serverUpdate.environmentActors,
								serverUpdate.startTime,
								serverUpdate.numAlive,
								serverUpdate.numPlayers,
								this.state.playerId
							);
	
							// Start the client model interval (for re-drawing)
							window.startStageModel();
							document.addEventListener("keydown", this.handleKeyPress);
							document.addEventListener("keyup", this.handleKeyRelease);
							document.addEventListener("mousemove", this.handleMouseMove);
							document.addEventListener("mousedown", this.handleMouseDown);
							break;
	
						// Receive list of updated lobbies state from socket server
						case "view-lobbies":
							console.log("Updating lobby view");
							// console.log(serverUpdate.lobbies);
							this.setState({
								lobbies: serverUpdate.lobbies
							});
							break;
	
						// Created a lobby, receive the lobby id
						case "new-lobby":
							this.setState({
								lobbies: serverUpdate.lobbies,
								joinedLobbyId: serverUpdate.newLobbyId
							});
							break;
	
						// User joined a lobby successfully
						case "joined-lobby":
							// console.log("joined-lobby");
							// console.log("Setting state of lobbies");
							// console.log("Reached");
							this.setState({
								lobbies: serverUpdate.lobbies,
								joinedLobbyId: serverUpdate.lobbyId
							});
							// console.log(serverUpdate.lobbies);
							break;
	
						// User left their lobby successfully
						case "left-lobby":
							if (serverUpdate.status === "success") {
								this.setState({
									joinedLobbyId: null
								});
							}
							break;
	
						// User (who is also the lobby owner) deleted lobby successfully
						case "deleted-lobby":
							if (serverUpdate.status === "success") {
								this.setState({
									lobbies: serverUpdate.lobbies,
									joinedLobbyId: null
								});
							}
							break;
	
						// Re-initialize the stage (user loss or won)
						case "stage-termination":
							console.log("Trying to terminate stage");
							document.removeEventListener("keydown", this.handleKeyPress);
							document.removeEventListener("keyup", this.handleKeyRelease);
							document.removeEventListener("mousemove", this.handleMouseMove);
							document.removeEventListener("mousedown", this.handleMouseDown);
							window.stopStageGame();
	
							if (serverUpdate.isForced) {
								this.setState({
									showGameView: false,
									userWon: false,
									userLost: false,
									joinedLobbyId: null,
									lobbyClosed: true,
									movingUp: false,
									movingLeft: false,
									movingDown: false,
									movingRight: false,
									horizontalDirection: 0,
									verticalDirection: 0
								});
							} else if (serverUpdate.winningPID === this.state.playerId) {
								this.setState({
									userWon: true
								});
							}
	
							break;
	
						// The lobby owner (not this user) closed the lobby
						case "kicked-lobby":
							this.setState({
								lobbyClosed: true,
								joinedLobbyId: null
							});
							break;
	
	
						// TODO: Add this (?)
						case "left-game":
	
							break;
	
						case "lost-game":
							this.setState({
								userLost: true
							});
							break;
	
						default:
							console.log("Received unknown update from socket server");
					}
				}
			};
		} catch (error) {
			console.log(error);
			if (Auth.isValidLoginSession()) {
				this.props.history.push("/dashboard");
			} else {
				this.props.history.push("/login");
			}
		}
	}

	// A player can join a preexisting lobby on the server
	handleJoinLobby(lobbyId) {
		// console.log("Client tries to join lobby with id " + lobbyId);

		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "join-lobby",
			lobbyId: lobbyId,
		});
		this.clientSocket.send(clientUpdate);
	}

	// A player can leave the lobby they are in
	handleLeaveLobby(playerId, lobbyNumber) {
		console.log("Inside handleLeaveLobby()");
		// console.log("Client tries to leave lobby with id " + lobbyNumber);

		let clientUpdate = JSON.stringify({
			pid: playerId,
			type: "leave-lobby",
			lobbyId: lobbyNumber,
		});
		this.clientSocket.send(clientUpdate);
	}

	// A player creates a lobby on the server. That player automatically joins the lobby as well
	handleCreateLobby() {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "create-lobby",
		});
		this.clientSocket.send(clientUpdate);
	}

	// A player deletes the lobby he is in 
	handleDeleteLobby(playerId, lobbyId) {
		console.log("Inside handleDeleteLobby()");
		let clientUpdate = JSON.stringify({
			type: "delete-lobby",
			pid: playerId,
			lobbyId: lobbyId
		})
		this.clientSocket.send(clientUpdate);
	}

	// A lobby owner attempts to starts a game on a lobby on the server
	handleStartGame(ownerId, lobbyId) {
		console.log("Inside handleStartGame()");
		// console.log(ownerId);
		// console.log(lobbyId);

		// Note that only the owner of a valid lobby may start a game
		let clientUpdate = JSON.stringify({
			pid: ownerId,
			type: "start-game",
			lobbyId: lobbyId,
		});
		console.log(clientUpdate);
		this.clientSocket.send(clientUpdate);
	}

	// User leaves game
	handleLeaveGame(playerId, lobbyId) {
		console.log("Inside handleLeaveGame()");
		// Note that leaving a game also causes you to leave the lobby
		let clientUpdate = JSON.stringify({
			type: "leave-game",
			pid: playerId,
			lobbyId: lobbyId,
		});
		this.clientSocket.send(clientUpdate);

		window.stopStageGame();

		// Unhook keyboard and mouse listeners
		document.removeEventListener("keydown", this.handleKeyPress);
		document.removeEventListener("keyup", this.handleKeyRelease);
		document.removeEventListener("mousemove", this.handleMouseMove);
		document.removeEventListener("mousedown", this.handleMouseDown);

		// Resets user's game state
		this.setState({ showGameView: false, userLost: false, userWon: false });
	}

	// Sends this player's movement to server
	sendMovement(horizontalDirection, verticalDirection) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "move",
			x: horizontalDirection,
			y: verticalDirection,
		});
		this.clientSocket.send(clientUpdate);
	}

	// Sends this player's mouse click to server
	sendMouseClick(xPosition, yPosition) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "click",
			x: xPosition,
			y: yPosition,
			width: this.state.width,
			height: this.state.height
		});
		this.clientSocket.send(clientUpdate);
	}

	// Sends this player's mouse click to server
	sendMouseMove(xPosition, yPosition) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "cursor",
			x: xPosition,
			y: yPosition,
			width: this.state.width,
			height: this.state.height
		});
		this.clientSocket.send(clientUpdate);
	}

	// Send weapon toggle to server
	sendWeaponSwitch(key) {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			lobbyId: this.state.joinedLobbyId,
			type: "weapon-toggle",
			toggle: key
		});
		this.clientSocket.send(clientUpdate);
	}

	// Send GUI toggle to the client view (ClientController.js) -- this doesn't need to go to server
	sendGUIToggle(key) {
		window.toggleGUI();
	}

	// ----- KEYBOARD AND MOUSE LISTENER CODE --------------------------------------------
	// Captures any keyboard presses
	handleKeyPress(event) {
		// console.log("Pressed on key " + event.key);
		if (event && event.key) {
			let key = event.key.toLowerCase();

			// Check which key(s) were pressed; calculate movement direction
			if ("wasd".includes(key)) {
				if (key === "a") {
					this.setState({ movingLeft: true });
					this.setState({ horizontalDirection: -1 });
				}
				if (key === "d") {
					this.setState({ movingRight: true });
					this.setState({ horizontalDirection: 1 });
				}
				if (key === "w") {
					this.setState({ movingUp: true });
					this.setState({ verticalDirection: -1 });
				}
				if (key === "s") {
					this.setState({ movingDown: true });
					this.setState({ verticalDirection: 1 });
				}
				this.sendMovement(
					this.state.horizontalDirection,
					this.state.verticalDirection
				);
			}
			// Used for switching between weapons
			if ("123".includes(key)) {
				this.sendWeaponSwitch(key);
			}
			// Used for toggling GUI display
			if ("h".includes(key)) {
				this.sendGUIToggle(key);
			}
		}
	}

	// When key is released, performs appropriate task
	handleKeyRelease(event) {
		// console.log("Released key " + event.key);
		if (event && event.key) {
			let key = event.key.toLowerCase();

			// A movement key is released; calculate new movement direction
			if ("wasd".includes(key)) {
				if (key === "a") {
					this.setState({ movingLeft: false });
					if (this.state.movingRight) {
						this.setState({ horizontalDirection: 1 });
					} else {
						this.setState({ horizontalDirection: 0 });
					}
				}
				if (key === "d") {
					this.setState({ movingRight: false });
					if (this.state.movingLeft) {
						this.setState({ horizontalDirection: -1 });
					} else {
						this.setState({ horizontalDirection: 0 });
					}
				}
				if (key === "w") {
					this.setState({ movingUp: false });
					if (this.state.movingDown) {
						this.setState({ verticalDirection: 1 });
					} else {
						this.setState({ verticalDirection: 0 });
					}
				}
				if (key === "s") {
					this.setState({ movingDown: false });
					if (this.state.movingUp) {
						this.setState({ verticalDirection: -1 });
					} else {
						this.setState({ verticalDirection: 0 });
					}
				}
				this.sendMovement(
					this.state.horizontalDirection,
					this.state.verticalDirection
				);
			}
		}
	}

	// Handle when the mouses buttons are pressed
	handleMouseDown(event) {
		let canvas = this.canvasRef.current.getBoundingClientRect();
		let xPosition = event.clientX - canvas.left;
		let yPosition = event.clientY - canvas.top;
		// console.log(`{${xPosition}, ${yPosition}}`);

		// Only send valid mouse clicks (must be within canvas)
		if (xPosition >= 0 && yPosition >= 0) {
			// Send this action through websockets to the server
			this.sendMouseClick(xPosition, yPosition);
			// console.log(window.getCurrentPlayerWeapon());
			let currentGun = window.getCurrentPlayerWeapon();
			switch (currentGun) {
				case 1:
					revolverSound.play();
					break;
				case 2:
					burstSound.play();
					break;
				case -1:
					emptyGunSound.play();
					break;
				default:
					break;
			}
		}
	}

	// Handle mouse movement (movement os human's cursor)
	handleMouseMove(event) {
		let canvas = this.canvasRef.current.getBoundingClientRect();
		let xPosition = event.clientX - canvas.left;
		let yPosition = event.clientY - canvas.top;
		// console.log(`{${xPosition}, ${yPosition}}`);

		// Only send valid mouse movements (must be within canvas)
		if (xPosition >= 0 && yPosition >= 0) {
			// Send this action through websockets to the server
			this.sendMouseMove(xPosition, yPosition);
		}
	}

	render() {
		// console.log("State of joined lobby id is " + this.state.joinedLobbyId);
		// "Lobby closed" screen
		if (this.state.lobbyClosed) {
			return (
				<CloseLobby
					handleCloseLobbyDialog={this.handleCloseLobbyDialog}
				/>
			);
		}

		// Render the main lobby view
		else if (this.state.joinedLobbyId === null) {
			return (
				<LobbyList
					lobbies={this.state.lobbies}
					joinLobby={this.handleJoinLobby}
					createLobby={this.handleCreateLobby}
					returnToDashboard={this.returnToDashboard}
				/>
			);
		}

		// Render the game view 
		else if (this.state.joinedLobbyId !== null && this.state.showGameView) {
			return (
				<GameView
					canvasRef={this.canvasRef}
					playerId={this.state.playerId}
					joinedLobbyId={this.state.joinedLobbyId}
					userWon={this.state.userWon}
					userLost={this.state.userLost}
					handleLeaveGame={this.handleLeaveGame}
					updateDimensions={this.updateDimensions}
				/>
			)
		}

		// Render the lobby view
		else if (this.state.joinedLobbyId !== null) {
			return (
				<Lobby
					lobbies={this.state.lobbies}
					lobbyId={this.state.joinedLobbyId}
					playerId={this.state.playerId}
					handleStartGame={this.handleStartGame}
					handleDeleteLobby={this.handleDeleteLobby}
					handleLeaveLobby={this.handleLeaveLobby}
				/>
			);
		}
	}
}

export default LobbiesPage;
