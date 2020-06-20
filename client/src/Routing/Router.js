import React from 'react';
import axios from 'axios';
//react-router-dom imports
import { Route, Switch } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Auth from "./auth";

import Dashboard from "../components/Dashboard";
import DeleteUser from "../components/DeleteUser";
import LobbiesPage from "../components/LobbiesPage";
import LoginForm from "../components/LoginForm";
import RegistrationForm from "../components/RegistrationForm";
import UserInfo from "../components/UserInfo";
import LandingPage from "../components/LandingPage";
import NotFoundPage from "../components/NotFoundPage";

class Router extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isAuthenticated: false
        }
    }

    // Each time the user accesses any route, we check if their login session is still valid
    async componentDidMount() {
        console.log("Router component mounting");
        let isValidLoginSession = await Auth.isValidLoginSession();
        this.setState({
            isAuthenticated: isValidLoginSession
        })
        console.log(`Inside Router.js, we have isValidLoginSession=${isValidLoginSession}`);
    }

    render() {
        return (
            <Switch>
                {/* Public Routes */}
                <Route path="/" exact component={LandingPage} />
                <Route path="/login" exact component={LoginForm} />
                <Route path="/register" component={RegistrationForm} />
                <Route path="/landing" component={LandingPage} />


                {/* TODO: Why don't all of these protectedroutes have a render? */}
                {/* Protected Routes */}
                <ProtectedRoute path="/dashboard" render={(props) => <Dashboard {...props}/> } component={Dashboard} isAuthed={this.state.isAuthenticated} />
                <ProtectedRoute path="/deleteuser" component={DeleteUser} isAuthed={this.state.isAuthenticated} />
                <ProtectedRoute path="/play" render={(props) => <LobbiesPage {...props} />} component={LobbiesPage} isAuthed={this.state.isAuthenticated}/>
                <ProtectedRoute path="/userinfo" component={UserInfo} isAuthed={this.state.isAuthenticated} />

                {/* Redirect to 404 page */}
                <Route component={NotFoundPage} />
            </Switch>
        );
    }
}

export default Router;