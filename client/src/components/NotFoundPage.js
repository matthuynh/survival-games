import React from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import '../css/PageNotFound.css';


class NotFoundPage extends React.Component {
    render() {
        return (
            <div className="page-not-found-container">
                <h3 className="title">404 Page Not Found </h3>
                <p className="text">Oops! That page doesn't exist</p>
                <hr />

                <Link to="/dashboard">
                    <Button variant="primary" block >Go home</Button>
                </Link>
            </div>
        );
    }
}

export default NotFoundPage;