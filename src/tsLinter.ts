'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as rx from 'rx';
import * as Linter from 'tslint';
import * as CodeClimate from './codeclimateDefinitions';
import { ILinterOptions } from 'tslint/lib/lint';
import { FileMatcher } from './fileMatcher';
import { IssueConverter } from './issueConverter';

interface CodeClimateTslintEngineConfig {
  include_paths?: string[];
  exclude_paths?: string[];
  configuration?: any;

}

export class TsLinter {

  static DefaultTsLintFile = '/usr/src/app/tslint.json';
  static ConfigFile = '/config.json';
  static CodeDirectoryBase = '/code/';
  static DefaultExcludePaths: string[] = [
    'node_modules',
    'typings'
  ];

  converter: IssueConverter = new IssueConverter();

  lint(): rx.Observable<CodeClimate.IIssue> {
    let config: CodeClimateTslintEngineConfig = this.loadConfig();
    let linterOptions: ILinterOptions = this.createLinterOptionFromConfig(config);

    return this.listFiles(config)
      .flatMap<CodeClimate.IIssue>((file: string) => this.doLint(file, linterOptions));
  }

  private loadConfig(): CodeClimateTslintEngineConfig {
    let codeClimateConfig: CodeClimate.IConfig = (
        fs.existsSync(TsLinter.ConfigFile) &&
        fs.statSync(TsLinter.ConfigFile).isFile()
      ) ?
      JSON.parse(fs.readFileSync(TsLinter.ConfigFile).toString('utf-8')) :
      { enabled: true };
    let config: CodeClimateTslintEngineConfig = {};

    // resolve rules
    let tslintFileName: string = _.find([
      path.join(TsLinter.CodeDirectoryBase, codeClimateConfig.config || 'tslint.json'),
      TsLinter.DefaultTsLintFile
    ], file => fs.existsSync(file));
    console.error("TSLint is running with the " + tslintFileName + " configuration.");
    config.configuration = Linter.loadConfigurationFromPath(tslintFileName);

    // resolve paths setting
    if (codeClimateConfig.include_paths) {
      config.include_paths = codeClimateConfig.include_paths;
    } else {
      config.exclude_paths = TsLinter.DefaultExcludePaths;
    }

    return config;
  }

  private createLinterOptionFromConfig(config: CodeClimateTslintEngineConfig): ILinterOptions {
    return {
      formatter: 'json',
      configuration: config.configuration,
      formattersDirectory: 'customFormatters/',
      rulesDirectory: []
    }
  }

  private listFiles(config: CodeClimateTslintEngineConfig): rx.Observable<string> {
    let matcher = new FileMatcher(TsLinter.CodeDirectoryBase, ['.ts', '.tsx']);
    return config.include_paths ?
      matcher.inclusionBasedFileListBuilder(config.include_paths) :
      matcher.exclusionBasedFileListBuilder(config.exclude_paths || []);
  }

  private doLint(fileName: string, options: ILinterOptions): rx.Observable<CodeClimate.IIssue> {
    let contents = fs.readFileSync(fileName, 'utf8');
    let linter = new Linter(fileName, contents, options);
    return rx.Observable
      .fromArray(linter.lint().failures)
      .map(this.converter.convert)
      .catch((e: any) => rx.Observable.just(this.createIssueFromError(e)));
  }

  private createIssueFromError(e: Error): CodeClimate.IIssue {
    return {
      type: CodeClimate.IssueTypes.Issue,
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
