#!/usr/bin/env node
'use strict';

const co = require('co');
const inquirer = require('inquirer');
const path = require('path')

const commandCommit = require('./command_commit.js');

const main = () => {
  let schema = [{
    /**
     * type: (String) Type of the prompt.
     *
     * Defaults: input
     * Possible values: input, confirm, list, rawlist, expand, checkbox, password, editor
     */
    type: 'list',
    /**
     * (String) The name to use when storing the answer in the answers hash.
     *
     * If the name contains periods, it will define a path in the answers hash.
     */
    name: 'command',
    /**
     * (String|Function) The question to print.
     *
     * If defined as a function,
     * the first parameter will be the current inquirer session answers.
     */
    message: '选择Git命令',
    choices: [{
      'name': '提交代码到当前分支',
      'value': 'commit'
    }]
  }];

  co(function *() {
    let result = yield inquirer.prompt(schema);
    switch (result.command) {
      case 'commit':
        // commit Command
        commandCommit();
        break;
    }
  })

}

main();