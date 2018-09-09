import './css/main.scss';
import moment from 'moment';
import React from 'react';
import {render} from 'react-dom';
import NavBar from './comp/NavBar.jsx';
import ResetButton from './comp/ResetButton.jsx';
import Uploader from './comp/Uploader.jsx';
import Subscribers from './comp/Subscribers.jsx';
import {ImageWall} from './comp/ImageWall.jsx';
import SimpleCryptoJS from 'simple-crypto-js'

const blockstack = require( 'blockstack' );
const { getPublicKeyFromPrivate } = require('blockstack');
const { encryptECIES, decryptECIES } = require('blockstack/lib/encryption')

import {
  Person,
  loadUserData,
} from 'blockstack';

window.blockstack = blockstack;
class App extends React.Component {

  constructor() {
    super()
    this.state = {
      userData: null,
      loggedIn: false,
      index: {
        images: []
      },

      // Just the images
      images: [],
      image: [],

      // { username, path, image }
      imageFeed: [],
      subscribers: [],
      aesKey: null,
      tab: 'my',

      isLoading: false,
      username: "",
      person: {
        name() {
          return 'Anonymous';
        },
        avatarUrl() {
          return avatarFallbackImage;
        },
      },
    }
  }

  componentDidMount() {
    if (blockstack.isSignInPending()) {
      blockstack.handlePendingSignIn().then((data) => {
        console.dir(data)
        this.setupUser()
        this.setupKey()
        this.setupSubscriber()
        window.history.pushState(null, null, '/')
      })
    } else if (blockstack.isUserSignedIn()) {
      console.log('Signed In')
      this.setupUser().then(() => {
        this.setupSubscriber()
        this.loadAESKey()
      })
    }
  }

  lookForNewImages() {
  }


  setupUser() {
    const userData = blockstack.loadUserData();
    this.setState({
      userData: userData,
      loggedIn: true,
      person: new Person(userData.profile),
      username: userData.username,
    });

    return blockstack.getFile('index.json').then(data => {
      if (data && !(data instanceof ArrayBuffer)) {
        console.log(data)
        let indexJson = JSON.parse(data) || {'images':[]};
        this.setState({index: indexJson});
      }
    })
      .then(() => {
        let promises = this.state.index.images.map((image) => {
          return this.fetchFile(image.path)
        })
        return Promise.all(promises)
      })
      .then((images) => {
        this.setState({ images: images })
      })
      .catch((e) => {
        console.error(e)
      })
  }

  loadAESKey() {
    blockstack.getFile(`keys/${this.state.userData.username}`)
      .then((data) => {
        let encryptedKey = JSON.parse(data)
        let decryptedKey = decryptECIES(blockstack.loadUserData().appPrivateKey, encryptedKey)
        this.setState({aesKey: decryptedKey})
      })
  }

  setupKey() {
    let aesKey = SimpleCryptoJS.generateRandom()

      const publicKey = getPublicKeyFromPrivate(blockstack.loadUserData().appPrivateKey)
      return blockstack.putFile('key.json', JSON.stringify(publicKey))
          .then(() => {
              console.log("public key saved");
              console.log(JSON.stringify(publicKey))
          })
        .then(() => {
            let encryptedAesKey = encryptECIES(publicKey, aesKey)
            let username = this.state.userData.username
            return blockstack.putFile(`keys/${username}`, JSON.stringify(encryptedAesKey))
          })
        .then(() => {
          this.setState({ aesKey })
        })
          .catch(e => {
              console.log(e);
          });

  }

  fetchFile(path) {
    return blockstack.getFile(path)
  }

  updateIndexAndImages(path, image) {
    let index = this.state.index
    const created = moment().toISOString();
    index['images'] = [...index.images, {path, created}]
    let images = [...this.state.images, image]

    blockstack.putFile('index.json', JSON.stringify(index))
      .then(() => {
        console.log('Index.json uploaded')
        this.setState({ index, images })
      })
      .catch((e) => {
        console.error(e)
      })
  }

  updateFeed(images) {
    console.log('in update feed: ', images);
    const newImageFeed = this.state.imageFeed;
    newImageFeed.push(images);
    newImageFeed.sort((imageA, imageB) => { return imageA.created < imageB.created});
    this.setState({imageFeed: newImageFeed});
  }

  subscriberImageLoaded(indexEntry) {
    if (!this.state.imageFeed.length) {
      return false;
    }
    return this.state.imageFeed.some((el) =>
      el.path == indexEntry.path && el.username == indexEntry.username
    )
  }

  toggleTab() {
    if (this.state.tab === 'my') {
      this.setState({ tab: 'friends' })
    }
    else {
      this.setState({ tab: 'my' })
    }
  }

    setupSubscriber() {
      if(this.state.loggedIn) {
          blockstack.getFile('subscribers.json')
              .then((data) => {
                  console.log('data returned from subscribers.json', data);
                  this.setState({subscribers: JSON.parse(data || [])});
                  return this.readSubscribersImages();
              }).catch(err => {
              console.warn(err);
          }).then(() => {
            window.setInterval(this.readSubscribersImages.bind(this), 15000);
          })
      }
    }

    removeAllSubscribers() {
        blockstack.putFile('subscribers.json', '[]').then(() => {
            this.setState({subscribers: []});
        });
    }

