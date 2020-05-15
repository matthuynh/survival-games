import React from "react";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import "../../css/Lobby.css";

// TODO: Improve styling, add more functionality to this page

// Display a detailed view about a specific lobby on the server
class Lobby extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
            lobbies: null,
            lobbyPlayers: [],
            lobbyId: null,
            isLobbyOwner: false,
            playerId: null,
            lobbyOwnerId: null
        };

        this.determineLobbyPlayers = this.determineLobbyPlayers.bind(this);
    }

    // Calculate the lobby players and lobby owner for this lobby
    determineLobbyPlayers() {
        if (this.state.lobbies) {
            for (let i = 0; i < this.state.lobbies.length; i++) {
                if (this.state.lobbies[i].id == this.state.lobbyId) {
                    console.log("Updating lobby players");
                    this.setState({ 
                        lobbyPlayers: this.state.lobbies[i].lobbyPlayers,
                        lobbyOwnerId: this.state.lobbies[i].lobbyOwner
                    });
                    // this.setState({ 
                    //     lobbyPlayers: this.state.lobbies[i].lobbyPlayers,
                    //     lobbyOwnerId: this.state.lobbies[i].lobbyOwner
                    // }, console.log(this.state.lobbies[i].lobbyPlayers));
                    break;
                }
            }
        }
    }

    componentDidMount() {
        this.setState({ 
            lobbies: this.props.lobbies,
            lobbyId: this.props.lobbyId,
            playerId: this.props.playerId
        }, this.determineLobbyPlayers());
    }
    
    // Update this child component's state depending on parent state changes
    componentDidUpdate(prevProps) {
        if (prevProps.lobbies !== this.props.lobbies) {
            console.log("Updated lobbies");
            // Note: setState is async, so we assign it a callback determineLobbyPlayers()
            // Q: This call to determineLobbyPlayers() only works properly if it is put in an arrow function... why?
            // It doesn't work if it is not placed in a function
            this.setState({ lobbies: this.props.lobbies }, ()=>{
                // console.log(this.state.lobbies);
                this.determineLobbyPlayers();
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

	render() {
		return (
            <div className="lobby-page">
                <h1>You are in Lobby {this.state.lobbyId}</h1>
                {/* Display all players in lobby */}
                <Table bordered size="sm">
					<thead>
						<tr>
							<th> Players </th>
							<th> Lobby Owner </th>
						</tr>
					</thead>
					<tbody>
                        {this.state.lobbyPlayers.map((lobbyPlayer, index) => {
                            return this.state.playerId == lobbyPlayer ? 
                            (
                                <tr key={index} style={{color: "blue"}}>
                                    <td>{lobbyPlayer}</td>
                                    <td>
                                        {this.state.lobbyOwnerId == lobbyPlayer ? (<p> Yes </p>) : (<p> No</p>)}
                                    </td>
                                </tr>
                            )
                            :
                                <tr key={index}>
                                    <td>{lobbyPlayer}</td>
                                    <td>
                                        {this.state.lobbyOwnerId == lobbyPlayer ? (<p> Yes </p>) : (<p> No</p>)}
                                    </td>
                                </tr>
                        })}
					</tbody>
				</Table>

                {(this.state.lobbyOwnerId == this.state.playerId) ? 
                    // Lobby view for the lobby owner
                    <p>
                        You are lobby owner (only you can start the game)
                        Note that if you start a game by yourself, you will automatically win. The game will then end shortly, so you won't be able to control your player (as the canvas is disabled). You will need to start a game with at least two players in the lobby.
                        <Button
                            variant="success"
                            block
                            onClick={() => {this.props.handleStartGame(this.state.playerId, this.state.lobbyId)}}
                        >
                            Start Game
                        </Button>
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleDeleteLobby(this.state.playerId, this.state.lobbyId)}}
                        >
                            Delete Lobby
                        </Button>
                    </p>
                :
                    // Lobby view for all other lobby members
                    <p> Welcome. Please wait for lobby owner to start game. Your game will automatically load once the lobby owner starts the game
                        <Button
                            variant="danger"
                            block
                            onClick={() => {this.props.handleLeaveLobby(this.state.playerId, this.state.lobbyId)}}
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
