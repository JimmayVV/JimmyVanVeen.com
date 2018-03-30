import React, { Component } from 'react';
//import ReactDOM from 'react-dom';
import ProjectDetail from './details/project-details';
const LocalStorage = 'jimmy-homepage';
const StorageTime = 'jimmy-homepage-time';

export default class Projects extends Component {
  constructor(props) {
    super(props);

    //let localStorageTime = null;
    let storage = localStorage.getItem(LocalStorage);
    let time = localStorage.getItem(StorageTime);

    const minutesOld = 15;

    let then = new Date(Date.now() - (1000 * 60 * minutesOld));

    this.state = {
      repos: [
        { repo: { owner: { login: 'JimmayVV' }, name: 'JimmyVanVeen.com' }, displayName: 'Jimmy\'s Home Page', deviceClass: 'jimmy', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'Houdana' }, displayName: 'Houdana', deviceClass: 'houdana', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'Epic-Viewer' }, displayName: 'Epic Viewer', deviceClass: 'epic', readme: null },
        { repo: { owner: { login: 'TwilightCoders' }, name: 'Card-Games' }, displayName: 'Card Games', deviceClass: 'card-games', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'freeCodeCamp-work' }, displayName: 'Free Code Camp', deviceClass: 'fccWork', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'LogoDesignARNs' }, displayName: 'Logo Design ARN\'s', deviceClass: 'logo-design-arns', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'Feedback-Application' }, displayName: 'Feedback Application', deviceClass: 'feedback-application', readme: null },
        { repo: { owner: { login: 'JimmayVV' }, name: 'List-Generator' }, displayName: 'List Generator', deviceClass: 'list-generator', readme: null }
      ]
    };

    // If the last updated time is too old (or was never set) then pull data using AJAX from github
    if (!time || time < then) {
      console.log('updating Git data due to being out of date');
      this.state.repos.map((obj, index) => {
        return this.getRepoData(obj, index);
      });
    } else if (storage) {
      this.state.repos = JSON.parse(storage);
    }
  }

  getRepoData(obj, index) {
    let url = `https://api.github.com/repos/${obj.repo.owner.login}/${obj.repo.name}`;

    let success = (data) => {
      let repos = this.state.repos;
      repos[index].repo = JSON.parse(data);
      this.setState({ repos });
      localStorage.setItem(LocalStorage, JSON.stringify(this.state.repos));
      // Now that all the info has been processed on the main repo, get the readme info
      this.getReadmeInfo(obj, index);
      localStorage.setItem(StorageTime, Date.now());
    };

    this.getJson(url, success);
  }

  getReadmeInfo(obj, index) {
    let url = `https://api.github.com/repos/${obj.repo.owner.login}/${obj.repo.name}/readme`;

    let success = (data) => {
      data = JSON.parse(data);
      if (data.hasOwnProperty('message') && data.message === 'Not Found') {
        // Readme does not exist
        console.warn(`readme does not exist for ${obj.repo.name}`);
        // Get local storage, if it exists, otherwise set README as null
      } else {
        // Readme DOES exist!
        console.log(`readme DOES exist for ${obj.repo.name}`);

        this.getJson(data.download_url, (readme) => {
          let repos = this.state.repos;
          repos[index].readme = readme;
          this.setState({ repos });
          localStorage.setItem(LocalStorage, JSON.stringify(this.state.repos));
        }, () => this.defaultFailure());
      }
    };

    this.getJson(url, success);
  }

  defaultFailure() {
    /*if (localStorage.getItem(LocalStorage))
      this.setState({repos: JSON.parse(localStorage.getItem(LocalStorage))});*/
    console.error('Could not load JSON data');
  }

  getJson(url, success = () => { }, failure = () => { this.defaultFailure() }, async = true) {
    let request = new XMLHttpRequest();
    request.open('GET', url, async);
    request.onload = () => {
      if (request.readyState !== 4 || request.status !== 200) {
        failure();
        success(request.responseText);
      } else {
        success(request.responseText);
      }
    };

    request.onerror = () => {
      console.log(`Error running AJAX command for URL: ${url}`);
    };
    request.send();
  }

  render() {
    return (
      <div className="row">
        {this.state.repos.map((repo, index) => <ProjectDetail key={index} repo={repo} />)}
      </div>);
  }
}

//ReactDOM.render(<Projects />, document.getElementById('projects'));