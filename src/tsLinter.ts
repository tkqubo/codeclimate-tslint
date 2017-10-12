'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rxjs';
import {Configuration, ILinterOptions, Linter} from 'tslint';
import {IConfigurationFile} from 'tslint/lib/configuration';
import * as CodeClimate from './codeclimateDefinitions';
import {FileMatcher} from './fileMatcher';
import {IssueConverter} from './issueConverter';
import {ITsLinterOption} from './tsLinterOption';
import Utils from './utils';
const autobind: any = require('autobind-decorator');

@autobind
export class TsLinter {
  static defaultTsLintFileName: string = 'tslint.json';

  linterOption: ILinterOptions = {
    fix: false,
    formatter: 'json'
  };
  tsLintFilePath: string;
  protected readonly fileMatcher: FileMatcher;
  protected readonly issueConverter: IssueConverter;
  protected readonly configurationFile: IConfigurationFile;

  constructor(
    public option: ITsLinterOption
  ) {
    this.tsLintFilePath = this.getTsLintFilePath();
    this.fileMatcher = new FileMatcher(option.targetPath, ['.ts', '.tsx']);
    this.issueConverter = new IssueConverter(option);
    this.configurationFile = Configuration.findConfiguration(this.tsLintFilePath, '').results;
  }

  lint(): rx.Observable<CodeClimate.IIssue> {
    return rx.Observable.from(this.listFiles())
      .flatMap(this.doLint);
  }

  listFiles(): string[] {
    return this.fileMatcher.matchFiles(this.option.codeClimateConfig.include_paths);
  }

  private getTsLintFilePath(): string {
    return _.find([
      path.join(this.option.targetPath, this.option.codeClimateConfig.config || TsLinter.defaultTsLintFileName),
      path.join(this.option.linterPath, TsLinter.defaultTsLintFileName)
    ], (file) => fs.existsSync(file));
  }

  private doLint(fileName: string): rx.Observable<CodeClimate.IIssue> {
    const contents = fs.readFileSync(fileName, 'utf8');
    const linter: Linter = this.createLinter();

    linter.lint(fileName, contents, this.configurationFile);

    if (this.option.codeClimateConfig.ignore_warnings) {
      return rx.Observable
        .from(linter.getResult().failures)
        .filter((failure) => failure.getRuleSeverity() !== 'warning')
        .map(this.issueConverter.convert)
        .catch((e: any) => rx.Observable.of(Utils.createIssueFromError(e)))
        ;
    }

    return rx.Observable
      .from(linter.getResult().failures)
      .map(this.issueConverter.convert)
      .catch((e: any) => rx.Observable.of(Utils.createIssueFromError(e)))
      ;
  }

  protected createLinter(): Linter {
    return new Linter(this.linterOption);
  }
}
