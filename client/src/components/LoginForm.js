import React from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Tooltip from "react-bootstrap/Tooltip"
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import Auth from "../Routing/auth";
import Logo from "../assets/login.png";
import Popover from "react-bootstrap/Popover";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import HelpImg from "../assets/question-mark.png";
import Row from "react-bootstrap/row";
import Col from "react-bootstrap/col";
import "../css/LoginForm.css";

class LoginForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: "",
			password: "",
			alertMessage: "",
            alert: "",
            error: ""
		};
		this.handleLogInUser = this.handleLogInUser.bind(this);
		this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleGuestLogIn = this.handleGuestLogIn.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);
        this.renderAlert = this.renderAlert.bind(this);

        // Checks to see if user was redirected from the Registration page to Login page
        if (props.location && props.location.state && props.location.state.response === "successful-registration") {
            this.state.alertMessage = `Successfully registered ${props.location.state.username}`;
            this.state.alert = "success";
            props.history.replace({ state: "" });
        } else if (props.location && props.location.state && props.location.state.response === "successful-deletion") {
            this.state.alertMessage = "Successfully deleted account";
            this.state.alert = "success";
            props.history.replace({ state: "" });
        }
    }
    
    // Attaches event listener for key press
    componentDidMount() {
        document.addEventListener("keydown", this.handleKeyPress, false);
    }

    // Removes event listener for key press
    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyPress, false);
    }

    // Handles key press for "Esc" button
    handleKeyPress = (event) => {
        if (event.keyCode === 27) {
            this.props.history.push("/");
        }
    }

	handleUsername(event) {
		this.setState({ username: event.target.value });
	}

	handlePassword(event) {
		this.setState({ password: event.target.value });
    }
    
    // Renders a Tooltip with the given text
    renderTooltip(text) {
        return (
            <Tooltip id="button-tooltip">
                {text}
            </Tooltip>
        );
    }
    
    // Render any Alerts
    renderAlert() {
        if (this.state.alert) {
			return (
				<Alert variant={this.state.alert}>
					{this.state.alertMessage}
				</Alert>
			);
		} 
        return null;
    }

    // Displays when user hovers over help button
	renderHelpPopover() {
		return(
			<Popover id="popover-basic">
                <Popover.Title as="h3" style={{ textAlign: "center" }}>What's WarCry?</Popover.Title>
                <Popover.Content>
                    <ListGroup variant="flush">
						<ListGroup.Item>WarCry is a top-down battle royale shooter</ListGroup.Item>
                        <ListGroup.Item>WarCry is completely free-to-play, and has both multiplayer and singleplayer modes!</ListGroup.Item>
                        <ListGroup.Item>You can play with or without an account. Registered users can customize settings</ListGroup.Item>
						<ListGroup.Item>Created by Matthew and Rahul</ListGroup.Item>
					</ListGroup>
                </Popover.Content>
			</Popover>
		);
	};

	// Handles login API call
	async handleLogInUser(e) {
        e.preventDefault();
        this.setState({ alert: "", error: "" }); // Clear alerts

        // Front-end validation for username and password field
        if (this.state.username.length < 6 || this.state.username.length > 50 || this.state.password.length < 6 || this.state.password.length > 50) {
            this.setState({
                alertMessage: "Your username and password must be between 6 and 50 characters long",
                alert: "warning"
            });
        } else {
            try {
                let postData = {
                    username: this.state.username,
                    password: this.state.password,
                };
                let response = await axios.post("/ftd/api/login", postData);

                // Successful login; redirect to dashboard
                if (response) {
                    Auth.login(response.data.jwt, () => {
                        this.props.history.push("/dashboard");
                    });
                } else {
                    this.setState({
                        alertMessage: "Oops! Internal server error. Please try again. If this problem persists, contact the developers",
                        alert: "danger"
                    });
                }
            } 
            // Unsuccessful login
            catch (err) {
                if (err.response && err.response.status === 400) {
                    this.setState({
                        alertMessage: "Your password and username must be between 6 to 50 (inclusive) characters long",
                        alert: "warning"
                    });
                } else if (err.response && err.response.status === 401) {
                    this.setState({
                        alertMessage: "Either that username does not exist, or your password is incorrect (we won't specify which one for security!)",
                        alert: "danger"
                    });
                } else {
                    this.setState({
                        alertMessage: "Oops! Internal server error. Please try again. If this problem persists, contact the developers",
                        alert: "danger"
                    });
                }
            }
        }
    }
    
    // Handles login API call
	async handleGuestLogIn(e) {
        this.setState({ alert: "", error: "" }); // Clear alerts
        try {
            let response = await axios.post("/ftd/api/loginGuest");

            // Successful login; redirect to dashboard
            if (response) {
                Auth.loginAsGuest(response.data.jwt, () => {
                    this.props.history.push("/dashboard");
                });
            } else {
                this.setState({
                    alertMessage: "Oops! Internal server error. Please try again. If this problem persists, contact the developers",
                    alert: "danger"
                });
            }
        } 
        // Unsuccessful login
        catch (err) {
            this.setState({
                alertMessage: "Oops! Internal server error. Please try again. If this problem persists, contact the developers",
                alert: "danger"
            });
        }
	}

	render() {
		return (
            <div className="form">
                <img src={Logo} alt={"WarCry-Logo"} />

                <form onSubmit={this.handleLogInUser}>
                    {this.renderAlert()}    
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Must be between 6 and 50 characters long")}
                    >
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Username"
                            value={this.state.username}
                            onChange={this.handleUsername}
                            required
                        />
                    </OverlayTrigger>
                    <OverlayTrigger
                        placement="right"
                        delay={{ show: 250, hide: 100 }}
                        overlay={this.renderTooltip("Must be between 6 and 50 characters long")}
                    >   
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            value={this.state.password}
                            onChange={this.handlePassword}
                            required
                        />
                    </OverlayTrigger> 
                    <Button
                        variant="primary"
                        type="submit"
                        className="form-button"
                    >
                        Log In
                    </Button>
                </form>

                <Link to="/register" style={{ textDecoration: "none" }}>
                    <Button variant="dark" className="form-button">
                        Sign Up
                    </Button>
                </Link>

                <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 100 }}
                    overlay={this.renderTooltip("If you choose to play as a Guest, you will not be able to customize any settings or save play statistics (feature coming Soon™)")}
                >
                    <Button
                        variant="dark"
                        className="form-button guest-button"
                        onClick={this.handleGuestLogIn}
                    >
                        Play as Guest
                    </Button>
                </OverlayTrigger>

                <Row className="settings-footer align-items-center">
                    <Col xs={{ span: 3, offset: 10 }}>
                        <OverlayTrigger trigger="click" placement="top" overlay={this.renderHelpPopover()}>
                            <span id="settings-help-icon">
                                <Image src={HelpImg} alt={"Help-Button-Image"} style={{maxHeight: "25px", maxWidth: "25px"}} />
                            </span>
                        </OverlayTrigger>
                    </Col>
                </Row>
            </div>
		);
	}
}

export default LoginForm;
