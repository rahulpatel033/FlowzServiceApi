let rp = require('request-promise');
let shell = require('shelljs');

const config = require('../../config');

module.exports = {
  before: {
    all: [],
    find: [
      hook => before_send_repoToGit(hook)
    ],
    get: [
      hook => before_remove_project(hook)
    ],
    create: [
      hook => before_commit_repo(hook)
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [
      hook => after_send_repoToGit(hook)
    ],
    get: [
      hook => after_remove_project(hook)
    ],
    create: [
      hook => after_commit_repo(hook)
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};


function before_send_repoToGit(hook) {
    hook.result = hook.data;
}

function before_commit_repo(hook) {
    hook.result = hook.data;
}

function before_remove_project(hook) {
    hook.result = hook.data;
}


function after_send_repoToGit(hook) {
    return new Promise((resolve, reject) => {
      let nameOfRepo = hook.params.query.nameOfRepo;
      let username = hook.params.query.username;
        var options = {
            method: 'POST',
            uri: config.gitLabUrl + '/api/v4/projects',
            body: {
              name: nameOfRepo
            },
            headers: {
                'PRIVATE-TOKEN': hook.params.query.privateToken
            },
            json: true
        };

        rp(options)
            .then(function(repos) {
              if (!shell.which('git')) {
                shell.echo('Sorry, this script requires GIT CLI. Please install GIT CLI in your machine.');
                shell.exit(1);
              } else {
                shell.cd(config.path + nameOfRepo+'/');

                shell.exec('git init');
                shell.exec('git remote add origin ' + config.gitLabUrl + '/' + username + '/'+ nameOfRepo +'.git');
                shell.exec('git remote -v');

                shell.exec('git status');

                shell.exec('git add .');
                shell.exec('git commit -m "Initial commit"');
                shell.exec('git push -u origin master -f');

                shell.echo('New Repository Pushed to GitLab server');
              }
                hook.result = repos;
                resolve(hook)
            })
            .catch(function(err) {
                hook.result = err;
                resolve(hook)

            });
    })
}




function after_commit_repo(hook) {
    return new Promise((resolve, reject) => {
      let nameOfRepo = hook.data.repoName;
        
        if (!shell.which('git')) {
          shell.echo('Sorry, this script requires GIT CLI. Please install GIT CLI in your machine.');
          shell.exit(1);
        } else {
          shell.cd(config.path + nameOfRepo+'/');

          shell.exec('git status');

          shell.exec('git add .');

          shell.exec('git commit -m "' + hook.data.commitMessage + '"');

          shell.exec('git push -u origin master --force'); 

          shell.echo('New Commit Pushed to GitLab server');         
        }
        resolve(hook)
    })
}


function after_remove_project(hook) {
    return new Promise((resolve, reject) => {
      console.log("Repo ID:", hook.id);
      console.log("privateToken: ", hook.params.query.privateToken );

      var options = {
            method: 'DELETE',
            uri: config.gitLabUrl + '/api/v4/projects/'+hook.id,
            headers: {
                'PRIVATE-TOKEN': hook.params.query.privateToken
            },
            json: true
        };

        rp(options)
        .then(function(repos) {
            console.log('repo deleted!');
            hook.result = repos;
            resolve(hook)
        })
        .catch(function(err) {
            console.log(err)
            hook.result = err;
            resolve(hook)
        });

      resolve(hook)
    })
}

