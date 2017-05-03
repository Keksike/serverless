'use strict';
const chalk = require('chalk');
const _ = require('lodash');
const version = require('./../../package.json').version;

const log = (msg, color) => {
  /* eslint-disable no-console */
  switch (color) {
    case 'yellow':
      console.log(chalk.yellow(msg));
      break;
    case 'blue':
      console.log(chalk.blue(msg));
      break;
    case 'red':
      console.log(chalk.red(msg));
      break;
    default:
      console.log(msg);
  }
  /* eslint-enable no-console */
};

/**
 * Pads a string to a fixed length with 2 spaces on left and dashes on right, e.g.:
 *
 * "Foobar"
 * with TITLE_LENGTH = 15 ->
 * "  Foobar ------"
 *
 * @param titleStr String which will be padded with space on left and dash on right.
 * @return String Padded string.
 */
const padTitle = (titleStr) => {
  const TITLE_LENGTH = 60;
  return _.padEnd(`  ${titleStr} `, TITLE_LENGTH, '-');
};

/**
 * Breaks sentences with newlines if sentence length reaches over lineLength-param.
 * Also left-pads each line with spaces. E.g.:
 *
 * wordWrap('foo bar baz foobar', 8, 3) ->
 * '  foo bar\n  baz foobar'
 *
 * @param sentence Sentence, which will be broken into lines and padded.
 * @param lineLength max length of a single line (determines when sentence is broken).
 * @param leftMarginLength length of spaces before each new line.
 * @return String Sentence with newlines (\n) and margins.
 */
const wordWrap = (sentence, lineLength, leftMarginLength) => {
  let wrappedString = '';

  let logLine = [];
  _.words(sentence, /[^, ]+/g).forEach(word => {
    logLine.push(word);
    const logLineString = logLine.join(' ');
    if (logLineString.length > lineLength) {
      wrappedString += `${_.padStart(' ', leftMarginLength, ' ')}${logLineString}\n`;
      logLine = [];
    }
  });

  if (logLine.length !== 0) {
    wrappedString += `${_.padStart(' ', leftMarginLength, ' ')}${logLine.join(' ')}\n`;
  }

  return wrappedString;
};

const logErrMessage = (errType, errMessage) => {
  log(`${padTitle(errType)}\n`, 'yellow');
  log(wordWrap(errMessage, 50, 5), 'yellow');
};

const logSupportMessage = () => {
  log(padTitle('Get Support'), 'yellow');
  log(
    `     Docs:          ${chalk.white('docs.serverless.com')}\n` +
    `     Bugs:          ${chalk.white('github.com/serverless/serverless/issues')}\n` +
    `     Forums:        ${chalk.white('forum.serverless.com')}\n` +
    `     Chat:          ${chalk.white('gitter.im/serverless/serverless')}\n`, 'yellow');
};

const logEnvMessage = (envInfo) => {
  log(padTitle('Your Environment Information'), 'yellow');
  log(
    `     OS:                 ${envInfo.OS}\n` +
    `     Node Version:       ${envInfo.nodeVersion}\n` +
    `     Serverless Version: ${envInfo.serverlessVersion}\n`
  , 'yellow');
};

const logStackTrace = (stackTrace) => {
  log(padTitle('Stack Trace'), 'yellow');
  log(stackTrace);
};

const logDebugMessage = () => {
  log(
    '\n' +
    ' For debugging logs, run again after setting the' +
    ' "SLS_DEBUG=*" environment variable.\n'
  , 'red');
};

module.exports.ServerlessError = class ServerlessError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'Serverless Error';
    this.message = message;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
};

// Deprecated - use ServerlessError instead
module.exports.SError = module.exports.ServerlessError;

module.exports.getErrorObject = (e) => {
  let errorData;

  try {
    errorData = {
      type: e.name,
      message: e.message,
    };

    if (process.env.SLS_DEBUG) errorData.stackTrace = e.stack;

    const envData = {
      OS: process.platform,
      nodeVersion: process.version.replace(/^[v|V]/, ''),
      serverlessVersion: version,
    };

    return {error: errorData, env: envData};

  } catch (errorHandlingError) {
    throw new Error(e);
  }
};

module.exports.logError = (eObj, outputFormat) => {
  if(outputFormat == 'json') {
    log(eObj);
  } else {
    logErrMessage(eObj.error.type, eObj.error.message);

    if (eObj.error.type !== 'Serverless Error') {
      logDebugMessage();
    }

    if (process.env.SLS_DEBUG) {
      logStackTrace(e.stack);
    }

    logSupportMessage();
    logEnvMessage(eObj.env);
  }

  // Failure exit
  process.exit(1);
};

module.exports.logWarning = (message) => {
  logErrMessage('Serverless Warning', message);
};