'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rxjs';
import {Configuration, ILinterOptions, IRuleMetadata, Linter} from 'tslint';
import {IConfigurationLoadResult} from 'tslint/lib/configuration';
import * as CodeClimate from './codeclimateDefinitions';
import {IConfig} from './codeclimateDefinitions';
import {FileMatcher} from './fileMatcher';
import {IssueConverter} from './issueConverter';
import autobind = require('autobind-decorator');

@autobind
export class TsLinter {
  static defaultTsLintFileName: string = 'tslint.json';
  static defaultTsLintFilePath: string = `/usr/src/app/tslint.json`;

  linterOption: ILinterOptions = {
    fix: false,
    formatter: 'json'
  };
  tsLintFilePath: string;
  protected readonly fileMatcher: FileMatcher;
  protected readonly issueConverter: IssueConverter;

  constructor(
    public basePath: string,
    public config: IConfig,
    public rules: IRuleMetadata[]
  ) {
    this.tsLintFilePath = this.getTsLintFilePath();
    this.fileMatcher = new FileMatcher(this.basePath, ['.ts', '.tsx']);
    this.issueConverter = new IssueConverter(basePath, rules);
  }

  lint(): rx.Observable<CodeClimate.IIssue> {
    return rx.Observable.from(this.listFiles())
      .flatMap(this.doLint);
  }

  listFiles(): string[] {
    return this.fileMatcher.matchFiles(this.config.include_paths);
  }

  private getTsLintFilePath(): string {
    return _.find([
      path.join(this.basePath, this.config.config || TsLinter.defaultTsLintFileName),
      TsLinter.defaultTsLintFilePath
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
      description: e.message,
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
