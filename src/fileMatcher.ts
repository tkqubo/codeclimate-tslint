'use strict';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as rx from 'rx';

export class FileMatcher {
  constructor(public basePath: string, public extensions: string[]) {
    this.prunePathsWithinSymlinks = this.prunePathsWithinSymlinks.bind(this);
    this.isFileWithMatchingExtension = this.isFileWithMatchingExtension.bind(this);
    this.isFile = this.isFile.bind(this);
  }

  exclusionBasedFileListBuilder(excludePaths: string[]): rx.Observable<string> {
    // lodash currently cannot chain `flatten()`
    const expandedExcludePaths: string[] = _.flatten(excludePaths.map((path) => glob.sync(`${this.basePath}${path}`)));
    // currently rxjs cannot use partition
    const [directories, files]: string[][] = _.partition(
      expandedExcludePaths, (file) => fs.lstatSync(file).isDirectory()
      );
    const allExcludedFiles = _.chain(directories)
      .map((directory) => glob.sync(`${directory}**/**`))
      .map(this.prunePathsWithinSymlinks)
      .flattenDeep()
      .concat(files)
      .value();

    const allFiles = glob.sync(`${this.basePath}**/**`);
    return rx.Observable
      .fromArray(_.difference(allFiles, allExcludedFiles))
      .filter(this.isFile)
      .filter(this.isFileWithMatchingExtension);
  }

  inclusionBasedFileListBuilder(includePaths: string[]): rx.Observable<string> {
    // lodash currently cannot chain `flatten()`
    const expandedIncludePaths: string[] = _.flatten(includePaths.map((path) => glob.sync(`${this.basePath}${path}`)));
    // currently rxjs cannot use partition
    const [directories, files] = _.partition(expandedIncludePaths, (file) => fs.lstatSync(file).isDirectory());

    return rx.Observable
      .fromArray(directories)
      .map((directory) => glob.sync(`${directory}/**/**`))
      .flatMap(this.prunePathsWithinSymlinks)
      .concat(rx.Observable.fromArray(files))
      .filter(this.isFileWithMatchingExtension);
  }

  private isFile(file: string): boolean {
    return fs.lstatSync(file).isFile();
  }

  private prunePathsWithinSymlinks(paths: string[]): string[] {
    const symlinks = paths.filter((path) => fs.lstatSync(path).isSymbolicLink());
    return paths.filter((path) => symlinks.every((symlink) => path.indexOf(symlink) !== 0));
  }

  private isFileWithMatchingExtension(file: string): boolean {
    const stats = fs.lstatSync(file);
    const extension = '.' + file.split('.').pop();
    return (
      stats.isFile() && !stats.isSymbolicLink()
      && this.extensions.indexOf(extension) >= 0
    );
  }
}
