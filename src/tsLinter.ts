'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import {Observable, of} from 'rxjs';
import {Configuration, ILinterOptions, IRuleMetadata, Linter, RuleFailure} from 'tslint';
import * as CodeClimate from './codeclimate';
import {IConfig} from './codeclimate';
import {FileMatcher} from './fileMatcher';
import {IssueConverter} from './issueConverter';
import Utils from './utils';
import {normalizeTsConfig} from './tsConfigNormalizer';
import autobind from 'autobind-decorator';
import {catchError, filter, flatMap, map} from 'rxjs/operators';

export interface ITsLinterOption {
  targetPath: string;
  linterPath: string;
  codeClimateConfig: IConfig;
  rules: IRuleMetadata[];
}

@autobind
export class TsLinter {
  static defaultTsLintFileName: string = 'tslint.json';

  linterOption: ILinterOptions = {
    fix: false,
    formatter: 'json'
  };

  fileMatcher: FileMatcher;
  issueConverter: IssueConverter;
  configurationFile: Configuration.IConfigurationFile;

  constructor(public option: ITsLinterOption) {
    this.fileMatcher = new FileMatcher(option.targetPath, ['.ts', '.tsx']);
    this.issueConverter = new IssueConverter(option);
    const normalizedConfigPath = normalizeTsConfig(this.getTsLintFile(), option.linterPath);
    this.configurationFile = Configuration.findConfiguration(normalizedConfigPath, '').results;
  }

  getTsLintFile(): string  {
    return _.find([
      path.join(this.option.targetPath, this.option.codeClimateConfig.config || TsLinter.defaultTsLintFileName),
      path.join(this.option.linterPath, TsLinter.defaultTsLintFileName)
    ], (file) => fs.existsSync(file));
  }

  lint(): Observable<CodeClimate.IIssue> {
    return of(...this.listFiles())
      .pipe(flatMap(this.doLint));
  }

  listFiles(): string[] {
    return this.fileMatcher.matchFiles(this.option.codeClimateConfig.include_paths);
  }

  getRelativeFilePath(fileName: string): string {
    const dirname = path.dirname(fileName);
    const basename = path.basename(fileName);
    return path.join(path.relative(this.option.targetPath, dirname), basename);
  }

  protected createLinter(): Linter {
    return new Linter(this.linterOption);
  }

  private doLint(fileName: string): Observable<CodeClimate.IIssue> {
    const contents = fs.readFileSync(fileName, 'utf8');
    const linter: Linter = this.createLinter();

    linter.lint(fileName, contents, this.configurationFile);

    let observable: Observable<RuleFailure> = of(...linter.getResult().failures);
    if (this.option.codeClimateConfig.ignore_warnings) {
      observable = observable.pipe(filter((failure) => failure.getRuleSeverity() !== 'warning'));
    }
    return observable
      .pipe(
        map(this.issueConverter.convert),
        catchError((e: any) => of(Utils.createIssueFromError(e, this.getRelativeFilePath(fileName))))
      )
      ;
  }
}
