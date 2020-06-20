import Auth from "./auth";

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={ () => (
        Auth.isAuthenticated === true ?
        <Component {...props} />
        :
        <Redirect to="/login"/>
    )}/>
)