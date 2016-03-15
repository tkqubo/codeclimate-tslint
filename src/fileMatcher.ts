'use strict';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as rx from 'rx';

export class FileMatcher {
  constructor(public basePath: string, public extensions: string[]) {
    // FIXME:
    this.prunePathsWithinSymlinks = this.prunePathsWithinSymlinks.bind(this);
    this.isFileWithMatchingExtension = this.isFileWithMatchingExtension.bind(this);
    this.isFile = this.isFile.bind(this);
  }

  exclusionBasedFileListBuilder(excludePaths: string[]): rx.Observable<string> {
    // lodash currently cannot chain `flatten()`
    let expandedExcludePaths: string[] = _.flatten(excludePaths.map(path => glob.sync(`${this.basePath}${path}`)));
    // currently rxjs cannot use partition
    let [directories, files]: string[][] = _.partition(expandedExcludePaths, file => this.predicateSafely(() => fs.lstatSync(file).isDirectory()));
    let allExcludedFiles = _.chain(directories)
      .map(directory => glob.sync(`${directory}/**/**`))
      .map(this.prunePathsWithinSymlinks)
      .flattenDeep()
      .concat(files)
      .value()
      ;
    var allFiles = glob.sync(`${this.basePath}/**/**`);
    return rx.Observable
      .fromArray(_.difference(allFiles, allExcludedFiles))
      .filter(this.isFile.bind(this))
      .filter(this.isFileWithMatchingExtension.bind(this))
      ;
  }

  inclusionBasedFileListBuilder(includePaths: string[]): rx.Observable<string> {
    // lodash currently cannot chain `flatten()`
    let expandedIncludePaths: string[] = _.flatten(includePaths.map(path => glob.sync(`${this.basePath}${path}`)));
    // currently rxjs cannot use partition
    let [directories, files] = _.partition(expandedIncludePaths, file => this.predicateSafely(() => fs.lstatSync(file).isDirectory()));

    return rx.Observable
      .fromArray(directories)
      .map(directory => glob.sync(`${directory}/**/**`))
      .flatMap(this.prunePathsWithinSymlinks)
      .concat(rx.Observable.fromArray(files))
      .filter(this.isFileWithMatchingExtension)
      ;
  }

  private isFile(file: string): boolean {
    return this.predicateSafely(() => fs.lstatSync(file).isFile());
  }

  private prunePathsWithinSymlinks(paths: string[]): string[] {
    var symlinks = paths.filter((path) => this.predicateSafely(() => fs.lstatSync(path).isSymbolicLink()));
    return paths.filter(path => symlinks.every(symlink => path.indexOf(symlink) != 0));
  }

  private isFileWithMatchingExtension(file: string): boolean {
    return this.predicateSafely(() => {
      var stats = fs.lstatSync(file);
      var extension = '.' + file.split('.').pop();
      return (
        stats.isFile() && !stats.isSymbolicLink()
        && this.extensions.indexOf(extension) >= 0
      );
    });
  }

  private predicateSafely(predicate: () => boolean): boolean {
    try {
      return predicate();
    } catch (e) {
      return false;
    }
  }
}