    readSingleSubscribersImages(username) {
        console.log("Coming for fisrt and going for get")
        blockstack.getFile('subscribers.json', {
            username: username
        }). then (sData => {
            console.log("Username: " + username)
            let subscriberData = JSON.parse(sData)
            console.log("outside if condition")
            const userData = blockstack.loadUserData()
            console.log("mydata"+subscriberData )
            var flag = false
            subscriberData.forEach( subscriber => {
                console.log("coming with null value")
                if ( subscriber.hasOwnProperty('username') && subscriber.username.match(userData.name)) {
                    console.log("inside if condition")
                    flag = true;
                    // break;
                }
            })

            if (flag == true) {
               console.log('Username for index: ' + username)
               console.log("Coming for reading data!!!!")
               blockstack.getFile('index.json', {
               username: username
                }).then(indexData => {
                  let data = JSON.parse(indexData);
                  console.log('Subscribers indexData is', indexData);
                  data.images.forEach((indexEntry) => {
                    if (!this.subscriberImageLoaded({...indexEntry, username})) {
                      blockstack.getFile(indexEntry.path, {username}).then((imageData) => {
                          this.updateFeed({path: indexEntry.path, username: username, image: imageData, created: indexEntry.created});
                      })
                    }
                  })
                }).catch(err => {
                  console.warn(err);
                  return
                });
            }
            else {
              console.log('you are not freind with ' + username)
            }
            
        }).catch(err => {
          console.warn("No subscribers found: " + err)
          return
        })
    }
    readSubscribersImages () {
      this.state.subscribers.forEach(subscriber => {
          console.log('A subscriber is', subscriber);
          this.readSingleSubscribersImages(subscriber.username);
      });
    }

    addSubscriber (newSubscriber) {
        blockstack.getFile('key.json', {
            username: newSubscriber
        }).then(keyData => {
            let subscribers = this.state.subscribers;
            subscribers.push({username: newSubscriber, publicKey: JSON.parse(keyData)});
            this.setState({subscribers})
            this.persistSubscribers();
            this.readSingleSubscribersImages(newSubscriber);
        })
            .catch(e => {
                console.log(newSubscriber + ' is no blockstagram user yet');
            })
    }

    persistSubscribers() {
        blockstack.putFile('subscribers.json', JSON.stringify(this.state.subscribers))
            .then(() => 'submitted subscribers.json')
            .catch(e => console.dir(e))
    }

    updateIsLoading(isLoading) {
      this.setState({
        isLoading: isLoading
      });
    }

  render () {
    const { person } = this.state;
    const { username } = this.state;
    return <div>

    <NavBar userData={this.state.userData}/>

    <section className="section">

      <div className="profile_container">
        <div class="centered">
          <div className="one">
        { this.state.loggedIn ?
          <div>
            <img src={person.avatarUrl()} width="300px" height="200px" alt="_ -- _"/>
            <h1><b>{username}</b></h1>
          </div>: <div><h1 css="font-size: 40px;"><b>The Decentralized File sharing protocol where you own & control your data!! – dPics</b></h1>
          </div>
        }
          </div>
          </div>

      </div>
      <div className="container is-desktop">
        <div className="columns blockstagram-columns">

		  <div className="column is-two-thirds">

		  { this.state.loggedIn ?
      <div className="tabs is-boxed">
        <ul>
          <li className={ this.state.tab === 'my' ? "is-active" : ''}>
            <a onClick={this.toggleTab.bind(this)}>
              <span className="icon is-small"><i className="fas fa-image"></i></span>
              <span>My Pictures</span>
            </a>
          </li>
        <li className={ this.state.tab === 'friends' ? "is-active" : ''}>
            <a onClick={this.toggleTab.bind(this)}>
              <span className="icon is-small"><i className="fas fa-image"></i></span>
              <span>Friends Pictures</span>
            </a>
          </li>
        </ul>
      </div>:<div className="gg"><h1><b>'Welcome to Hackathon Infoblox's decentralized Sharing Data Application'</b></h1>
      <h3>SignIn to Know More!</h3>
      <img src="img/Sharing.jpg" align="middle" width='70%'/>
      </div>}
        { this.state.tab === 'my' ?
          <div className="container">
            <ImageWall images={this.state.images} />
          </div> :
          <div className="container">
            <ImageWall images={this.state.imageFeed.map(imageData => imageData.image)} />
          </div>
        }
        { this.state.isLoading ?
          <img src="img/loading.gif"/>: ''
        }
	</div>
        { this.state.loggedIn ?
          <div className="column">
        { this.state.tab === 'my' ?
				<div className="container">
					<Uploader updateIndexAndImages={this.updateIndexAndImages.bind(this)} updateIsLoading={this.updateIsLoading.bind(this)} isLoading={this.state.isLoading}/>
				</div>: ''}
		      
			  
        <div className="container">
          { this.state.loggedIn ? <Subscribers
            addSubscriber={this.addSubscriber.bind(this)}
            removeAllSubscribers={this.removeAllSubscribers.bind(this)}
            subscribers={this.state.subscribers}
            updateFeed={this.updateFeed.bind(this)}/> : '' }
			  </div>
      </div>:

      <div className="rr container">
            <img src="img/infoblox_app.png" align="middle"/>
          </div>}
		  

		  
        </div>
      </div>
    </section>

    </div>
    ;
  }
}

render(<App/>, document.getElementById('app'));


