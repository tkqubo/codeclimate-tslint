'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as rx from 'rx';
import * as Linter from 'tslint';
import * as _ from 'lodash';
import {ILinterOptions} from 'tslint/lib/lint';
import {FileMatcher} from './fileMatcher';
import * as CodeClimate from './codeclimateDefinitions';
import {CodeClimateConverter} from './codeclimateConverter';

const DefaultTsLintFile = '/usr/src/app/tslint.json';
const ConfigFile = '/config.json';
const CodeDirectoryBase = '/code/';

interface CodeClimateTslintEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  rules?: any;
}

const DefaultExcludePaths: string[] = [
  'node_modules',
  'typings'
];

function loadConfig(): CodeClimateTslintEngineConfig {
  let codeClimateConfig: CodeClimate.Config = JSON.parse(fs.readFileSync(ConfigFile).toString('utf-8'));
  let config: CodeClimateTslintEngineConfig = {};

  // resolve rules
  let tslintFileName: string = _.find([
    path.join(CodeDirectoryBase, codeClimateConfig.config),
    path.join(CodeDirectoryBase, 'tslint.json'),
    DefaultTsLintFile
  ], file => fs.existsSync(file));
  config.rules = JSON.parse(fs.readFileSync(tslintFileName).toString('utf-8')).rules;

  // resolve paths setting
  if (codeClimateConfig.include_paths) {
    config.include_paths = codeClimateConfig.include_paths;
  } else {
    config.exclude_paths = DefaultExcludePaths;
  }

  return config;
}

function listFiles(config: CodeClimateTslintEngineConfig): rx.Observable<string> {
  let matcher = new FileMatcher(CodeDirectoryBase, ['.ts']);
  return config.include_paths ?
    matcher.inclusionBasedFileListBuilder(config.include_paths) :
    matcher.exclusionBasedFileListBuilder(config.exclude_paths || []);
}

function buildLinterOption(config: CodeClimateTslintEngineConfig): ILinterOptions {
  return {
    formatter: 'json',
    configuration: {
      rules: config.rules
    },
    formattersDirectory: 'customRules/',
    rulesDirectory: 'customFormatters/'
  }
}

function processFile(fileName: string, options: ILinterOptions): void {
  let contents = fs.readFileSync(fileName, 'utf8');
  let linter = new Linter(fileName, contents, options);
  let converter = new CodeClimateConverter();
  try {
    linter.lint().failures
      .map(converter.convert)
      .map(JSON.stringify)
      .map(json => `${json}\u0000`)
      .forEach(output => console.log(output))
    ;
  } catch (e) {
    let issue = CodeClimate.createIssueFromError(e);
    console.log(JSON.stringify(issue) + '\u0000');
  }
}

let config: CodeClimateTslintEngineConfig = loadConfig();
let linterOptions: ILinterOptions = buildLinterOption(config);
listFiles(config)
  .map(file => processFile(file, linterOptions))
  .subscribe()
;
