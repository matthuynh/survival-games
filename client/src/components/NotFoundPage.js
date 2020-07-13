import React from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import Logo from "../assets/warcry-logo-small.png";
import '../css/PageNotFound.css';

class NotFoundPage extends React.Component {
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
			this.props.history.push("/dashboard");
		}
	};
    
    render() {
        return (
            <div className="page-not-found-container">
                <h3 className="title">404 Page Not Found </h3>
                <h6 className="text">Oops! That page doesn't exist.</h6>

                <p className="text">Press <kbd>Esc</kbd> or <kbd>Enter</kbd> to go home</p>
                <hr />

                <Link to="/dashboard" style={{ textDecoration: "none" }}>
                    <Button variant="primary" block >Home</Button>
                </Link>

                {/* <hr />
				<Link to="/dashboard" style={{ textDecoration: "none" }} >
                	<img src={Logo} alt={"WarCry-Logo"} />
				</Link> */}
            </div>
        );
    }
}

export default NotFoundPage;