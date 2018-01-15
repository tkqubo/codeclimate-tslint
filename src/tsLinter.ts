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
import {RuleFailure} from 'tslint/lib/language/rule/rule';
import autobind from 'autobind-decorator';

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

  @autobind
  lint(): rx.Observable<CodeClimate.IIssue> {
    return rx.Observable.from(this.listFiles())
      .flatMap(this.doLint);
  }

  @autobind
  listFiles(): string[] {
    return this.fileMatcher.matchFiles(this.option.codeClimateConfig.include_paths);
  }

  @autobind
  private getTsLintFilePath(): string {
    return _.find([
      path.join(this.option.targetPath, this.option.codeClimateConfig.config || TsLinter.defaultTsLintFileName),
      path.join(this.option.linterPath, TsLinter.defaultTsLintFileName)
    ], (file) => fs.existsSync(file));
  }

  @autobind
  private doLint(fileName: string): rx.Observable<CodeClimate.IIssue> {
    const contents = fs.readFileSync(fileName, 'utf8');
    const linter: Linter = this.createLinter();

    linter.lint(fileName, contents, this.configurationFile);

    let observable: rx.Observable<RuleFailure> = rx.Observable.from(linter.getResult().failures);
    if (this.option.codeClimateConfig.ignore_warnings) {
      observable = observable.filter(failure => failure.getRuleSeverity() !== 'warning')
    }
    return observable
      .map(this.issueConverter.convert)
      .catch((e: any) => rx.Observable.of(Utils.createIssueFromError(e)))
      ;
  }

  @autobind
  protected createLinter(): Linter {
    return new Linter(this.linterOption);
  }
}
