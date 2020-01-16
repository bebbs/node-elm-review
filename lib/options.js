// @flow
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');
const minimist = require('minimist');
const packageJson = require('../package.json');
const errorMessage = require('./error-message');

function compute(processArgv) {
  const args = minimist(processArgv.slice(2), {
    alias: {
      help: 'h',
      version: 'v'
    },
    boolean: ['version', 'help', 'debug', 'fix', 'watch']
  });

  const elmJsonPath = args.elmjson || findUp.sync('elm.json');

  function projectToReview() {
    if (!elmJsonPath) {
      throw new Error(
        /* eslint-disable prettier/prettier */
        errorMessage(
          'COULD NOT FIND ELM.JSON',
          `I was expecting to find an ${chalk.yellowBright('elm.json')} file in the current directory or one of its parents, but I did not find one.

  If you wish to run elm-review from outside your project,
  try re-running it with ${chalk.cyan('--elmjson <path-to-elm.json>')}.`
        )
        /* eslint-enable prettier/prettier */
      );
    }

    return path.dirname(elmJsonPath);
  }

  function userSrc() {
    return args.config
      ? path.join(process.cwd(), args.config)
      : path.join(projectToReview(), 'review');
  }

  return {
    debug: args.debug,
    version: args.version,
    help: args.help,
    fix: args.fix,
    watch: args.watch,
    color: args.color,
    subcommand: args._[0] === 'init' ? 'init' : null,
    compiler: args.compiler,
    elmFormatPath: args['elm-format-path'],
    packageJsonVersion: packageJson.version,

    // PATHS - REVIEW APPLICATION

    userSrc,
    userElmJsonPath: () => path.join(userSrc(), 'elm.json'),
    pathToApplicationDirectory: applicationHash =>
      path.join(
        projectToReview(),
        'elm-stuff',
        'generated-code',
        'jfmengels',
        'elm-review',
        packageJson.version,
        'review-applications',
        applicationHash
      ),

    // PATHS - THINGS TO REVIEW

    elmJsonPath,
    projectToReview,
    directoriesToAnalyze: args._,
    fileCachePath: () =>
      path.join(
        projectToReview(),
        'elm-stuff',
        'generated-code',
        'jfmengels',
        'elm-review',
        packageJson.version,
        'file-cache'
      )
  };
}

module.exports = {
  compute
};