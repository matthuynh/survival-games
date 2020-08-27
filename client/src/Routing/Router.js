import React from 'react';
import { Route, Switch } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import Dashboard from "../components/Dashboard";
import DeleteUser from "../components/DeleteUser";
import LobbiesPage from "../components/LobbiesPage";
import LoginForm from "../components/LoginForm";
import RegistrationForm from "../components/RegistrationForm";
import HelpPage from "../components/HelpPage";
import SettingsPage from "../components/SettingsPage";
import LandingPage from "../components/LandingPage";
import NotFoundPage from "../components/NotFoundPage";

class Router extends React.Component {
    render() {
        return (
            <Switch>
                {/* Public Routes */}
                {/* <Route path="/" exact component={LandingPage} /> */}
                <PublicRoute path="/" exact component={LandingPage} />
                <PublicRoute path="/login" component={LoginForm} />
                <PublicRoute path="/register" component={RegistrationForm} />
                <PublicRoute path="/landing" component={LandingPage} />

                {/* Protected Routes */}
                <ProtectedRoute path="/dashboard" render={(props) => <Dashboard {...props} />} component={Dashboard} />
                <ProtectedRoute path="/delete" component={DeleteUser} />
                <ProtectedRoute path="/play" render={(props) => <LobbiesPage {...props} />} component={LobbiesPage} />
                <ProtectedRoute path="/help" component={HelpPage} />
                <ProtectedRoute path="/settings" component={SettingsPage} />

                {/* Redirect to 404 page */}
                <Route component={NotFoundPage} />
            </Switch>
        );
    }
}

export default Router;