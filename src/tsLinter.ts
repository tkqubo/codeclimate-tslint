'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rx';
import { Linter, Configuration } from 'tslint';
import * as CodeClimate from './codeclimateDefinitions';
import { ILinterOptions } from 'tslint/lib';
import { FileMatcher } from './fileMatcher';
import { IssueConverter } from './issueConverter';

interface ICodeClimateTslintEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  configuration?: any;

}

export class TsLinter {

  static defaultTsLintFile = '/usr/src/app/tslint.json';
  static configFile = '/config.json';
  static codeDirectoryBase = '/code/';
  static defaultExcludePaths: string[] = [
    'node_modules',
    'typings'
  ];

  converter: IssueConverter = new IssueConverter();

  lint(): rx.Observable<CodeClimate.IIssue> {
    const config: ICodeClimateTslintEngineConfig = this.loadConfig();
    const linterOptions: ILinterOptions = this.createLinterOptionFromConfig(config);

    return this.listFiles(config)
      .flatMap<CodeClimate.IIssue>((file: string) => this.doLint(file, linterOptions));
  }

  private loadConfig(): ICodeClimateTslintEngineConfig {
    const codeClimateConfig: CodeClimate.IConfig = (
        fs.existsSync(TsLinter.configFile) &&
        fs.statSync(TsLinter.configFile).isFile()
      ) ?
      JSON.parse(fs.readFileSync(TsLinter.configFile).toString('utf-8')) :
      { enabled: true };
    const config: ICodeClimateTslintEngineConfig = {};

    // resolve paths setting
    if (codeClimateConfig.include_paths) {
      config.include_paths = codeClimateConfig.include_paths;
    } else {
      config.exclude_paths = TsLinter.defaultExcludePaths;
    }

    return config;
  }

  private createLinterOptionFromConfig(config: ICodeClimateTslintEngineConfig): ILinterOptions {
    return {
      fix: false,
      formatter: 'json',
      configuration: config.configuration,
      formattersDirectory: 'customFormatters/',
      rulesDirectory: []
    };
  }

  private listFiles(config: ICodeClimateTslintEngineConfig): rx.Observable<string> {
    const matcher = new FileMatcher(TsLinter.codeDirectoryBase, ['.ts', '.tsx']);
    return config.include_paths ?
      matcher.inclusionBasedFileListBuilder(config.include_paths) :
      matcher.exclusionBasedFileListBuilder(config.exclude_paths || []);
  }

  private doLint(fileName: string, options: ILinterOptions): rx.Observable<CodeClimate.IIssue> {
    const contents = fs.readFileSync(fileName, 'utf8');
    const linter = new Linter(options);

    // resolve rules
    const codeClimateConfig: CodeClimate.IConfig = (
        fs.existsSync(TsLinter.configFile) &&
        fs.statSync(TsLinter.configFile).isFile()
      ) ?
      JSON.parse(fs.readFileSync(TsLinter.configFile).toString('utf-8')) :
      { enabled: true };
    const tslintFileName: string = _.find([
      path.join(TsLinter.codeDirectoryBase, codeClimateConfig.config || 'tslint.json'),
      TsLinter.defaultTsLintFile
    ], (file) => fs.existsSync(file));

    const configLoad = Configuration.findConfiguration(tslintFileName, fileName);

    linter.lint(fileName, contents, configLoad.results);
    return rx.Observable
      .fromArray(linter.getResult().failures)
      .map(this.converter.convert)
      .catch((e: any) => rx.Observable.just(this.createIssueFromError(e)));
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
