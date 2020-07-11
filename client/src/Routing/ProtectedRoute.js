import React from "react";
import { Route, Redirect } from "react-router-dom";

// If user is authorized, render the component for the given route. Otherwise, render the Login component
export const ProtectedRoute = ({ component: Component, ...rest }) => {
	return (
		<Route
			{...rest}
			render={ (props) => {
                if (localStorage.isAuth) {
                    return <Component {...props} />;
                }
                else {
                    return <Redirect to={
                        {
                            pathname: "/login",
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
