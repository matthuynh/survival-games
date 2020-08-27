import React from "react";
import Button from "react-bootstrap/Button";
import ToggleButton from "react-bootstrap/ToggleButton";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Image from "react-bootstrap/Image";
import { GrVolumeMute, GrVolume } from 'react-icons/gr';
import "../../css/GameView.css";

// Display a detailed view about a specific lobby on the server
class GameView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			playerId: null,
			joinedLobbyId: null,
			userWon: false,
			userLost: false,
			// TODO: Add a state variable for "ongoing game"
			innerWidth: 0,
			innerHeight: 0,
			volumeOn: props.volumeOn,

			showMenuScreen: false,
		};

		this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
		this.openMenuScreen = this.openMenuScreen.bind(this);
		this.closeMenuScreen = this.closeMenuScreen.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);
	}

	componentDidMount() {
		this.setState({
			playerId: this.props.playerId,
			joinedLobbyId: this.props.joinedLobbyId,
			userWon: this.props.userWon,
			userLost: this.props.userLost,
		});

		this.updateWindowDimensions();
		window.addEventListener("resize", this.updateWindowDimensions);
		document.addEventListener("keydown", this.handleKeyPress, false);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.updateWindowDimensions);
		// document.removeEventListener("keydown", this.handleKeyPress, false);
	}

	// Update lobbies passed down from parent LobbiesPage
	componentDidUpdate(prevProps) {
		if (prevProps.playerId !== this.props.playerId) {
			this.setState({ playerId: this.props.playerId });
		}
		if (prevProps.joinedLobbyId !== this.props.joinedLobbyId) {
			this.setState({ joinedLobbyId: this.props.joinedLobbyId });
		}
		if (prevProps.userWon !== this.props.userWon) {
			this.setState({ userWon: this.props.userWon, showMenuScreen: true });
		}
		if (prevProps.userLost !== this.props.userLost) {
			this.setState({ userLost: this.props.userLost, showMenuScreen: true });
		}
		if (prevProps.volumeOn !== this.props.volumeOn) {
			this.setState({ volumeOn: this.props.volumeOn });
		}
	}

	// Runs when the user resizes their browser screen
	updateWindowDimensions() {
		this.setState({
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
		});
		this.props.updateDimensions(window.innerWidth, window.innerHeight);
		// console.log(`Width: ${window.innerWidth}, Height: ${window.innerHeight}`);
	}

	openMenuScreen() {
		this.setState({ showMenuScreen: true });
		this.props.resetMovementInput();
		// console.log("Modal opening");
		// Disable user game UI controls
		document.removeEventListener("keydown", this.props.handleGameKeyPress);
		document.removeEventListener("keyup", this.props.handleGameKeyRelease);
		document.removeEventListener("mousemove", this.props.handleGameMouseMove);
		document.removeEventListener("mousedown", this.props.handleGameMouseDown);

		// If singleplayer game, send command to pause game
		if (this.props.joinedLobbyType === "singleplayer") {
			// console.log("front-end triggering pause");
			this.props.pauseSingleplayerStage(this.state.joinedLobbyId, this.state.playerId);
			window.pauseStageGame();
		}
	}

	closeMenuScreen() {
		this.setState({ showMenuScreen: false });
		this.props.resetMovementInput();
		// console.log("Modal closing");
		// Re-anble user game UI controls, but ONLY if the game is still ongoing
		if (!this.state.userWon && !this.state.userLost) {
			document.addEventListener("keydown", this.props.handleGameKeyPress);
			document.addEventListener("keyup", this.props.handleGameKeyRelease);
			document.addEventListener("mousemove", this.props.handleGameMouseMove);
			document.addEventListener("mousedown", this.props.handleGameMouseDown);
		}

		// If singleplayer game, send command to pause game
		if (this.state.userWon === false && this.state.userLost === false && this.props.joinedLobbyType === "singleplayer") {
			// console.log("front-end triggering unpause");
			this.props.unpauseSingleplayerStage(this.state.joinedLobbyId, this.state.playerId);
			window.unpauseStageGame();
		}
	}

	handleKeyPress(e) {
		if (e.keyCode === 27) {
			// The modal captures the "Esc" event already
			if (this.state.showMenuScreen === false) {
				this.openMenuScreen();
			}
		}
	}

	// TODO: Consider disabling the ability to close the modal once the game ends
	// Alternative for canvas: set width and height to logical stage dimension, then use css to set width and height for player's browser size
	render() {
		return (
			<div className="clientGameUI">
				<canvas
					ref={this.props.canvasRef}
					id="stage"
					width={this.state.innerWidth}
					height={this.state.innerHeight}
					className="clientCanvas"
				></canvas>

				<Modal
					show={this.state.showMenuScreen}
					onHide={this.closeMenuScreen}
					centered
				>
					<Modal.Header>
						<Container>
							<Row>
								<span id="lobby-help-icon">
									<Button
										onClick={() => this.props.toggleVolume()}
										variant="link"
									>
										{ this.state.volumeOn == true ? <GrVolume /> : <GrVolumeMute /> }
									</Button>
								</span>
								<Col>
									{!this.state.userWon && !this.state.userLost && this.props.joinedLobbyType === "singleplayer" && <h3> Singleplayer Game Paused </h3>}
									{!this.state.userWon && !this.state.userLost && this.props.joinedLobbyType === "multiplayer" && <h3> Multiplayer game in progress! </h3>}
									{this.state.userWon && <h3> You won! </h3>}
									{this.state.userLost && <h3> You lost! </h3>}
								</Col>
							</Row>
						</Container>
					</Modal.Header>
					<Modal.Body>
						<Container>
							<Row>
								<Col>
									<ListGroup variant="flush">
										<ListGroup.Item><kbd>WASD</kbd> to move around</ListGroup.Item>
										<ListGroup.Item>Walk into a bush to hide from enemies... but make sure they don't get too close</ListGroup.Item>
										<ListGroup.Item>Walk over a weapon or power-up to pick it up</ListGroup.Item>
										<ListGroup.Item>Use the scroll wheel or <kbd>1234</kbd> or <kbd>t</kbd> to switch weapons</ListGroup.Item>
										<ListGroup.Item><kbd>Esc</kbd> to open and close game menu</ListGroup.Item>
										<ListGroup.Item><kbd>H</kbd> to toggle GUI display</ListGroup.Item>
									</ListGroup>
								</Col>
							</Row>
						</Container>
					</Modal.Body>
					<Modal.Footer>
						<Container>
							<Row>
								<Col xs={8}>
									<Button
										variant="primary"
										block
										onClick={this.closeMenuScreen}
									>
										Back to game
									</Button>
								</Col>
								<Col xs={4}>
									<Button
										variant="dark"
										block
										onClick={() => {
											this.props.handleLeaveGame(
												this.state.playerId,
												this.state.joinedLobbyId
											);
										}}
									>
										Leave game
									</Button>
								</Col>
							</Row>
						</Container>
					</Modal.Footer>
				</Modal>
			</div>
		);
	}
}

export default GameView;
