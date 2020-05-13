import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import "../../css/Lobby.css";

// TODO: Improve styling, add more functionality to this page

// Display a detailed view about a specific lobby on the server
class Lobby extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
            lobbies: [],
            joinedLobbyId: null,
            isLobbyOwner: false,
            playerId: null,
        };
    }

    componentDidMount() {
        this.setState({ 
            lobbies: this.props.lobbies,
            joinedLobbyId: this.props.joinedLobbyId,
            isLobbyOwner: this.props.isLobbyOwner,
            playerId: this.props.playerId
        });
    }
    
    // Update this child component's state depending on parent state changes
    componentDidUpdate(prevProps) {
        console.log("Updated props");
        if (prevProps.lobbies !== this.props.lobbies) {
            console.log("Updated lobbies");
            console.log(this.props.lobbies);
            this.setState({ lobbies: this.props.lobbies });
        }
        if (prevProps.joinedLobbyId !== this.props.joinedLobbyId) {
            console.log("Updated joinedLobbyId");
            console.log(this.props.joinedLobbyId);
            this.setState({ joinedLobbyId: this.props.joinedLobbyId });
        }
        if (prevProps.isLobbyOwner !== this.props.isLobbyOwner) {
            console.log("Updated isLobbyOwner");
            console.log(this.props.isLobbyOwner);
            this.setState({ isLobbyOwner: this.props.isLobbyOwner });
        }
        if (prevProps.playerId !== this.props.playerId) {
            console.log("Updated lobbies");
            console.log(this.props.playerId);
            this.setState({ playerId: this.props.playerId });
        }

    }

	render() {
		return (
            <div className="lobby-page">
                <h1>You are in Lobby {this.state.joinedLobbyId}</h1>
                {(this.state.isLobbyOwner) ? 
                    <p>
                        You are lobby owner (only you can start the game)
                        Note that if you start a game by yourself, you will automatically win. The game will then end shortly, so you won't be able to control your player (as the canvas is disabled). You will need to start a game with at least two players in the lobby.
                        <Button
                            variant="success"
                            block
                            onClick={() => {this.props.handleStartGame(this.state.playerId, this.state.joinedLobbyId)}}
                        >
                            Start Game
                        </Button>
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleDeleteLobby(this.state.playerId, this.state.joinedLobbyId)}}
                        >
                            Delete Lobby
                        </Button>
                    </p>
                :
                    <p> Welcome. Please wait for lobby owner to start game. Your game will automatically load once the lobby owner starts the game
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleLeaveLobby(this.state.playerId, this.state.joinedLobbyId)}}
                        >
                            Leave Lobby
                        </Button>
                    </p>
                }
            </div>
        );
	}
}

export default Lobby;
