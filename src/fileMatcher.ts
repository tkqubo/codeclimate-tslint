'use strict';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import autobind from 'autobind-decorator';

@autobind
export class FileMatcher {
  constructor(public basePath: string, public extensions: string[]) { }

  matchFiles(includePaths: string[]): string[] {
    const expandedIncludePaths: string[] =
      _.flatten(includePaths.map((path) => glob.sync(`${this.basePath}${path}`)));
    const [directories, files]: string[][] =
      _.partition(expandedIncludePaths, (file) => fs.lstatSync(file).isDirectory());

    return _.chain(directories)
      .map((directory) => glob.sync(`${directory}/**/**`))
      .flatMap(this.prunePathsWithinSymlinks)
      .concat(files)
      .filter(this.isFileWithMatchingExtension)
      .value() as string[];
  }

  private prunePathsWithinSymlinks(paths: string[]): string[] {
    const symlinks = paths.filter((path) => fs.lstatSync(path).isSymbolicLink());
    return paths.filter((path) => symlinks.every((symlink) => path.indexOf(symlink) !== 0));
  }

  private isFileWithMatchingExtension(file: string): boolean {
    const stats = fs.lstatSync(file);
    const extension = '.' + file.split('.').pop();
    return (
      stats.isFile() &&
      !stats.isSymbolicLink() &&
      this.extensions.indexOf(extension) >= 0
    );
  }
}
