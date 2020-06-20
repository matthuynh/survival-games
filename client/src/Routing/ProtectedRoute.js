import React from "react";
import { Route, Redirect } from "react-router-dom";
import Auth from "./auth";

export const ProtectedRoute = ({ component: Component, isAuthed, ...rest }) => {
    console.log("Inside ProtectedRoute, props.isAuthed is " + isAuthed);
	return (
		<Route
			{...rest}
			render={ (props) => {
                if (isAuthed) {
                    return <Component {...props} />;
                }
                else {
                    return <Redirect to={
                        {
                            pathname: "/",
                            state: {
                                from: props.location
                            }
                        }
                    } />
                }
			}}
		/>
	);
};

export default ProtectedRoute;
