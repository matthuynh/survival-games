import React from "react";
import Button from "react-bootstrap/Button";
import "../../css/Lobby.css";

// Display a detailed view about a specific lobby on the server
class CloseLobby extends React.Component {
    constructor(props) {
        super(props);
		this.handleKeyPress = this.handleKeyPress.bind(this);
	}

	// Attaches event listener for key press
	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyPress, false);
	}

	// Removes event listener for key press
	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyPress, false);
    }

    // Handles key press for "Enter" and "Esc" button
	handleKeyPress(event) {
		if (event.keyCode === 13 || event.keyCode === 27) {
			this.props.handleCloseLobbyDialog()
		}
	};
    
	render() {
		return (
            <div className="lobby-page">
                <h1> Lobby Closed </h1>
                <h5> The lobby owner closed this lobby </h5>
				<p className="text">Press <kbd>Esc</kbd> or <kbd>Enter</kbd> to go back</p>
                <hr />
        
                <Button
                    variant="dark"
                    onClick={() => {this.props.handleCloseLobbyDialog()}}
                >
                    Go back
                </Button>
            </div>
        );
	}
}

export default CloseLobby;
