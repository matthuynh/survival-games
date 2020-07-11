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
			error: "",
			alert: false,
		};
		this.handleLogInUser = this.handleLogInUser.bind(this);
		this.handleUsername = this.handleUsername.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);
	}

	handleUsername(event) {
		this.setState({ username: event.target.value });
	}

	handlePassword(event) {
		this.setState({ password: event.target.value });
    }
    
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
        this.setState({ alert: false, error: "" });

        let invalidLogin = true;
        if (this.state.username.length < 6 || this.state.username.length > 50 || this.state.password.length < 6 || this.state.password.length > 50) {
            this.setState({
                error: "Your username and password must be between 6 and 50 characters long",
                alert: true,
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
                        error: "Oops! Internal server error",
                        alert: true,
                    });
                }
            } 
            // Unsuccessful login
            catch (err) {
                console.log(err.response);
                if (err.response && err.response.status === 400) {
                    this.setState({
                        error:
                            "Your password and username must be between 6 to 50 (inclusive) characters long",
                        alert: true,
                    });
                } else if (err.response && err.response.status === 401) {
                    this.setState({
                        error:
                            "Either that username does not exist, or your password is incorrect (we won't specify which one for security!)",
                        alert: true,
                    });
                } else {
                    this.setState({
                        error: "Oops! Internal server error",
                        alert: true,
                    });
                }
            }
        }
	}

	render() {
        // Create alert box
		let alert = null;
		if (this.state.alert) {
			alert = (
				<Alert variant="danger">
					{this.state.error}
				</Alert>
			);
		} 

		return (
			<div>
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
                            />
                        </OverlayTrigger> 
                        <OverlayTrigger
                            placement="right"
                            delay={{ show: 250, hide: 100 }}
                            overlay={this.renderTooltip("Please fill in your username and password!")}
                        >   
                            <Button
                                variant="primary"
                                type="submit"
                                className="form-button"
                            >
                                Log In
                            </Button>
                        </OverlayTrigger>
					</form>

					<Link to="/register" style={{ textDecoration: "none" }}>
						<Button variant="dark" className="form-button">
							Register
						</Button>
					</Link>
					{/* <Link to="/" style={{ textDecoration: "none" }}>
						<Button variant="dark" className="form-button">
							Landing Page
						</Button>
					</Link> */}
				</div>
			</div>
		);
	}
}

export default LoginForm;
