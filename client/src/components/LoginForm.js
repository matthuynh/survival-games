import React from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Tooltip from "react-bootstrap/Tooltip"
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { Link } from "react-router-dom";
import Auth from "../Routing/auth";
import Logo from "../assets/login.png";
import "../css/LoginForm.css";

class LoginForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: "",
			password: "",
			alertMessage: "",
			alert: ""
		};
		this.handleLogInUser = this.handleLogInUser.bind(this);
		this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);

        // Checks to see if user was redirected from the Registration page to Login page
        if (props.location && props.location.state && props.location.state.response === "successful-registration") {
            this.state.alertMessage = "Successfully registered user!";
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
        document.addEventListener("keydown", this.handleKeyPress, false);
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

	// Handles login API call
	async handleLogInUser(e) {
        e.preventDefault();
        this.setState({ alert: false, error: "" }); // Clear alerts

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
                        alertMessage: "Oops! Internal server error",
                        alert: "warning"
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
                        alert: "warning"
                    });
                } else {
                    this.setState({
                        alertMessage: "Oops! Internal server error",
                        alert: "warning"
                    });
                }
            }
        }
	}

	render() {
        // Create alert box
		let alert = null;
		if (this.state.alert === "warning") {
			alert = (
				<Alert variant="danger">
					{this.state.alertMessage}
				</Alert>
			);
		} else if (this.state.alert === "success") {
            alert = (
				<Alert variant="success">
					{this.state.alertMessage}
				</Alert>
			);
        }

		return (
            <div className="form">
                <img src={Logo} alt={"WarCry-Logo"} />
                <hr />

                <form onSubmit={this.handleLogInUser}>
                    {alert}    
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
                        Create an Account
                    </Button>
                </Link>
            </div>
		);
	}
}

export default LoginForm;
