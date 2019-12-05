"use strict";

var fs = require('fs');

var path = require('path');

module.exports = [{
  name: 'awsProfile',
  type: 'list',
  message: 'How do you want to authenticate with AWS?',
  default: '0',
  choices: function choices(_) {
    var profileNames = ['Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.'];
    var credentialsPath = path.join(require('os').homedir(), '.aws', 'credentials');

    if (fs.existsSync(credentialsPath)) {
      var credentials = fs.readFileSync(credentialsPath, 'utf8');
      var profileNameRegexp = new RegExp(/^\[([0-9a-zA-Z-]*)]?/gm);
      var match = profileNameRegexp.exec(credentials);

      while (match != null) {
        profileNames.push('Profile: ' + match[1]);
        match = profileNameRegexp.exec(credentials);
      }
    }

    return profileNames;
  },
  filter: function filter(answer) {
    if (answer.startsWith('Environment variables:')) {
      return 'default';
    } else {
      return answer.replace('Profile: ', '');
    }
  }
}, {
  name: 'overrideEndpoint',
  type: 'confirm',
  message: 'Override the default endpoint? eg. DigitalOcean',
  default: false
}, {
  name: 'endpoint',
  type: 'input',
  message: 'Enter the new endpoint:',
  when: function when(answers) {
    return answers.overrideEndpoint === true;
  }
}, {
  name: 'region',
  type: 'input',
  message: 'Which AWS region hosts the bucket?',
  default: 'us-east-1'
}, {
  name: 'bucket',
  type: 'input',
  message: 'Name of the S3 bucket:',
  validate: function validate(input) {
    return input !== '' ? true : 'A bucket name is required.';
  }
}, {
  name: 'createBucket',
  type: 'confirm',
  message: 'Create bucket if it does not exist?',
  default: true
}, {
  name: 'staticHosting',
  type: 'confirm',
  message: 'Enable Static Site Hosting on bucket?',
  default: true
}, {
  name: 'staticIndexPage',
  type: 'input',
  message: 'Filename of static index page:',
  default: 'index.html',
  when: function when(answers) {
    return answers.staticHosting === true;
  },
  validate: function validate(input) {
    return input !== '' ? true : 'A filename is required.';
  }
}, {
  name: 'staticErrorPage',
  type: 'input',
  message: 'Filename of static error page:',
  default: 'index.html',
  when: function when(answers) {
    return answers.staticHosting === true;
  },
  validate: function validate(input) {
    return input !== '' ? true : 'A filename is required.';
  }
}, {
  name: 'assetPath',
  type: 'input',
  message: 'Where are your built files?',
  default: 'dist'
}, {
  name: 'assetMatch',
  type: 'input',
  message: 'Which files should be deployed?',
  default: '**'
}, {
  name: 'deployPath',
  type: 'input',
  message: 'Where in the bucket should the files be deployed?',
  default: '/'
}, {
  name: 'acl',
  type: 'list',
  choices: ['private', 'public-read', 'public-read-write', 'aws-exec-read', 'authenticated-read', 'bucket-owner-read', 'bucket-owner-full-control'],
  message: 'Which Access Control List (ACL) setting should be applied to deployed files?',
  default: 'public-read'
}, {
  name: 'pwa',
  type: 'confirm',
  message: 'Enable PWA deploy (disables caching of certain files) options?',
  default: false
}, {
  name: 'pwaFiles',
  type: 'input',
  message: 'Disable caching on which files (comma-separated)?',
  default: 'index.html,service-worker.js,manifest.json',
  validate: function validate(input) {
    return input !== '' ? true : 'At least one file path is requires.';
  },
  when: function when(answers) {
    return answers.pwa === true;
  }
}, {
  name: 'enableCloudfront',
  type: 'confirm',
  message: 'Enable invalidation of a CloudFront distribution on deploy?',
  default: false
}, {
  name: 'cloudfrontId',
  type: 'input',
  message: 'What is the ID of the distribution to invalidate?',
  default: '',
  when: function when(answers) {
    return answers.enableCloudfront === true;
  },
  validate: function validate(input) {
    return input !== '' ? true : 'A distribution ID is required.';
  }
}, {
  name: 'cloudfrontMatchers',
  type: 'input',
  message: 'Enter a comma-separated list of paths to invalidate:',
  default: '/index.html,/service-worker.js,/manifest.json',
  when: function when(answers) {
    return answers.enableCloudfront === true;
  },
  validate: function validate(input) {
    return input !== '' ? true : 'At least one invalidation path is required. To invalidate all files, enter /* ';
  }
}];