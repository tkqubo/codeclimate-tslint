'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rxjs';
import {Configuration, ILinterOptions, Linter} from 'tslint';
import {IConfigurationLoadResult} from 'tslint/lib/configuration';
import * as CodeClimate from './codeclimateDefinitions';
import {FileMatcher} from './fileMatcher';
import {IssueConverter} from './issueConverter';
import {ITsLinterOption} from './tsLinterOption';
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

  constructor(
    public option: ITsLinterOption
  ) {
    this.tsLintFilePath = this.getTsLintFilePath();
    this.fileMatcher = new FileMatcher(option.targetPath, ['.ts', '.tsx']);
    this.issueConverter = new IssueConverter(option);
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
    const linter: Linter = this.createLinter();
    const contents = fs.readFileSync(fileName, 'utf8');
    const configLoad: IConfigurationLoadResult = Configuration.findConfiguration(this.tsLintFilePath, fileName);

    linter.lint(fileName, contents, configLoad.results);

    return rx.Observable
      .from(linter.getResult().failures)
      .map(this.issueConverter.convert)
      .catch((e: any) => rx.Observable.of(this.createIssueFromError(e)))
      ;
  }

  protected createLinter(): Linter {
    return new Linter(this.linterOption);
  }

  private createIssueFromError(e: Error): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: '(runtime error)',
      description: `${e.name}: ${e.message}\n${e.stack}`,
      categories: ['Bug Risk'],
      remediation_points: 50000,
      location: {
        path: '',
        positions: {
          begin: { line: 0, column: 0 },
          end: { line: 0, column: 0 }
        }
      }
    };
  }
}
