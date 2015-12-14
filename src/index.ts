'use strict';
import * as Linter from 'tslint';
import * as fs from 'fs';
import * as rx from 'rx';

let configuration = {
  rules: {
    "variable-name": true,
    "quotemark": [true, "double"]
  }
};
let options = {
  formatter: "json",
  configuration: configuration,
  rulesDirectory: "customRules/", // can be an array of directories
  formattersDirectory: "customFormatters/"
};

interface CodeClimateEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  config?: {
    debug?: boolean;
  }
}

interface FileListBuilder {
  (): string[];
}

function inclusionBasedFileListBuilder(paths: string[]): FileListBuilder {
  return () => ['src/index.ts'];
}

function exclusionBasedFileListBuilder(paths: string[]): FileListBuilder {
  return () => ['src/index.ts'];
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
  let result = linter.lint();
  console.log(result);
}

loadConfig("/config.json")
  .flatMap((builder: FileListBuilder) => builder())
  .subscribe(processFile)
;
