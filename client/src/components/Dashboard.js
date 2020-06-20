import React from 'react';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import Auth from "../Routing/auth";
import { Link, withRouter } from 'react-router-dom';
import '../css/Dashboard.css';

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: ""
        };
    }

    // Get user's username to display on dashboard
    async componentDidMount() {
        try {
            let username = await Auth.getUsername();
            if (username) {
                this.setState({ username: username});
            } else {
                this.props.history.push("/login")
            }
        } catch {
            this.props.history.push("/login")
        }
    }

    render() {
        return (
            <div className="dashboard-container">
                <h1 id="dashboard-greeting">{'Welcome ' + this.state.username}</h1>
                <p id="text">Select from one of the following options below</p>
                <hr />

                <Link to="/play">
                    <Button variant="primary" block >View Lobbies</Button>
                </Link>

                {/* <Button variant="primary" block onClick={this.props.handleLeaderBoard}>Show Leaderboard</Button> */}
                <Link to="/userinfo">
                    <Button variant="primary" block >Edit User Information</Button>
                </Link>
                
                <Link to="/deleteuser">
                    <Button variant="danger" block >Delete User</Button>
                </Link>

                {/* Handle logout from auth file */}
                <Button variant="primary" block onClick={() => {
                    Auth.logout(() =>
                        this.props.history.push("/login")
                    );
                }}>Log Out</Button>
            </div>
        );
    }
}

export default Dashboard;