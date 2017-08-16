'use strict';

const fs = require('fs');
const moment = require('moment');
const childProcess = require('child_process');
const partChoices = ['major', 'feature', 'patch'];

// date tag
const _transformDate = (timeTag) => {
  let m = moment();
  let thisWeek = +m.weeks();
  let thisYear = +m.format('YY');

  if(!timeTag){
      return `${thisYear}w${thisWeek}a`;
  }

  let matches = timeTag.match(/(\d{2})w(\d{1,2})(\w)/i);

  let timesLetter = 'a';
  if(thisYear === +matches[1] && thisWeek === +matches[2]){
      let timesCode = matches[3].charCodeAt(0);
      if(++timesCode <= 112){
          timesLetter = String.fromCharCode(timesCode);
      }else{
          throw new Error('已超过发布次数上限[a-z]');
      }
  }

  return `${thisYear}w${thisWeek}${timesLetter}`;
}

const _transformSemver = (semverVersion, part)  => {
  let semverArray = semverVersion.split('.').map( val => +val );
  let increasePosition = partChoices.indexOf(part);
  semverArray[increasePosition]++;
  for ( let i = increasePosition + 1; i < semverArray.length; i++ ) {
    semverArray[ i ] = 0;
  }
  return semverArray.join('.');
}

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

const _gitTagAdd = (tag, message, callback) => {
  let command = `git tag -a '${tag}' -m '${message}'`;
  console.log(`>>> Exec ${command} at ${process.cwd()}`);
  childProcess.exec(command, function(err, stdout, stderr){
      if(!err){
        stdout = stderr;
        stderr = null;
      }
      callback(err, stdout);
  });
}

const _gitCommit = (message, callback) => {
  let command = `git commit -m '${message}'`
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
  childProcess.execSync('git config push.default current');
  childProcess.exec(command, (err, stdout, stderr) => {
    if ( !err ) {
      stdout = stderr;
      stderr = null;
    }
    callback(err, stdout)
  })
}

const _getCurentVersion = (callback) => {
  let path = process.cwd() + '/package.json';
  let stats = fs.statSync(path);
  if ( stats.isFile() ) {
    let packageInfo = JSON.parse( fs.readFileSync(path) );
    return packageInfo.version;
  }
}

const _generateTag = (argv) => {
  let currentVersion = argv.version || _getCurentVersion();
  if ( currentVersion ) {
    currentVersion = currentVersion.split('+');
    let semverVersion = _transformSemver(currentVersion[0], argv.part);

    if ( currentVersion[1] ) {
      semverVersion = semverVersion + '+' + _transformSemver(currentVersion[1]);
    }

    return semverVersion;
  }
  return ''
}

const _generateTagWithInput = (argv) => {
  let version = argv.version;
  let currentVersion = _getCurentVersion().split('+');
  if ( argv.timeTag ) {
    version = argv.version + '+' + _transformDate(currentVersion[1]);
  }
  return version;
}

const _gitTagPush = (tag, callback) => {
  let command = `git push origin '${tag}'`;
  console.log(`>>> Exec ${command} at ${process.cwd()}`);
  childProcess.exec(command, (e, stdout, stderr) => {
    if ( e ) {
      stdout = stderr
      stderr = null;
    }
    callback(e, stdout);
  })
}

const _changePackage = (tag, callback) => {
  let path = process.cwd() +  '/package.json';
  let stats = fs.statSync(path);
  if(stats.isFile()){
      let packageInfo = JSON.parse(fs.readFileSync(path));
      packageInfo.version = tag;
      fs.writeFileSync(path, JSON.stringify(packageInfo, null, '  '));

      childProcess.execSync('git config push.default current');
      let command = `git add . && git commit -m \'chore(package.json): updaten version to ${tag} by git\' && git push`;
      console.log(`>>> Exec ${command}`);
      childProcess.exec(command, function(err, stdout, stderr){
          if(!err){
              stderr = null;
          }
          callback(err, stdout);
      });
  }
}

module.exports = {
  gitCommit:  _gitCommit,
  gitPush: _gitPush,
  gitAdd: _gitAdd,
  gitTagAdd: _gitTagAdd,
  gitTagPush: _gitTagPush,
  getCurentVersion: _getCurentVersion,
  generateTag: _generateTag,
  generateTagWithInput: _generateTagWithInput,
  changePackage: _changePackage
}