'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rxjs';
import {of} from 'rxjs';
import {Configuration, ILinterOptions, Linter, RuleFailure} from 'tslint';
import * as CodeClimate from './codeclimateDefinitions';
import {FileMatcher} from './fileMatcher';
import {IssueConverter} from './issueConverter';
import {ITsLinterOption} from './tsLinterOption';
import Utils from './utils';
import {ConfigFileNormalizer} from './configFileNormalizer';
import autobind from 'autobind-decorator';
import {catchError, filter, flatMap, map} from 'rxjs/operators';

export class TsLinter {
  static defaultTsLintFileName: string = 'tslint.json';

  linterOption: ILinterOptions = {
    fix: false,
    formatter: 'json'
  };
  originalConfigPath: string;
  fileMatcher: FileMatcher;
  issueConverter: IssueConverter;
  configurationFile: Configuration.IConfigurationFile;

  constructor(
    public option: ITsLinterOption, configFileNormalizer: ConfigFileNormalizer = new ConfigFileNormalizer(option.linterPath)
  ) {
    this.fileMatcher = new FileMatcher(option.targetPath, ['.ts', '.tsx']);
    this.issueConverter = new IssueConverter(option);
    this.originalConfigPath = this.getTsLintFilePath();
    const normalizedConfigPath = configFileNormalizer.normalize(this.originalConfigPath, option.linterPath);
    this.configurationFile = Configuration.findConfiguration(normalizedConfigPath, '').results;
  }

  @autobind
  lint(): rx.Observable<CodeClimate.IIssue> {
    return of(...this.listFiles())
      .pipe(flatMap(this.doLint));
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

    let observable: rx.Observable<RuleFailure> = of(...linter.getResult().failures);
    if (this.option.codeClimateConfig.ignore_warnings) {
      observable = observable.pipe(filter((failure) => failure.getRuleSeverity() !== 'warning'))
    }
    return observable
      .pipe(
        map(this.issueConverter.convert),
        catchError((e: any) => of(Utils.createIssueFromError(e, this.getRelativeFilePath(fileName))))
      )
      ;
  }

  getRelativeFilePath(fileName: string): string {
    const dirname = path.dirname(fileName);
    const basename = path.basename(fileName);
    return path.join(path.relative(this.option.targetPath, dirname), basename);
  }

  @autobind
  protected createLinter(): Linter {
    return new Linter(this.linterOption);
  }
}
