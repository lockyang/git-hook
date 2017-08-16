'use strict';

const inquirer = require('inquirer');
const colors = require('colors');
const thunkify = require('thunkify');
const co = require('co');
const git = require('./lib/git');

const promptMessage = `${colors.red('git-commit-push')}: `;

const emojiList = {
  Bugfix: '🐛 [bug] ',
  NewFeature: '✨  [feature] ',
  Documentation: '📚  [document] ',
  Refactoring: '📦  [refact] ',
  Tooling: '🔧  [config] ',
}

const schemaEmoji = [{
  type: 'list',
  name: 'emoji',
  message: promptMessage + 'git提交修改的类型',
  default: 'Bugfix',
  choices: [{
    'name': '🐛  bug',
    'value': 'Bugfix'
  }, {
    'name': '✨  新特性',
    'value': 'NewFeature'
  }, {
    name: '📚  文档',
    value: 'Documentation'
  }, {
    name: '📦  重构',
    value: 'Refactoring'
  }, {
    name: '🔧  配置',
    value: 'Tooling'
  }]
}];

const schemaMessage = [{
  type: 'input',
  name: 'message',
  message: promptMessage + 'commit 描述信息',
  validate: function(value) {
      if (!value) {
          return 'commit 描述信息不能为空';
      }
      return true;
  }
}];

const schema = [{
  type: 'confirm',
  name: 'confirm',
  message: promptMessage + '是否 push commit 到远端',
  default: true
}];

const main = () => {
  co(function *() {
    yield *submit();
    yield *push();
    console.log('😁 Successful Push!');
  }).catch(err => {
    console.log(err);
    console.error('😟  ' + err.message.red);
  })
}

function *submit () {

  yield thunkify(git.gitAdd)();

  const emojiObj = yield inquirer.prompt(schemaEmoji);

  const messageObj = yield inquirer.prompt(schemaMessage);

  yield thunkify(git.gitCommit)(`${emojiList[emojiObj.emoji]}${messageObj.message}`);

  console.log('>>> git commit 提交成功');

}

function *push () {

  const result = yield inquirer.prompt(schema);

  if ( result.confirm ) {
    yield thunkify(git.gitPush);
    console.log('>>> commit 成功推送到远端'.green);
  }

}

module.exports = main;
