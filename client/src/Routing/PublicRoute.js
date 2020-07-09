import React from "react";
import { Route, Redirect } from "react-router-dom";
import Auth from "./auth";

// If user is already authorized, render the Dashboard component. Otherwise, render the component for the given route
// For example, if user is already authorized, going to /login should redirect to /dashboard
export const PublicRoute = ({ component: Component, ...rest }) => {
    return (
        <Route
            {...rest}
            render={(props) => {
                if (localStorage.isAuth) {
                    return <Redirect to={
                        {
                            pathname: "/dashboard",
                            state: {
                                from: props.location
                            }
                        }
                    } />
                } else {
                    return <Component {...props} />;
                }
            }}
        />
    );
};

export default PublicRoute;
