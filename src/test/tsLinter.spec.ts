'use strict';

import * as path from 'path';
import * as ts from 'typescript';
import {ILinterOptions, IRuleMetadata, Linter, LintResult, RuleFailure} from 'tslint';
import {TsLinter} from '../tsLinter';
import {IConfig, IIssue} from '../codeclimateDefinitions';
import {ContentRenderer} from '../contentRenderer';
import {ITsLinterOption} from '../tsLinterOption';
import {IConfigurationFile} from 'tslint/lib/configuration';
import * as rx from 'rxjs/Rx';

const mock = require('mock-fs');
const assert = require('power-assert');

describe('TsLinter', () => {
  const linterPath: string = './';
  const targetPath: string = '/base/path/';
  const templateFile = path.join(linterPath, ContentRenderer.templateFileName);
  describe('.originalConfigPath', () => {
    const rules: IRuleMetadata[] = [];
    it('returns the specified file on the base path', done => {
      // Given
      const config = 'configured.json';
      const codeClimateConfig: IConfig = {config, include_paths: []};
      const expected = path.join(targetPath, config);
      mock({[expected]: '{}', [templateFile]: 'exists'});
      // When
      const tsLinter = new TsLinter({targetPath, linterPath, codeClimateConfig, rules});
      // Then
      assert.equal(tsLinter.originalConfigPath, expected);
      mock.restore();
      done();
    });
    it('returns path with default file name on the base path', done => {
      // Given
      const codeClimateConfig: IConfig = {include_paths: []};
      const expected = path.join(targetPath, TsLinter.defaultTsLintFileName);
      mock({[expected]: '{}', [templateFile]: 'exists'});
      // When
      const tsLinter = new TsLinter({targetPath, linterPath, codeClimateConfig, rules});
      // Then
      assert.equal(tsLinter.originalConfigPath, expected);
      mock.restore();
      done();
    });
    it('returns default path if the specified file does not exist on the base path', done => {
      // Given
      const codeClimateConfig: IConfig = {include_paths: []};
      const expected = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mock({[expected]: '{}', [templateFile]: 'exists'});
      // When
      const tsLinter = new TsLinter({targetPath, linterPath, codeClimateConfig, rules});
      // Then
      assert.equal(tsLinter.originalConfigPath, expected);
      mock.restore();
      done();
    });
    it('returns default path if default tslint.json does not exist on the base path', done => {
      // Given
      const codeClimateConfig: IConfig = {include_paths: []};
      const expected = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mock({[expected]: '{}', [templateFile]: 'exists'});
      // When
      const tsLinter = new TsLinter({targetPath, linterPath, codeClimateConfig, rules});
      // Then
      assert.equal(tsLinter.originalConfigPath, expected);
      mock.restore();
      done();
    });
  });
  describe('.listFiles()', () => {
    const rules: IRuleMetadata[] = [];
    it('returns file list', done => {
      // Given
      const tsLintPath = path.join(targetPath, TsLinter.defaultTsLintFileName);
      mock({[tsLintPath]: '{}', [templateFile]: 'exists'});
      const codeClimateConfig: IConfig = {include_paths: []};
      const tsLinter = new TsLinter({targetPath, linterPath, codeClimateConfig, rules});
      (tsLinter as any).fileMatcher = new class {
        matchFiles(): string[] {
          return ['file.ts'];
        }
      };
      // When
      const actual = tsLinter.listFiles();
      // Then
      assert.deepStrictEqual(actual, ['file.ts']);
      mock.restore();
      done();
    });
  });
  describe('.lint()', () => {
    // Mocked version of Linter
    class MockedLinter extends Linter {
      constructor(options: ILinterOptions, private dummyFailures: RuleFailure[]) { super(options); }
      lint(fileName: string, source: string, configuration?: IConfigurationFile): void { }
      getResult(): LintResult {
        return {
          errorCount: 2,
          warningCount: 0,
          failures: this.dummyFailures,
          format: 'json',
          output: 'output'
        };
      }
    }
    // Mocked version of TsLinter
    class MockedTsLinter extends TsLinter {
      constructor(option: ITsLinterOption, private dummyFailures: RuleFailure[]) { super(option); }
      listFiles(): string[] { return ['file.ts']; }
      protected createLinter(): Linter { return new MockedLinter(this.linterOption, this.dummyFailures); }
    }

    function createSourceFile(fileName: string): ts.SourceFile {
      const source = `'use strict';
      var unused = 32;
      let object = {
        c: 42,
        a: false
      };
      `;
      return ts.createSourceFile(`${targetPath}${fileName}`, source, ts.ScriptTarget.ES2016);
    }
    function mockPaths(): void {
      const tslintPath = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mock({
        [tslintPath]: '{}',
        'file.ts': '',
        [templateFile]: 'exists'
      });
    }
    function createIssue(): IIssue {
      return {
        type: 'issue',
        check_name: ruleName,
        content: {
          body: '' // omit testing
        },
        description: 'some failure',
        categories: ['Style'],
        remediation_points: 50000,
        location: {
          path: fileName,
          positions: {
            begin: {line: 1, column: 1},
            end: {line: 1, column: 1}
          }
        }
      };
    }
    function assertLintResult(actual: rx.Observable<IIssue>, expected: IIssue[], done: MochaDone): void {
      actual
      // skip body comparison
        .map(result => {
          result.content.body = '';
          return result;
        })
        .toArray()
        .subscribe(
          actual => {
            // Then
            assert.deepStrictEqual(actual, expected);
            done();
          },
          assert.fail.bind(assert),
          mock.restore.bind(mock)
        );
    }

    const ruleName = 'foo-rule';
    const rules: IRuleMetadata[] = [
      {
        description: 'foo',
        ruleName,
        type: 'style',
        typescriptOnly: true,
        options: null,
        optionsDescription: '',
        optionExamples: []
      }
    ];
    const fileName = 'failed.ts';
    const file = createSourceFile(fileName);
    it('passes', done => {
      // Given
      mockPaths();
      const codeClimateConfig: IConfig = {include_paths: []};
      const tsLinterOption: ITsLinterOption = {targetPath, linterPath, codeClimateConfig, rules};
      const location = {
        path: fileName,
        positions: {
          begin: {line: 1, column: 2},
          end: {line: 2, column: 7}
        }
      };
      const issue: IIssue = {...createIssue(), location};
      const failure: RuleFailure = new RuleFailure(file, 1, 20, issue.description, ruleName);
      const tsLinter: TsLinter = new MockedTsLinter(tsLinterOption, [failure]);
      const expected: IIssue[] = [issue];
      // When
      const actual = tsLinter.lint();
      // Then
      assertLintResult(actual, expected, done);
    });
    it('doesn\'t report warnings if ignore_warnings option is given', done => {
      // Given
      mockPaths();
      const warningIssue: IIssue = {...createIssue(), description: 'some warning'};
      const errorIssue: IIssue = {...createIssue(), description: 'some error'};
      const codeClimateConfig: IConfig = {include_paths: [], ignore_warnings: true};
      const tsLinterOption: ITsLinterOption = {targetPath, linterPath, codeClimateConfig, rules};
      const warning: RuleFailure = new RuleFailure(file, 0, 0, warningIssue.description, ruleName);
      warning.setRuleSeverity('warning');
      const error: RuleFailure = new RuleFailure(file, 0, 0, errorIssue.description, ruleName);
      error.setRuleSeverity('error');
      const tsLinter: TsLinter = new MockedTsLinter(tsLinterOption, [warning, error]);
      const expected: IIssue[] = [errorIssue]; // warningIssue is not included
      // When
      const actual = tsLinter.lint();
      // Then
      assertLintResult(actual, expected, done);
    });
  });
});
