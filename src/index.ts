'use strict';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as rx from 'rx';
import * as ts from "typescript";
import * as Linter from 'tslint';
import {ILinterOptions} from 'tslint/lib/lint';
import {RuleFailure} from "tslint/lib/language/rule/rule";

import * as CodeClimate from './codeclimate-definitions';
import {CodeClimateConverter} from './codeclimate-converter';

let options: ILinterOptions = {
  formatter: "json",
  configuration: {
    rules: {
      "variable-name": true,
      "quotemark": [true, "double"]
    }
  },
  rulesDirectory: "customRules/", // can be an array of directories
  formattersDirectory: "customFormatters/"
};

interface CodeClimateEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
}

interface FileListBuilder {
  (extensions: string[]): rx.Observable<string>;
}

function isFileWithMatchingExtension(file: string, extensions: string[]): boolean {
  var stats = fs.lstatSync(file);
  var extension = "." + file.split(".").pop();
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
    let expandedExcludePaths: string[] = _.flatten(excludePaths.map(path => glob.sync(`/code/${path}`)));
    var allFiles = glob.sync("/code/**/**");
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
    let expandedIncludePaths: string[] = _.flatten(includePaths.map(path => glob.sync(`/code/${path}`)));
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
    .map<CodeClimateEngineConfig>((buffer: Buffer) => !!buffer ? JSON.parse(buffer.toString("utf-8")) : {})
    .map<FileListBuilder>((engineConfig: CodeClimateEngineConfig) =>
      engineConfig.include_paths ?
        inclusionBasedFileListBuilder(engineConfig.include_paths):
        exclusionBasedFileListBuilder(engineConfig.exclude_paths || [])
    )
  ;
}

function processFile(fileName: string): void {
  let contents = fs.readFileSync(fileName, "utf8");
  let linter = new Linter(fileName, contents, options);
  let converter = new CodeClimateConverter();
  linter.lint().failures
    .map(converter.convert)
    .map(JSON.stringify)
    .map(json => `${json}\u0000`)
    .forEach(output => console.log(output))
  ;
}

loadConfig("/config.json")
  .flatMap((builder: FileListBuilder) => builder(['.ts']))
  .subscribe(processFile)
;
