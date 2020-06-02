import React from 'react';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import auth from "../Routing/auth";
import { Link } from 'react-router-dom';
import '../css/Dashboard.css';

class Dashboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            username: ""
        };
    }

    componentDidMount() {
        if (document.cookie !== "") {
            // Getting jwtToken
            const cookie = document.cookie;
            const splitCookie = cookie.split("=");
            const token = splitCookie[1];
            let postData = {
                cookies: token,
            };

            const that = this;
            axios.post('http://localhost:10421/ftd/api/username', postData)
                .then(response => {
                    if (response.data.verified == "Verified") {
                        that.setState({ username: response.data.username });
                    }

                })
                .catch(error => {
                    //error status
                    console.log('Request failed', error);
                })

        }
    }


    render() {
        return (
            <div>
                <div className="dashboard-container">
                    <h1 id="dashboard-greeting">{'Welcome ' + this.state.username}</h1>
                    <p id="text">Select from one of the following options below</p>
                    <hr />
                    <Link to="/lobbies">
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
                        auth.logout(() => {
                            this.props.history.push("/login");
                        })
                    }}>Log Out</Button>
                </div>
            </div>
        );
    }
}

export default Dashboard;