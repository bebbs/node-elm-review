// @flow
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');
const minimist = require('minimist');
const packageJson = require('../package.json');
const errorMessage = require('./error-message');

/*
These contain all the options that derive what and how elm-review will behave.

Some of these options are not documented in `--help`.
DO NOT DEPEND ON THEM!
They might get removed at any point.
Open an issue if you have a need for them, so that we can discuss what the best
option is and how to get forward.
 */

const availableSubcommands = ['init', 'new-package', 'new-rule'];

function compute(processArgv /* : Array<string> */) {
  const args = minimist(processArgv.slice(2), {
    alias: {
      help: 'h',
      version: 'v'
    },
    boolean: [
      'version',
      'help',
      'debug',
      'details',
      'fix',
      'fix-all',
      'fix-all-without-prompt',
      'watch',
      'ignore-problematic-dependencies'
    ],
    default: {
      details: true
    }
  });

  const subcommand =
    availableSubcommands.find((subcmd) => subcmd === args._[0]) || null;

  const elmJsonPath = findElmJsonPath(args, subcommand);
  const readmePath =
    elmJsonPath && path.join(path.dirname(elmJsonPath), 'README.md');

  function initPath() {
    if (args.config) {
      return path.resolve(process.cwd(), args.config);
    }

    try {
      return path.join(projectToReview(), 'review');
    } catch (_) {
      return path.join(process.cwd(), 'review');
    }
  }

  function projectToReview() {
    if (!elmJsonPath) {
      throw new errorMessage.CustomError(
        /* eslint-disable prettier/prettier */
'COULD NOT FIND ELM.JSON',
`I was expecting to find an ${chalk.yellowBright('elm.json')} file in the current directory or one of its parents, but I did not find one.

If you wish to run elm-review from outside your project,
try re-running it with ${chalk.cyan('--elmjson <path-to-elm.json>')}.`,
path.relative(process.cwd(), 'elm.json')
        /* eslint-enable prettier/prettier */
      );
    }

    return path.dirname(elmJsonPath);
  }

  function userSrc() {
    return args.config
      ? path.resolve(process.cwd(), args.config)
      : path.join(projectToReview(), 'review');
  }

  const namespace = args.namespace || 'cli';
  const elmStuffFolder = () =>
    path.join(
      projectToReview(),
      'elm-stuff',
      'generated-code',
      'jfmengels',
      'elm-review',
      namespace,
      packageJson.version
    );

  return {
    debug: args.debug,
    version: args.version,
    help: args.help,
    fix: args.fix,
    fixAll: args['fix-all'] || args['fix-all-without-prompt'],
    fixAllWithoutPrompt: args['fix-all-without-prompt'],
    detailsMode: args.details === false ? 'without-details' : 'with-details',
    watch: args.watch,
    color: args.color,
    subcommand,
    namespace,
    compiler: args.compiler,
    elmFormatPath: args['elm-format-path'],
    packageJsonVersion: packageJson.version,
    localElmReviewSrc: process.env.LOCAL_ELM_REVIEW_SRC,
    report: args.report,

    // TEMPORARY WORKAROUNDS
    ignoreProblematicDependencies: args['ignore-problematic-dependencies'],

    // NEW RULE
    newRuleName: args._[1] || null,

    // PATHS - REVIEW APPLICATION

    userSrc,
    initPath,
    elmModulePath: (appHash /* : string */) =>
      path.join(elmStuffFolder(), 'review-applications', `${appHash}.js`),
    pathToApplicationDirectory: (appHash /* : string */) =>
      path.join(elmStuffFolder(), 'review-applications', appHash),
    dependenciesCachePath: () =>
      path.join(elmStuffFolder(), 'dependencies-cache'),

    // PATHS - THINGS TO REVIEW
    elmJsonPath,
    elmJsonPathWasSpecified: Boolean(args.elmjson),
    readmePath,
    projectToReview,
    directoriesToAnalyze: args._,
    fileCachePath: () => path.join(elmStuffFolder(), 'file-cache')
  };
}

function findElmJsonPath(args, subcommand) {
  if (args.elmjson) return args.elmjson;
  // Shortcutting the search for elm.json when `--help` since we won't need it
  if (args.help) return null;
  // Same when a subcommand is used, since we won't need it.
  if (subcommand && subcommand !== 'new-rule') return null;
  return findUp.sync('elm.json');
}

module.exports = {
  compute
};
