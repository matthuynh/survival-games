import React from 'react';
import Vid from '../videos/Landing.mp4';
import Logo from '../assets/Warcry_logo.png';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import '../css/LandingPage.css';

function LandingPage() {
    return (
        <header className="v-header container">
            <div className="video-container">
                <video src={Vid} type="video/mp4" autoPlay loop muted>
                </video>

            </div>
            <div className="header-overlay"></div>
            <div className="header-content">
                <img src={Logo} />
                <p>
                    Welcome to WarCry, a battle royale game by Matthew and Rahul
                </p>
                <Link to="/login">
                    <Button variant="primary" className="btn" size="lg" block >Login</Button>
                </Link>
                <Link to="/register">
                    <Button variant="dark" size="lg" block >SignUp</Button>
                </Link>
            </div>
        </header>
    );
}

export default LandingPage;