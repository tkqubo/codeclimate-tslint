'use strict';
import * as Linter from 'tslint';
import * as fs from 'fs';
import * as glob from 'glob';
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
  (extensions: string[]): string[];
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
  // Extracts symlinked paths and filters them out, including any child paths
  var symlinks = paths.filter((path) => fs.lstatSync(path).isSymbolicLink());
  return paths.filter(path => symlinks.every(symlink => path.indexOf(symlink) != 0));
}

function exclusionBasedFileListBuilder(excludePaths: string[]): FileListBuilder {
  // Uses glob to traverse code directory and find files to analyze,
  // excluding files passed in with by CLI config, and including only
  // files in the list of desired extensions.
  //
  // Deprecated style of file expansion, supported for users of the old CLI.
  return (extensions: string[]) => {
    var allFiles = glob.sync("/code/**/**", {});
    return prunePathsWithinSymlinks(allFiles)
      .filter(file => excludePaths.indexOf(file.split("/code/")[1]) < 0)
      .filter(file => fs.lstatSync(file).isFile())
      .filter(file => isFileWithMatchingExtension(file, extensions))
    ;
  };
}

function inclusionBasedFileListBuilder(includePaths: string[]): FileListBuilder {
  // Uses glob to expand the files and directories in includePaths, filtering
  // down to match the list of desired extensions.
  return (extensions: string[]) => {
    var analysisFiles: string[] = [];

    includePaths.forEach(fileOrDirectory => {
      if (/\/$/.test(fileOrDirectory)) {
        // if it ends in a slash, expand and push
        var filesInThisDirectory = glob.sync(`/code/${fileOrDirectory}/**/**`);
        prunePathsWithinSymlinks(filesInThisDirectory)
          .filter((file) => isFileWithMatchingExtension(file, extensions))
          .forEach(file => analysisFiles.push(file))
        ;
      } else {
        // if not, check for ending in *.js
        var fullPath = `/code/${fileOrDirectory}`;
        if (isFileWithMatchingExtension(fullPath, extensions)) {
          analysisFiles.push(fullPath);
        }
      }
    });

    return analysisFiles;
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
  console.error(`process: ${fileName}`);
  let contents = fs.readFileSync(fileName, "utf8");
  let linter = new Linter(fileName, contents, options);
  let result = linter.lint();
  console.log(result);
}

loadConfig("/config.json")
  .flatMap((builder: FileListBuilder) => builder(['.ts']))
  .subscribe(processFile)
;
