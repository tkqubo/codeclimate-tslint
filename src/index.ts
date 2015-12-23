import {IRule} from 'tslint/lib/language/rule/rule';
'use strict';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as rx from 'rx';
import * as ts from 'typescript';
import * as Linter from 'tslint';
import {ILinterOptions} from 'tslint/lib/lint';
import {RuleFailure} from 'tslint/lib/language/rule/rule';

import * as CodeClimate from './codeclimate-definitions';
import {CodeClimateConverter} from './codeclimate-converter';

const DefaultTsLintFile = './tslint.json';
const ConfigFile = '/config.json';
const CodeDirectoryBase = '/code/';

interface CodeClimateEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  rules?: any;
}

type FileListBuilder = (extensions: string[]) => rx.Observable<string>

function isFileWithMatchingExtension(file: string, extensions: string[]): boolean {
  var stats = fs.lstatSync(file);
  var extension = '.' + file.split('.').pop();
  return (
    stats.isFile() &&
    !stats.isSymbolicLink()
    && extensions.indexOf(extension) >= 0
  );
}

function prunePathsWithinSymlinks(paths: string[]): string[] {
  var symlinks = paths.filter((path) => fs.lstatSync(path).isSymbolicLink());
  return paths.filter(path => symlinks.every(symlink => path.indexOf(symlink) != 0));
}

function exclusionBasedFileListBuilder(excludePaths: string[]): FileListBuilder {
  return (extensions: string[]): rx.Observable<string> => {
    // lodash currently cannot chain `flatten()`
    let expandedExcludePaths: string[] = _.flatten(excludePaths.map(path => glob.sync(`${CodeDirectoryBase}${path}`)));
    var allFiles = glob.sync(`${CodeDirectoryBase}**/**`);
    return rx.Observable
      .fromArray(prunePathsWithinSymlinks(allFiles))
      .filter(file => expandedExcludePaths.indexOf(file) === -1)
      .filter(file => fs.lstatSync(file).isFile())
      .filter(file => isFileWithMatchingExtension(file, extensions))
    ;
  };
}

function inclusionBasedFileListBuilder(includePaths: string[]): FileListBuilder {
  return (extensions: string[]): rx.Observable<string> => {
    // lodash currently cannot chain `flatten()`
    let expandedIncludePaths: string[] = _.flatten(includePaths.map(path => glob.sync(`${CodeDirectoryBase}${path}`)));
    // currently rxjs cannot use partition
    let [directories, files] = _.partition(expandedIncludePaths, file => fs.lstatSync(file).isDirectory());

    return rx.Observable
      .fromArray(directories)
      .map(directory => glob.sync(`${directory}/**/**`))
      .flatMap(prunePathsWithinSymlinks)
      .concat(rx.Observable.fromArray(files))
      .filter(file => isFileWithMatchingExtension(file, extensions))
    ;
  };
}

function loadConfig(configFileName: string): rx.Observable<CodeClimateEngineConfig> {
  return rx.Observable
    .fromNodeCallback(fs.readFile)(configFileName)
    .catch((err: Error) => rx.Observable.return(null))
    .map<CodeClimateEngineConfig>((buffer: Buffer) => !!buffer ? JSON.parse(buffer.toString('utf-8')) : {})
  ;
}

function filesAndOptions(engineConfig: CodeClimateEngineConfig): rx.Observable<[string, ILinterOptions]> {
  let builder: FileListBuilder = engineConfig.include_paths ?
    inclusionBasedFileListBuilder(engineConfig.include_paths):
    exclusionBasedFileListBuilder(engineConfig.exclude_paths || []);
  return builder(['.ts'])
    .map<[string, ILinterOptions]>(file => [file, linterOption(engineConfig)]);
}

function linterOption(engineConfig: CodeClimateEngineConfig): ILinterOptions {
  return {
    formatter: 'json',
    configuration: {
      rules: engineConfig.rules || JSON.parse(fs.readFileSync(DefaultTsLintFile).toString()).rules
    },
    formattersDirectory: 'customRules/',
    rulesDirectory: 'customFormatters/'
  }
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
  .flatMap(filesAndOptions)
  .subscribe(arg => processFile(arg[0], arg[1]))
;
