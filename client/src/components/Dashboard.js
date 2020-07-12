import React from "react";
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
		};
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

	render() {
		return (
			<div className="dashboard-container">
				<img src={Logo} alt={"WarCry-Logo"} />
                <h6 id="dashboard-greeting">
					{"Logged in as " + this.state.username}
				</h6>
				{/* <p id="text">Select from one of the following options below</p> */}
				<hr />

				<Link to="/play" style={{ textDecoration: "none" }}>
					<Button variant="primary" className="dashboard-button" block>
						PLAY
					</Button>
				</Link>

				{/* <Button variant="primary" block onClick={this.props.handleLeaderBoard}>Show Leaderboard</Button> */}
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
