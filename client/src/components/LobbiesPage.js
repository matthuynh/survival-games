/**
 * This file renders other child components; it does not render anything by itself. As such, it is the "single source of truth" of state for these components
 * This file contains websocket connection code to connect the UI to a lobby on the websocket server. It sends and receives websocket "commands" from this lobby
 */
import React from "react";

import LobbyList from "./lobby_components/LobbyList";
import MultiplayerLobby from "./lobby_components/MultiplayerLobby";
import SingleplayerLobby from "./lobby_components/SingleplayerLobby";
import CloseLobby from "./lobby_components/CloseLobby";
import GameView from "./lobby_components/GameView";
import Auth from "../Routing/auth";

import UIFx from 'uifx';
import revolverSoundImport from "../assets/audio/revolver.mp3";
import burstSoundImport from "../assets/audio/3-burst.mp3";
import shotgunSoundImport from "../assets/audio/shotgun.mp3";
import emptyGunImport from "../assets/audio/empty-gun.wav";

const revolverSound = new UIFx(revolverSoundImport, {
	volume: 0.5
});

const burstSound = new UIFx(burstSoundImport, {
	volume: 0.5
});

const shotgunSound = new UIFx(shotgunSoundImport, {
	volume: 0.5
})

const emptyGunSound = new UIFx(emptyGunImport, {
	volume: 0.5
});

