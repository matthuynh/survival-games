import React from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Auth from "../Routing/auth";
import { Link } from "react-router-dom";
import Logo from "../assets/Warcry_logo.png";
import "../css/Dashboard.css";

class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: "",
			alert: "",
			alertMessage: ""
		};

		// Checks to see if user was redirected from LobbiesPage
        if (props.location && props.location.state && props.location.state.response === "socket-server-closed") {
            this.state.alertMessage = "Sorry! The game server is currently undergoing maintenance... Please contact the developers if this problem persists";
            this.state.alert = "danger";
            props.history.replace({ state: "" });
        }
	}

	// Get user's username to display on dashboard
	async componentDidMount() {
		try {
			let username = await Auth.getUsername();
			if (username) {
				this.setState({ username: username });
			} else {
				this.props.history.push("/login");
			}
		} catch {
			this.props.history.push("/login");
		}
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
	
	render() {
		return (
			<div className="dashboard-container">
				<img src={Logo} alt={"WarCry-Logo"} />
				{this.renderAlert()}    
                <h6 id="dashboard-greeting">
					{"Logged in as " + this.state.username}
				</h6>
				<hr />
 
				<Link to="/play" style={{ textDecoration: "none" }}>
					<Button variant="primary" className="dashboard-button" block>
						PLAY
					</Button>
				</Link>

				<Link to="/settings" style={{ textDecoration: "none" }}>
					<Button variant="dark" className="dashboard-button"  block>
						User Settings
					</Button>
				</Link>

				<hr />

				<Button
                    variant="dark"
                    className="dashboard-button" 
					block
					onClick={() => {
						Auth.logout(() => this.props.history.push("/login"));
					}}
				>
					Log Out
				</Button>
			</div>
		);
	}
}

export default Dashboard;
