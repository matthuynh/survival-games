import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Modal from "react-bootstrap/Modal";
import Image from "react-bootstrap/Image";
import ListGroup from "react-bootstrap/ListGroup";
import HelpImg from "../../assets/question-mark.png";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { AiOutlineDoubleLeft, AiOutlineDoubleRight } from "react-icons/ai";

import "../../css/Lobby.css";

// Mappings for map sizes for radio buttons
const stageSizes = [
    { size: "Small" },
    { size: "Normal" },
    { size: "Large" },
];

// Display a detailed view about a specific lobby on the server
class SingleplayerLobby extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			lobbies: null,
			lobbyPlayers: [],
			lobbyId: null,
			isLobbyOwner: false,
			playerId: null,
			lobbyOwnerId: null,
			maxLobbySize: null,

			showMenuScreen: false,
			stageSize: "Normal",
			numEasyBots: 4,
			numMedBots: 1,
			numHardBots: 1,
			maxEasyBots: 10,
			maxMedBots: 10,
			maxHardBots: 10,

			// TODO: Implement this version of max bots (a pooled number of max bots)
			maxBots: 20,
		};

		this.determineLobbyInfo = this.determineLobbyInfo.bind(this);
		this.renderHelpPopover = this.renderHelpPopover.bind(this);
		this.closeMenuScreen = this.closeMenuScreen.bind(this);
		this.setStageSize = this.setStageSize.bind(this);
		this.isInvalidGenerationSettings = this.isInvalidGenerationSettings.bind(this);

		this.setNumEasyBots = this.setNumEasyBots.bind(this);
		this.decreaseNumEasyBots = this.decreaseNumEasyBots.bind(this);
		this.increaseNumEasyBots = this.increaseNumEasyBots.bind(this);
		this.setMinEasyBots = this.setMinEasyBots.bind(this);
		this.setMaxEasyBots = this.setMaxEasyBots.bind(this);

		this.setNumMedBots = this.setNumMedBots.bind(this);
		this.decreaseNumMedBots = this.decreaseNumMedBots.bind(this);
		this.increaseNumMedBots = this.increaseNumMedBots.bind(this);
		this.setMinMedBots = this.setMinMedBots.bind(this);
		this.setMaxMedBots = this.setMaxMedBots.bind(this);

		this.setNumHardBots = this.setNumHardBots.bind(this);
		this.decreaseNumHardBots = this.decreaseNumHardBots.bind(this);
		this.increaseNumHardBots = this.increaseNumHardBots.bind(this);
		this.setMinHardBots = this.setMinHardBots.bind(this);
		this.setMaxHardBots = this.setMaxHardBots.bind(this);
	}

	// Calculate lobby information for this lobby
	determineLobbyInfo() {
		// console.log(this.state.lobbiess);
		if (this.state.lobbies) {
			for (let i = 0; i < this.state.lobbies.length; i++) {
				if (this.state.lobbies[i].id === this.state.lobbyId) {
					let thisLobby = this.state.lobbies[i];

					// console.log("Updating lobby players");
					this.setState({
						lobbyPlayers: thisLobby.lobbyPlayers,
						lobbyOwnerId: thisLobby.lobbyOwner,
						maxLobbySize: thisLobby.maxLobbySize
					});
					break;
				}
			}
		}
	}

	// Displays when user hovers over help button
	renderHelpPopover() {
		return(
			<Popover id="popover-basic">
                <Popover.Title as="h3" style={{ textAlign: "center" }}>Singleplayer Lobby Help</Popover.Title>
                <Popover.Content>
					<ListGroup variant="flush">
						<ListGroup.Item>You can specify world generation settings for the game!</ListGroup.Item>
                        <ListGroup.Item>You must play with at least one bot</ListGroup.Item>
						<ListGroup.Item>You can customize the number of bots</ListGroup.Item>
						<ListGroup.Item>Once in the game, press ESC to pause and open the game menu</ListGroup.Item>
					</ListGroup>
                </Popover.Content>
			</Popover>
		);
	};

	componentDidMount() {
		// console.log(this.props);
		this.setState(
			{
				lobbies: this.props.lobbies,
				lobbyId: this.props.lobbyId,
				playerId: this.props.playerId,
			},
			() => {
				this.determineLobbyInfo();
			}
		);
	}

	// Update this child component's state depending on parent state changes
	componentDidUpdate(prevProps) {
		if (prevProps.lobbies !== this.props.lobbies) {
			// console.log("Updated lobbies");
			// Note: setState is async, so we assign it a callback determineLobbyInfo()
			// It doesn't work if it is not placed in a function
			this.setState({ lobbies: this.props.lobbies }, () => {
				// console.log(this.state.lobbies);
				this.determineLobbyInfo();
			});
		}
		if (prevProps.lobbyId !== this.props.lobbyId) {
			// console.log("Updated lobbyId");
			// console.log(this.props.lobbyId);
			this.setState({ lobbyId: this.props.lobbyId });
		}
		if (prevProps.isLobbyOwner !== this.props.isLobbyOwner) {
			// console.log("Updated isLobbyOwner");
			// console.log(this.props.isLobbyOwner);
			this.setState({ isLobbyOwner: this.props.isLobbyOwner });
		}
		if (prevProps.playerId !== this.props.playerId) {
			// console.log("Updated lobbies");
			// console.log(this.props.playerId);
			this.setState({ playerId: this.props.playerId });
		}
	}

	// Close the settings modal
	closeMenuScreen() {
		this.setState({ showMenuScreen: false });
	}

	// Set generation settings for the given stage size
	setStageSize(size) {
		console.log("Setting stage size to " + size);
		if (size === "Small") {
			this.setState({
				numEasyBots: 3,
				numMedBots: 2,
				numHardBots: 1,
				maxEasyBots: 5,
				maxMedBots: 5,
				maxHardBots: 5
			})
		} else if (size === "Normal") {
			this.setState({
				numEasyBots: 5,
				numMedBots: 3,
				numHardBots: 2,
				maxEasyBots: 10,
				maxMedBots: 10,
				maxHardBots: 10
			})
		} else {
			this.setState({
				numEasyBots: 10,
				numMedBots: 4,
				numHardBots: 4,
				maxEasyBots: 20,
				maxMedBots: 20,
				maxHardBots: 20
			})
		}
		this.setState({ stageSize: size });
	}


	setNumEasyBots(event) {
		let scrubbedValue = event.target.value >= 0 && event.target.value <= this.state.maxEasyBots ? event.target.value : this.state.numEasyBots;
		this.setState({ numEasyBots: Number(scrubbedValue) });
	}

	decreaseNumEasyBots() {
		this.setState({ numEasyBots: (this.state.numEasyBots - 1) < 0 ? 0 : (this.state.numEasyBots - 1) });
	}

	increaseNumEasyBots() {
		this.setState({ numEasyBots: (this.state.numEasyBots + 1) > this.state.maxEasyBots ? this.state.maxEasyBots : (this.state.numEasyBots + 1) });
	}

	setMinEasyBots() {
		this.setState({ numEasyBots: 0 });
	}

	setMaxEasyBots() {
		this.setState({ numEasyBots: this.state.maxEasyBots });
	}


	setNumMedBots(event) {
		let scrubbedValue = event.target.value >= 0 && event.target.value <= this.state.maxMedBots ? event.target.value : this.state.numMedBots;
		this.setState({ numMedBots: Number(scrubbedValue) });
	}

	decreaseNumMedBots() {
		this.setState({ numMedBots: (this.state.numMedBots - 1) < 0 ? 0 : (this.state.numMedBots - 1) });
	}

	increaseNumMedBots() {
		this.setState({ numMedBots: (this.state.numMedBots + 1) > this.state.maxMedBots ? this.state.maxMedBots : (this.state.numMedBots + 1) });
	}

	setMinMedBots() {
		this.setState({ numMedBots: 0 });
	}

	setMaxMedBots() {
		this.setState({ numMedBots: this.state.maxMedBots });
	}


	setNumHardBots(event) {
		let scrubbedValue = event.target.value >= 0 && event.target.value <= this.state.maxHardBots ? event.target.value : this.state.numHardBots;
		this.setState({ numHardBots: Number(scrubbedValue) });
	}

	decreaseNumHardBots() {
		this.setState({ numHardBots: (this.state.numHardBots - 1) < 0 ? 0 : (this.state.numHardBots - 1) });
	}

	increaseNumHardBots() {
		this.setState({ numHardBots: (this.state.numHardBots + 1) > this.state.maxHardBots ? this.state.maxHardBots : (this.state.numHardBots + 1) });
	}

	setMinHardBots() {
		this.setState({ numHardBots: 0 });
	}

	setMaxHardBots() {
		this.setState({ numHardBots: this.state.maxHardBots });
	}


	// Check if the user has invalid generation settings
	isInvalidGenerationSettings() {
		return this.state.numEasyBots === 0 && this.state.numMedBots === 0 && this.state.numHardBots === 0;
	}

	render() {
		return (
			<div className="lobby-page">
				{/* Display the Lobby Number and Lobby Size */}
				<Row className="align-items-center">
                    <Col>
						<h1>Lobby {this.state.lobbyId}</h1>
						<h5>
							Number of Bots: {this.state.numEasyBots + this.state.numMedBots + this.state.numHardBots}
						</h5>
						<h5>
							Map Size: {this.state.stageSize}
						</h5>
                    </Col>
                </Row>
				<hr />

				{/* Display all players in lobby */}
				<Container fluid={true}>
					<Row>
						<Table bordered size="sm">
							<thead>
								<tr>
									<th> Players </th>
									<th> Lobby Owner </th>
									<th> Status </th>
								</tr>
							</thead>
							<tbody>
								{this.state.lobbyPlayers.map((lobbyPlayer, index) => {
									return (
										<tr
											key={index}
											style={
												this.state.playerId === lobbyPlayer.pid
													? { color: "blue" }
													: {}
											}
										>
											<td>{lobbyPlayer.pid}</td>
											<td>
												{this.state.lobbyOwnerId ===
												lobbyPlayer.pid ? (
													<p> Yes </p>
												) : (
													<p> No</p>
												)}
											</td>
											<td>{lobbyPlayer.status}</td>
										</tr>
									);
								})}
							</tbody>
						</Table>
					</Row>

                    <Container>
                        <Row className="multiplayer-lobby-text">
                            Welcome to WarCry Singleplayer! Customize your game by changing the map size and number of bots
                        </Row>
                        <Row>
                            <Col>
                                <Button
                                    variant="primary"
									className="multiplayer-lobby-button"
									disabled={this.isInvalidGenerationSettings()}
                                    onClick={() => {
                                        this.props.handleStartGameSingleplayer(
                                            this.state.playerId,
											this.state.lobbyId,
											this.state.stageSize,
											this.state.numEasyBots,
											this.state.numMedBots,
											this.state.numHardBots
                                        );
                                    }}
                                >
                                    Start Game
                                </Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Button
                                    variant="dark"
                                    className="multiplayer-lobby-button"
                                    onClick={() => {
										this.setState({
											showMenuScreen: true
										})
                                    }}
                                >
                                    Game Settings
                                </Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Button
                                    variant="dark"
                                    className="multiplayer-lobby-button delete-lobby-button"
                                    onClick={() => {
                                        this.props.handleDeleteLobbySingleplayer(
                                            this.state.playerId,
                                            this.state.lobbyId
                                        );
                                    }}
                                >
                                    Delete Lobby
                                </Button>
                            </Col>
                        </Row>
                    </Container>
				</Container>

				<Row className="lobby-list-footer align-items-center">
                    <Col xs={{ span: 3, offset: 10 }}>
                        <OverlayTrigger trigger="click" placement="top" overlay={this.renderHelpPopover()}>
                            <span id="lobby-help-icon">
                                <Image src={HelpImg} alt={"Help-Button-Image"} style={{maxHeight: "25px", maxWidth: "25px"}} />
                            </span>
                        </OverlayTrigger>
                    </Col>
                </Row>


				<Modal
					show={this.state.showMenuScreen}
					onHide={this.closeMenuScreen}
					centered
				>
					<Modal.Body>
						<Container>
							<Row>
								<Col>
									<ListGroup variant="flush">
										<ListGroup.Item>
											<Row>
												<Col>
													<h5>Map Size</h5>
												</Col>
											</Row>
											<Row>
												<Col>
													<ButtonGroup toggle>
														{stageSizes.map((stage, idx) => (
															<ToggleButton
																key={idx}
																type="radio"
																variant={this.state.stageSize === stage.size ? "dark" : "secondary"}
																name="radio"
																value={stage.size}
																checked={this.state.stageSize === stage.size}
																onChange={() => this.setStageSize(stage.size)}
															>
																{stage.size}
															</ToggleButton>
														))}
													</ButtonGroup>
												</Col>
											</Row>
										</ListGroup.Item>

										<ListGroup.Item>
											<Row>
												<Col>
													<h5>Easy Bots</h5>
												</Col>
											</Row>
											<Row>
												<Col md={{ span: 1, offset: 0 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numEasyBots === 0}
														onClick={() => {
															this.setMinEasyBots();
														}}
													>
														<AiOutlineDoubleLeft />
													</Button>
												</Col>
												<Col md={{ span: 6, offset: 2 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numEasyBots === 0}
														onClick={() => {
															this.decreaseNumEasyBots();
														}}
													>
														<IoIosArrowBack />
													</Button>
													<input
														type="text"
														className="bots-input-field"
														value={this.state.numEasyBots}
														onChange={this.setNumEasyBots}
														required
													/>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numEasyBots === this.state.maxEasyBots}
														onClick={() => {
															this.increaseNumEasyBots();
														}}
													>
														<IoIosArrowForward />
													</Button>
												</Col>
												<Col md={{ span: 1, offset: 1 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numEasyBots === this.state.maxEasyBots}
														onClick={() => {
															this.setMaxEasyBots();
														}}
													>
														<AiOutlineDoubleRight />
													</Button>
												</Col>
											</Row>
										</ListGroup.Item>

										<ListGroup.Item>
										<Row>
												<Col>
													<h5>Standard Bots</h5>
												</Col>
											</Row>
											<Row>
												<Col md={{ span: 1, offset: 0 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numMedBots === 0}
														onClick={() => {
															this.setMinMedBots();
														}}
													>
														<AiOutlineDoubleLeft />
													</Button>
												</Col>
												<Col md={{ span: 6, offset: 2 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numMedBots === 0}
														onClick={() => {
															this.decreaseNumMedBots();
														}}
													>
														<IoIosArrowBack />
													</Button>
													<input
														type="text"
														className="bots-input-field"
														value={this.state.numMedBots}
														onChange={this.setNumMedBots}
														required
													/>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numMedBots === this.state.maxMedBots}
														onClick={() => {
															this.increaseNumMedBots();
														}}
													>
														<IoIosArrowForward />
													</Button>
												</Col>
												<Col md={{ span: 1, offset: 1 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numMedBots === this.state.maxMedBots}
														onClick={() => {
															this.setMaxMedBots();
														}}
													>
														<AiOutlineDoubleRight />
													</Button>
												</Col>
											</Row>
										</ListGroup.Item>
										<ListGroup.Item>
											<Row>
												<Col>
													<h5>Unfair Bots</h5>
												</Col>
											</Row>
											<Row>
												<Col md={{ span: 1, offset: 0 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numHardBots === 0}
														onClick={() => {
															this.setMinHardBots();
														}}
													>
														<AiOutlineDoubleLeft />
													</Button>
												</Col>
												<Col md={{ span: 6, offset: 2 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numHardBots === 0}
														onClick={() => {
															this.decreaseNumHardBots();
														}}
													>
														<IoIosArrowBack />
													</Button>
													<input
														type="text"
														className="bots-input-field"
														value={this.state.numHardBots}
														onChange={this.setNumHardBots}
														required
													/>
													
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numHardBots === this.state.maxHardBots}
														onClick={() => {
															this.increaseNumHardBots();
														}}
													>
														<IoIosArrowForward />
													</Button>
												</Col>
												<Col md={{ span: 1, offset: 1 }}>
													<Button
														variant="dark"
														className="bots-button"
														disabled={this.state.numHardBots === this.state.maxHardBots}
														onClick={() => {
															this.setMaxHardBots();
														}}
													>
														<AiOutlineDoubleRight />
													</Button>
												</Col>
											</Row>
										</ListGroup.Item>
									</ListGroup>
								</Col>
							</Row>
						</Container>
					</Modal.Body>
					
					<Modal.Footer>
						<Container>
							<Row>
								<Col>
									{this.isInvalidGenerationSettings() && <h6>You must have at least 1 bot to play</h6>}
								</Col>
							</Row>
							<Row>
								<Col>
									<Button
										variant="primary"
										onClick={() => {
											this.setState({
												showMenuScreen: false
											})
										}}
									>
										Close
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

export default SingleplayerLobby;