// TODO: Add env check for dev vs prod
// const wssServerURL = "ws://localhost:10000"; // UNCOMMENT THIS FOR LOCAL
const wssServerURL = window.location.origin.replace(/^http/, 'ws'); // UNCOMMENT THIS FOR PROD
// console.log(wssServerURL);

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
			joinedLobbyType: "",
			lobbies: [],
			lobbyClosed: false,

			volumeOn: true,

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
		this.handleCreateSingleplayerLobby = this.handleCreateSingleplayerLobby.bind(this);
		this.handleJoinLobby = this.handleJoinLobby.bind(this);
		this.handleLeaveLobbyMultiplayer = this.handleLeaveLobbyMultiplayer.bind(this);
		this.handleDeleteLobbyMultiplayer = this.handleDeleteLobbyMultiplayer.bind(this);
		this.handleStartGameMultiplayer = this.handleStartGameMultiplayer.bind(this);
		this.handleDeleteLobbySingleplayer = this.handleDeleteLobbySingleplayer.bind(this);
		this.handleStartGameSingleplayer = this.handleStartGameSingleplayer.bind(this);
		this.handleLeaveGame = this.handleLeaveGame.bind(this);
		this.handleCloseLobbyDialog = this.handleCloseLobbyDialog.bind(this);

		this.pauseSingleplayerStage = this.pauseSingleplayerStage.bind(this);
		this.unpauseSingleplayerStage = this.unpauseSingleplayerStage.bind(this);

		this.toggleVolume = this.toggleVolume.bind(this);

		// Keyboard/mouse listener functions
		this.handleKeyPress = this.handleKeyPress.bind(this);
		this.handleKeyRelease = this.handleKeyRelease.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.resetMovementInput = this.resetMovementInput.bind(this);
		this.handleScroll = this.handleScroll.bind(this);

		this.updateDimensions = this.updateDimensions.bind(this);
	}

	pauseSingleplayerStage(lobbyId, pid) {
		let clientUpdate = JSON.stringify({
			type: "pause-singleplayer-stage",
			lobbyId: lobbyId,
			pid: pid
		});
		this.clientSocket.send(clientUpdate);
	}

	unpauseSingleplayerStage(lobbyId, pid) {
		let clientUpdate = JSON.stringify({
			type: "unpause-singleplayer-stage",
			lobbyId: lobbyId,
			pid: pid
		});
		this.clientSocket.send(clientUpdate);
	}

	// Called whenever the user resizes their browser screen
	updateDimensions(width, height) {
		this.setState({ width: width, height: height });
	}

	// Return to lobby view after lobby owner closed lobby
	handleCloseLobbyDialog() {
		this.setState({
			lobbyClosed: false,
		})
	}

	// Return to dashboard, close sockets, and reset state
	returnToDashboard(reason) {
		window.stopStageGame();
		document.removeEventListener("keydown", this.handleKeyPress);
		document.removeEventListener("keyup", this.handleKeyRelease);
		document.removeEventListener("mousemove", this.handleMouseMove);
		document.removeEventListener("mousedown", this.handleMouseDown);
		document.removeEventListener("visibilitychange", this.resetMovementInput);
		document.removeEventListener("wheel", this.handleScroll);

		// This "reason" means that returnToDashboard was triggered by the socket closing, thus we don't need to call .close() on the socket
		if (reason !== "socket-server-closed") {
			this.clientSocket.close();
		}

		// TODO: Buggy logic. /dashboard gets pushed to history twice (eg. if user uses browser back button)
		if (reason === "socket-server-closed") {
			this.props.history.push("/dashboard", { response: "socket-server-closed" });
		} else if (reason === "socket-server-timeout") {
			this.props.history.push("/dashboard", { response: "socket-server-timeout" });
		} else {
			this.props.history.push("/dashboard");
		}
	}

	// Runs when the page unloads (eg. a game finishes)
	componentWillUnmount() {
		this._isMounted = false; // This variable is used to prevent unnecessary setstates on this unmounted component
		this.returnToDashboard();
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
				console.log("[CLIENT INFO] Front-end connected to the web server");
			};
	
			this.clientSocket.onclose = (event) => {
				console.log(event);
				if (event.reason === "Unable to identify client") {
					console.log("[CLIENT INFO] Web socket server unable to identify client. Front-end connection disconnected")
					this.returnToDashboard("socket-server-closed");
				} else if (event.code == "1006") {
					// TODO: This might be unreliable. Implement a better system for handling these CloseEvents
					console.log("[CLIENT INFO] Front-end disconnected from web socket server due to timeout");
					this.returnToDashboard("socket-server-timeout");
				} else {
					console.log("[CLIENT INFO] Front-end disconnected from web socket server");
					this.returnToDashboard("socket-server-closed");
				}
			};
	
			// When the client receives an update from the server, we update our state
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
							this.setState({ 
								showGameView: true,
							});
							// console.log("[CLIENT INFO] Starting client stage model");
	
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
								this.state.playerId,
								this.state.joinedLobbyType
							);
	
							// Start the client model interval (for re-drawing)
							window.startStageModel();
							document.addEventListener("keydown", this.handleKeyPress);
							document.addEventListener("keyup", this.handleKeyRelease);
							document.addEventListener("mousemove", this.handleMouseMove);
							document.addEventListener("mousedown", this.handleMouseDown);
							document.addEventListener("visibilitychange", this.resetMovementInput);
							document.addEventListener("wheel", this.handleScroll);
							break;
	
						// Receive list of updated lobbies state from socket server
						case "view-lobbies":
							// console.log("[CLIENT INFO] Updating lobby view");
							// console.log(serverUpdate.lobbies);
							this.setState({
								lobbies: serverUpdate.lobbies
							});
							break;
	
						// Successfully created a new multiplayer lobby, receive the lobby id
						case "new-lobby-multiplayer":
							// TODO: Will need to differentiate between showing multiplayer and singleplayer lobby
							this.setState({
								lobbies: serverUpdate.lobbies,
								joinedLobbyId: serverUpdate.newLobbyId,
								joinedLobbyType: "multiplayer",
								movingUp: false,
								movingLeft: false,
								movingDown: false,
								movingRight: false,
								horizontalDirection: 0,
								verticalDirection: 0,
							});
							break;
	
						case "new-lobby-singleplayer":
							// TODO: Will need to differentiate between showing multiplayer and singleplayer lobby
							this.setState({
								lobbies: serverUpdate.lobbies,
								joinedLobbyId: serverUpdate.newLobbyId,
								joinedLobbyType: "singleplayer",
							});
							break;
							
						// User joined a multiplayer lobby successfully
						case "joined-lobby":
							// console.log("joined-lobby");
							// console.log("Setting state of lobbies");
							// console.log("Reached");
							this.setState({
								lobbies: serverUpdate.lobbies,
								joinedLobbyId: serverUpdate.lobbyId,
								joinedLobbyType: "multiplayer",
							});
							// console.log(serverUpdate.lobbies);
							break;
	
						// User left their lobby successfully
						case "left-lobby":
							if (serverUpdate.status === "success") {
								this.setState({
									joinedLobbyId: null,
									joinedLobbyType: "",
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
							console.log("[CLIENT INFO] Trying to terminate stage");
							document.removeEventListener("keydown", this.handleKeyPress);
							document.removeEventListener("keyup", this.handleKeyRelease);
							document.removeEventListener("mousemove", this.handleMouseMove);
							document.removeEventListener("mousedown", this.handleMouseDown);
							document.removeEventListener("visibilitychange", this.resetMovementInput);
							document.removeEventListener("wheel", this.handleScroll);
							window.stopStageGame();
	
							// Forceful stage termination during a multiplayer game by lobby owner disconnected
							// Sends all other players back to lobby paeg
							if (serverUpdate.isForced) {
								console.log("[CLIENT INFO] Stage termination is forceful, sending all players back to lobby page");
								this.setState({
									showGameView: false,
									userWon: false,
									userLost: false,
									joinedLobbyId: null,
									joinedLobbyType: "",
									lobbyClosed: true,
								});
							} 
							// Stage terminated because user won game
							else if (serverUpdate.winningPID === this.state.playerId) {
								console.log("[CLIENT INFO] User won");
								this.setState({
									userWon: true,
								});
							} 
							// Stage terminated because user lost game by quitting the game
							else {
								console.log("[CLIENT INFO] User lost");
								this.setState({
									userLost: true,
								});
							}
	
							break;
	
						// The lobby owner (not this user) closed the lobby
						case "kicked-lobby":
							this.setState({
								lobbyClosed: true,
								joinedLobbyId: null,
								joinedLobbyType: ""
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
	
						case "ping":
							console.log("[CLIENT INFO] Received 'keep-alive' ping from server");
							break;

						default:
							console.log("[CLIENT INFO] Received unknown update from socket server");
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

	// A player can leave the multiplayer lobby they are in
	handleLeaveLobbyMultiplayer(playerId, lobbyNumber) {
		// console.log("Client tries to leave lobby with id " + lobbyNumber);

		let clientUpdate = JSON.stringify({
			pid: playerId,
			type: "leave-lobby-multiplayer",
			lobbyId: lobbyNumber,
		});
		this.clientSocket.send(clientUpdate);
	}

	// A player creates a multiplayer lobby on the server. That player automatically joins the lobby as well
	handleCreateLobby() {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "create-lobby-multiplayer",
		});
		this.clientSocket.send(clientUpdate);
	}

	// A player creates a singleplayer lobby on the server. That player automatically joins the lobby as well
	handleCreateSingleplayerLobby() {
		let clientUpdate = JSON.stringify({
			pid: this.state.playerId,
			type: "create-lobby-singleplayer"
		});
		this.clientSocket.send(clientUpdate);
	}

	// A lobby owner deletes the multiplayer lobby he is in 
	handleDeleteLobbyMultiplayer(playerId, lobbyId) {
		let clientUpdate = JSON.stringify({
			type: "delete-lobby-multiplayer",
			pid: playerId,
			lobbyId: lobbyId
		})
		this.clientSocket.send(clientUpdate);
	}

	// A lobby owner deletes the singleplayer lobby he is in 
	handleDeleteLobbySingleplayer(playerId, lobbyId) {
		let clientUpdate = JSON.stringify({
			type: "delete-lobby-singleplayer",
			pid: playerId,
			lobbyId: lobbyId
		})
		this.clientSocket.send(clientUpdate);
	}

	// A lobby owner attempts to starts a game on a lobby on the server
	handleStartGameMultiplayer(ownerId, lobbyId) {
		this.setState({
			userWon: false,
			userLost: false,
		})
		this.resetMovementInput();
		
		// Note that only the owner of a valid lobby may start a game
		let clientUpdate = JSON.stringify({
			pid: ownerId,
			type: "start-game-multiplayer",
			lobbyId: lobbyId
		});
		this.clientSocket.send(clientUpdate);
	}

	handleStartGameSingleplayer(ownerId, lobbyId, stageSize, numEasyBots, numMedBots, numHardBots) {
		// console.log("Inside handleStartGameSingleplayer()");
		this.setState({
			userWon: false,
			userLost: false,
		})
		this.resetMovementInput();
		const stageGenerationSettings = {
			stageSize,
			numEasyBots,
			numMedBots,
			numHardBots
		}

		// Only the owner of a valid singleplayer lobby may start a game
		let clientUpdate = JSON.stringify({
			pid: ownerId,
			type: "start-game-singleplayer",
			lobbyId: lobbyId,
			stageGenerationSettings
		});
		// console.log(clientUpdate);
		this.clientSocket.send(clientUpdate);
	}

	// User chooses to leave game via the game menu
	handleLeaveGame(playerId, lobbyId) {
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
		document.removeEventListener("visibilitychange", this.resetMovementInput);
		document.removeEventListener("wheel", this.handleScroll);

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
			if ("1234t".includes(key)) {
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

	// When user is pressing down on a movement key (eg. asdf) and then unfocuses (eg. clicks on different application or presses Esc), reset movement
	resetMovementInput() {
		this.setState({ 
			movingUp: false,
			movingLeft: false,
			movingDown: false,
			movingRight: false,
			horizontalDirection: 0,
			verticalDirection: 0, 
		});
		this.sendMovement(
			this.state.horizontalDirection,
			this.state.verticalDirection
		);
	}

	// User can scroll to switch weapons
	handleScroll(e) {
		// console.log(e.deltaY);
		if (e.deltaY < 0){ this.sendWeaponSwitch("scrolldown"); } 
		else { this.sendWeaponSwitch("scrollup"); }
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
				case 3:
					shotgunSound.play();
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

	toggleVolume() {
		this.setState(prevState => ({
			volumeOn: !prevState.volumeOn
		}), () => {
			if (this.state.volumeOn) {
				revolverSound.setVolume(0.5);
				burstSound.setVolume(0.5);
				shotgunSound.setVolume(0.5);
				emptyGunSound.setVolume(0.5);
			} else {
				revolverSound.setVolume(0);
				burstSound.setVolume(0);
				shotgunSound.setVolume(0);
				emptyGunSound.setVolume(0);
			}
		});
	}

	render() {
		// TODO: Refactor logic for determining view (put it into a function)
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
					createSingleplayerLobby={this.handleCreateSingleplayerLobby}
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
					joinedLobbyType={this.state.joinedLobbyType}
					userWon={this.state.userWon}
					userLost={this.state.userLost}
					volumeOn={this.state.volumeOn}
					handleLeaveGame={this.handleLeaveGame}
					updateDimensions={this.updateDimensions}
					handleGameKeyPress={this.handleKeyPress}
					handleGameKeyRelease={this.handleKeyRelease}
					handleGameMouseMove={this.handleMouseMove}
					handleGameMouseDown={this.handleMouseDown}
					resetMovementInput={this.resetMovementInput}
					pauseSingleplayerStage={this.pauseSingleplayerStage}
					unpauseSingleplayerStage={this.unpauseSingleplayerStage}
					toggleVolume={this.toggleVolume}
				/>
			)
		}

		// Render the multiplayer lobby view
		else if (this.state.joinedLobbyId !== null && this.state.joinedLobbyType === "multiplayer") {
			return (
				<MultiplayerLobby
					lobbies={this.state.lobbies}
					lobbyId={this.state.joinedLobbyId}
					playerId={this.state.playerId}
					handleStartGameMultiplayer={this.handleStartGameMultiplayer}
					handleDeleteLobbyMultiplayer={this.handleDeleteLobbyMultiplayer}
					handleLeaveLobbyMultiplayer={this.handleLeaveLobbyMultiplayer}
				/>
			);
		}

		// Render the singleplayer lobby view
		else if (this.state.joinedLobbyId !== null && this.state.joinedLobbyType === "singleplayer") {
			return (
				<SingleplayerLobby
					lobbies={this.state.lobbies}
					lobbyId={this.state.joinedLobbyId}
					playerId={this.state.playerId}
					handleStartGameSingleplayer={this.handleStartGameSingleplayer}
					handleDeleteLobbySingleplayer={this.handleDeleteLobbySingleplayer}
				/>
			);
		}
	}
}

export default LobbiesPage;
