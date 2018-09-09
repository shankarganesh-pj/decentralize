import React from 'react';
import * as blockstack from 'blockstack'

export default class SigninButton  extends React.Component {

  onClick (evt) {
    evt.preventDefault();
    if (this.props.userData) {
      blockstack.signUserOut('/');
    } else {
      const origin = window.location.origin
      blockstack.redirectToSignIn(origin, origin + '/manifest.json', ['store_write', 'publish_data']);
    }
  }

  render() {
    let btnText = this.props.userData ? `Sign out` : 'Sign in'
    //  ${this.props.userData.username}
    return (
      <a onClick={this.onClick.bind(this)} className="button is-primary">{btnText}</a>
    );
  }
}
