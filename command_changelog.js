const co = require('co');
const fs =require('fs');
const thunkify = require('thunkify');
const semver = require('semver');
const path = require('path');
const childProcess = require('child_process');
const exec = childProcess.exec;

const logPath = 'log.md';

const isSemver = (tag) =>
  semver.valid(tag);

const splitTag = (a) =>
  tag.replace(/^v/, '').split('.').map((n) => parseInt(n));

const sortTag = (a, b) =>
  semver.gt(a, b);

const lastSemverTag = (tags) => {
  console.log(tags);
  let tag = tags.filter(isSemver).sort(sortTag)[0];
  if (!tag) {
    console.log('tag需符合semver规则'.red);
    process.exit();
  }
  return tag
}

const filterTagStringToLatest = (tags) =>
  lastSemverTag(tags.split('\n'));


const latestTag = (next) => {
  exec('git tag', (err, tags) => {
    next(err, filterTagStringToLatest(tags))
  })
}

const parseLog = (log) => log.split('\n')


const changelog = (tag, next) => {
  const range = tag + '..HEAD';
  exec(`git log --no-merges --oneline ${range}`,
    (err, log) => next(err, parseLog(log)))
}

const formatTime = (date) =>
  date.toLocaleString('zh-CN', { hour12: false })
    .replace(/\//g, '-').replace(/\b\d\b/g, '0$&');

const formatLog = (tag, log) => {
  const title = `[${tag}](../../releases/tag/${tag})     ${formatTime(new Date())}`;

  const dashes = title.replace(/./g, '-');
  console.log(log);
  log = log.map(function (subject) {
    return subject.replace(/^([a-f|0-9]+)/, '[$1](../../commit/$1)')
  });

  log = '- ' + log.join('\n- ');
  let src = title + '\n' + dashes + '\n\n';
  src += log;
  return src;
}

const writeLog = (log) => {
  if (fs.existsSync(logPath)) {
    log += '\n\n\n';
    log += fs.readFileSync(logPath).toString();
}
fs.writeFileSync(logPath, log);
}

const main = (newTag) => {
  return co(function *() {
    // 获取最新tag
    const tag = yield thunkify(latestTag)();
    // 获取log
    const log = yield thunkify(changelog)(tag);
    // 优化log 信息
    const formatedLog = formatLog(newTag, log);

    writeLog(formatedLog);

    console.log('输出日志');
  }).catch(e => {
    console.log(e);
  })
}

module.exports = main;