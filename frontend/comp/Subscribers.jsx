import React from 'react';
import * as blockstack from 'blockstack'

export default class Subscriber  extends React.Component {

    addSubscriber(evt) {
        evt.preventDefault();
        this.props.addSubscriber(this.input.value)
    }

    render() {
        var userNames = this.props.subscribers.map((subscriber) => {
            return (
                <li key={subscriber.username}>{subscriber.username}</li>
            );
        });

        return (
            <form onSubmit={this.addSubscriber.bind(this)}>
                <h3>Add friend</h3>
                <input name="username" ref={element => this.input = element} defaultValue="Enter Blockstack.id" />
                <button type="submit">Add</button>

				<div className="container">
                <br></br>
				<a className="button is-danger" onClick={this.props.removeAllSubscribers.bind(this)}>Delete Friends</a>
                <ul>
                    {userNames}
                </ul>
				</div>
            </form>
        );
    }
}
