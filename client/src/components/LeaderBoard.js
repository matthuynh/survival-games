import React from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import '../css/LeaderBoard.css';


class LeaderBoard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            playerscore: [],
            error: "",
            alert: false
        };
    }

    //have Component didmount life cycle method to export leaderboards from endpoint
    componentDidMount() {

        // const that = this;
        // //what url do we put??
        // //fetch call for logging in user
        // fetch('http://localhost:10421/ftd/api/leaderboard')
        //     .then(function (response) {
        //         //error checking status codes
        //         if (response.status === 500) {
        //             that.setState({
        //                 error: "Oops! Internal server error",
        //                 alert: true
        //             });
        //         } else {
        //             return response.json();
        //         }
        //     }).then(function (data) {
        //         console.log(data);
        //         that.setState( { playerscore: data } );
        //     })
        //     .catch(function (error) {
        //         console.log('Request failed', error);
        //     })

    }

    render() {
        return (
            <div className="leader-board">
                <h1>LeaderBoards</h1>
                <p>The top ten scores in Survival Games</p>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Username</th>
                            <th>Record Date</th>
                            <th>Kills</th>
                            <th>Completion Time (inSeconds)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Use map function to populate lobby table */}
                    </tbody>
                </Table>
                <Button variant="primary" onClick={this.props.handleExit}>Go Back</Button>
            </div>
        );
    }
}

export default LeaderBoard;