import React from 'react';
import Vid from '../videos/Landing.mp4';
import Logo from '../assets/Warcry_logo.png';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import '../css/LandingPage.css';

function LandingPage() {
    return (
        <div className="landing-page-body">  
            <header className="v-header container">
                <div className="video-container">
                    <video src={Vid} type="video/mp4" autoPlay loop muted>
                    </video>
                </div>

                <div className="header-overlay"></div>
                <div className="header-content">
                    <img src={Logo} alt={"WarCry-Logo"} />
                    <Link to="/login" style={{ textDecoration: "none" }}>
                        <Button variant="outline-info" className="play-now-btn" block>PLAY NOW</Button>
                    </Link>
                </div>
            </header>
        </div>
    );
}

export default LandingPage;