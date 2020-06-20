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
                <ProtectedRoute path="/dashboard" render={(props) => <Dashboard {...props}/> } component={Dashboard} />
                <ProtectedRoute path="/deleteuser" component={DeleteUser} />
                <ProtectedRoute path="/play" render={(props) => <LobbiesPage {...props} />} component={LobbiesPage} />
                <ProtectedRoute path="/userinfo" component={UserInfo} />

                {/* Redirect to 404 page */}
                <Route component={NotFoundPage} />
            </Switch>
        );
    }
}

export default Router;