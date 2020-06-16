import React from "react";
import { Route, Redirect } from "react-router-dom";
import auth from "./auth";

// Check to see if the user is still authenticated before allowing them to access page
class ProtectedRoute extends React.Component {
    state = {
        loading: true,
        isAuthenticated: false
    }

    // Each time the user accesses a ProtectedRoute, we check if their login session is still valid
    async componentDidMount() {
        let isValidLoginSession = await auth.isValidLoginSession();
        this.setState({
            loading: false,
            isAuthenticated: isValidLoginSession
        })
    }

    render() {
        const { component: Component, ...rest } = this.props;
        if (this.state.loading) {
            // TODO: Make an actual loading page
            return <div> LOADING </div>;
        } else {
            // Render the protected page if authenticated, otherwise redirect to login page
            return (
                <Route {...rest} render={props => (
                    // TODO: Add an error message that is displayed on login page that tells user their session expired
                    <div>
                      {!this.state.isAuthenticated && <Redirect to={{ pathname: '/login', state: { from: this.props.location } }} />}
                      <Component {...this.props} />
                    </div>
                    )}
                  />
            );
        }
    }
}

export default ProtectedRoute;