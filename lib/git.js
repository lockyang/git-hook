'use strict';

const fs = require('fs');
const moment = require('moment');
const childProcess = require('child_process');
const partChoices = ['major', 'feature', 'patch'];

const _gitAdd = (callback) => {
  let command = `git add .`;
  console.log(`>>> Exec ${command} at ${process.cwd()}`);
  childProcess.exec(command, (err, stdout, stderr) => {
    if ( !err ) {
      stdout = stderr;
      stderr = null;
    }
    callback(err, stdout)
  })
}

const _gitCommit = (message, callback) => {
  let command = `git commit -m "${message}"`
  console.log(`>>> Exec ${command} at ${process.cwd()}`);
  childProcess.exec(command, (err, stdout, stderr) => {
    if ( !err ) {
      stdout = stderr;
      stderr = null;
    }
    callback(err, stdout)
  })
}

const _gitPush = (callback) => {
  let command = `git push`;
  console.log(`>>> Exec ${command} at ${process.cwd()}`);
  childProcess.exec(command, (err, stdout, stderr) => {
    if ( !err ) {
      stdout = stderr;
      stderr = null;
    }
    callback(err, stdout)
  })
}

exports.gitCommit = _gitCommit;
exports.gitPush = _gitPush;
exports.gitAdd = _gitAdd;
