import React from 'react';
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

const Router = () => {
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
            <ProtectedRoute path="/lobbies" component={LobbiesPage} />
            <ProtectedRoute path="/userinfo" component={UserInfo} />
        </Switch>
    )
}

export default Router;