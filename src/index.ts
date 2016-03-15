'use strict';
import * as fs from 'fs';
import * as rx from 'rx';
import * as Linter from 'tslint';
import {ILinterOptions} from 'tslint/lib/lint';
import {FileMatcher} from './fileMatcher';
import {CodeClimateConverter} from './codeclimateConverter';

const DefaultTsLintFile = '/usr/src/app/tslint.json';
const ConfigFile = '/config.json';
const CodeDirectoryBase = '/code/';

interface CodeClimateEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  rules?: any;
}

const DefaultExcludePaths: string[] = [
  'node_modules',
  'typings'
];

function loadConfig(configFileName: string): rx.Observable<CodeClimateEngineConfig> {
  return rx.Observable
    .fromNodeCallback(fs.readFile)(configFileName)
    .catch((err: Error) => rx.Observable.return(null))
    .map<CodeClimateEngineConfig>((buffer: Buffer) => !!buffer ? JSON.parse(buffer.toString('utf-8')) : {})
    .map<CodeClimateEngineConfig>((config: CodeClimateEngineConfig) => {
      if (!config.include_paths && !config.exclude_paths) {
        config.exclude_paths = DefaultExcludePaths;
      }
      return config;
    })
  ;
}

function listFiles(engineConfig: CodeClimateEngineConfig): rx.Observable<string> {
  let matcher = new FileMatcher(CodeDirectoryBase, ['.ts']);
  return engineConfig.include_paths ?
    matcher.inclusionBasedFileListBuilder(engineConfig.include_paths) :
    matcher.exclusionBasedFileListBuilder(engineConfig.exclude_paths || []);
}

function buildLinterOption(engineConfig: CodeClimateEngineConfig): ILinterOptions {
  return {
    formatter: 'json',
    configuration: {
      rules: engineConfig.rules || JSON.parse(fs.readFileSync(DefaultTsLintFile).toString()).rules
    },
    formattersDirectory: 'customRules/',
    rulesDirectory: 'customFormatters/'
  }
}

function listFilesWithOptions(engineConfig: CodeClimateEngineConfig): rx.Observable<[string, ILinterOptions]> {
  var observableString = listFiles(engineConfig);
  let options = buildLinterOption(engineConfig);
  return observableString
    .map<[string, ILinterOptions]>(file => [file, options]);
}

function processFile(fileName: string, options: ILinterOptions): void {
  let contents = fs.readFileSync(fileName, 'utf8');
  let linter = new Linter(fileName, contents, options);
  let converter = new CodeClimateConverter();
  linter.lint().failures
    .map(converter.convert)
    .map(JSON.stringify)
    .map(json => `${json}\u0000`)
    .forEach(output => console.log(output))
  ;
}

loadConfig(ConfigFile)
  .flatMap(listFilesWithOptions)
  .toArray()
  .subscribe((args: [string, ILinterOptions][]) => {
    args.forEach((arg: [string, ILinterOptions]) => processFile(arg[0], arg[1]));
    if (args.length) {
      process.exit(1);
    }
  })
;
