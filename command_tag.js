const co = require('co');
const colors = require('colors');
const inquirer = require('inquirer');
const thunkify = require('thunkify');

const git = require('./lib/git');
const commandChangelog = require('./command_changelog');

const promptMessage = `${colors.red('git-tag')}: `;

const reVersion = () => {
  let schema = [{
    type: 'input',
    name: 'version',
    message: promptMessage + 'semver 规范的版本号',
    validate: function (val) {
      if (!/^\d+\.\d+\.\d+$/.test(value)) {
        return '[X] 格式如 ${major}.${feature}.${patch} (请遵循 semver 规范)'.red;
      }

      let res = git.versionValidate(currentVersionWithoutTag, value);
      if (res.pass) {
          return true;
      } else {
          return '[X] '.red + res.message.red;
      }
    }
  }];

  inquirer.prompt(schema).then((result) => {
    generateNewTag(require.version)
  })
}

const generateVersion = (currentVersionWithoutTag) => {
  let versionNextSuggest = {
    mojor: git.generateTag({
      version: currentVersionWithoutTag,
      part: 'major'
    }),
    feature: git.generateTag({
      version: currentVersionWithoutTag,
      part: 'feature'
    }),
    patch: git.generateTag({
      version: currentVersionWithoutTag,
      part: 'patch'
    })
  }
  console.log(versionNextSuggest);
  let schema = [{
    type: 'list',
    name: 'version',
    message: `${promptMessage}${colors.gray('semver 规范的版本号:')}`,
    default: versionNextSuggest.patch,
    choices: [{
      short: '自定义',
      name: '自定义\n' +
          colors.gray('  - 格式如 ${major}.${feature}.${patch}(请遵循 semver 规范)'),
      value: false
    }, {
      short: versionNextSuggest.path,
      name: 'patch   (' + versionNextSuggest.patch + ')\n' +
          colors.gray('  - 递增修订版本号'),
      value: versionNextSuggest.patch
    }, {
      short: versionNextSuggest.feature,
      name: 'feature (' + versionNextSuggest.feature + ')\n' +
          colors.gray('  - 递增特性版本号'),
      value: versionNextSuggest.feature
    }, {
      short: versionNextSuggest.major,
      name: 'major   (' + versionNextSuggest.mojor + ')\n' +
          colors.gray('  - 递增主版本号'),
      value: versionNextSuggest.mojor
    }]
  }]

  inquirer.prompt(schema).then((res) => {
    if (!res.version) {
      reVersion();
    } else {
      generateNewTag(res.version);
    }
    // generateNewTag(result.version);
  })
}

const generateNewTag = (version) => {
  let schema = [{
    type: 'confirm',
    name: 'timeTag',
    message: '是否添加发布次数 tag ',
    default: false
  }];

  inquirer.prompt(schema).then((res) => {
    let tag = git.generateTagWithInput({
      version: version,
      timeTag: res.timeTag
    });
    tagConfirm(tag);
  })
}

function *gitTagAdd (tag) {
  let schema = [{
    type: 'confirm',
    name: 'confirm',
    message: promptMessage + '是否执行 git tag add 命令',
    default: true
  }];

  const result = yield inquirer.prompt(schema);
  if (result.confirm) {
    let schema = [{
      type: 'input',
      name: 'message',
      message: promptMessage + 'tag 描述信息',
      validate: function (value) {
        if (!value) {
          return 'tag 描述信息不能为空';
        }
        return true;
      }
    }];

    const result = yield inquirer.prompt(schema);
    yield thunkify(git.gitTagAdd)(tag, result.message);
    console.log('>>> git tag 添加成功!'.green);
  }
}

function *gitTagPush (tag) {
  let schema = [{
    type: 'confirm',
    name: 'confirm',
    message: promptMessage + '是否 push tag 到远端',
    default: true
  }];

  const result = yield inquirer.prompt(schema);
  if (result.confirm) {
    yield thunkify(git.gitTagPush)(tag);
    console.log('>>> tag 成功推送到远端!'.green);
  }
}

function* editChangeLog(tag) {
  let schema = [{
    type: 'confirm',
    name: 'confirm',
    message: promptMessage + '是否记录commit信息到 CHANGELOG.md',
    default: true
  }];

  const result = yield inquirer.prompt(schema);
  if (result.confirm) {
    yield commandChangelog(tag);
    console.log('>>> CHANGELOG.md 更改成功'.green);
  }
}

// 修改package
function *editPackage(newTag) {
  yield thunkify(git.changePackage)(newTag);
  console.log('>>> package.json 更改成功'.green);
}

const tagConfirm = (tag) => {
  console.log(`新版 tag: ${tag.white}`.green);
  console.log(gitTagAdd);
  co(function *() {
    yield editChangeLog(tag);
    yield editPackage(tag);
    yield gitTagAdd(tag);
    yield gitTagPush(tag);
    console.log('git push tag 成功');
  }).catch( e => {
    console.log('' + e.message.red);
  })
}

const main = () => {
  let currentVersion = '';
  let currentVersionWithoutTag = '';

  try {
    currentVersion = git.getCurentVersion();
    let currentVersionArr = currentVersion.split('+');
    currentVersionWithoutTag = currentVersionArr[0]

    generateVersion(currentVersionWithoutTag);
    console.log(`当前版本: ${currentVersion.bgRed.bold }`)

  } catch (e) {
    console.log(`当前目录：${process.cwd()}，不存在 package.json 文件，请到 package.json 文件所在目录执行命令`.red);
    process.exit(1);
  }
}

module.exports = main;
