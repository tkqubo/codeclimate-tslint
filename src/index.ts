'use strict';
import * as Linter from 'tslint';
import * as Promise from 'bluebird';
import * as fs from 'fs';

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


// a wrapper for emitting perf timing
function runWithTiming<T>(name: string, done: (callback: (result: T) => void) => void): Promise<T> {
  let start = new Date();
  return new Promise<T>((resolve, reject) => {
    done((result: T) => {
      let duration = (new Date().getTime() - start.getTime()) / 1000;
      console.error(`tslint.timing.${name}: ${duration}s`);
      resolve(result);
    });
  });
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

function loadConfig(configFileName: string): Promise<CodeClimateEngineConfig> {
  return runWithTiming<FileListBuilder>("engineConfig", (callback: (result: FileListBuilder) => void) =>
    fs.readFile(configFileName, (err, buffer) => {
      var engineConfig: CodeClimateEngineConfig = !!buffer ? JSON.parse(buffer.toString("utf-8")) : {};
      if (engineConfig.include_paths) {
        callback(inclusionBasedFileListBuilder(engineConfig.include_paths));
      } else {
        callback(exclusionBasedFileListBuilder(engineConfig.exclude_paths || []));
      }
    })
  )
}

function listFiles(builder: FileListBuilder): Promise<string[]> {
  return runWithTiming<string[]>("buildFileList", (callback => {
    callback(builder());
  }));
}

function processFile(fileName: string): void {
  let contents = fs.readFileSync(fileName, "utf8");
  let linter = new Linter(fileName, contents, options);
  let result = linter.lint();
  console.log(result);
}

loadConfig("/config.json")
  .then(listFiles)
  .then(files => files.forEach(processFile));
