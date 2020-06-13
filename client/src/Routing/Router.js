import React from 'react';
import axios from 'axios';
//react-router-dom imports
import { Route, Switch } from "react-router-dom";
import { ProtectedRoute } from "./PrivateRoute";


import Dashboard from "../components/Dashboard";
import DeleteUser from "../components/DeleteUser";
import LobbiesPage from "../components/LobbiesPage";
import LoginForm from "../components/LoginForm";
import RegistrationForm from "../components/RegistrationForm";
import UserInfo from "../components/UserInfo";
import LandingPage from "../components/LandingPage";

class Router extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            username: ""
        }
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
            <Switch>
                {/* Public Routes */}
                <Route path="/" exact component={LandingPage} />
                <Route path="/login" exact component={LoginForm} />
                <Route path="/register" component={RegistrationForm} />
                <Route path="/landing" component={LandingPage} />

                {/* Protected Routes */}
                <ProtectedRoute path="/dashboard" component={Dashboard} />
                <ProtectedRoute path="/deleteuser" component={DeleteUser} />
                <ProtectedRoute path="/lobbies" render={(props) => <LobbiesPage {...props} User={"hoolahoop"} />} component={LobbiesPage} />
                <ProtectedRoute path="/userinfo" component={UserInfo} />
            </Switch>
        );

    }

}

export default Router;