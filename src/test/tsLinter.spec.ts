'use strict';
import * as path from 'path';
import * as ts from 'typescript';
import {ILinterOptions, IRuleMetadata, Linter, LintResult, RuleFailure} from 'tslint';
import {TsLinter} from '../tsLinter';
import {IConfig, IIssue} from '../codeclimate';
import {ContentRenderer} from '../contentRenderer';
import {IConfigurationFile} from 'tslint/lib/configuration';
import Utils from '../utils';
import {ConfigFileNormalizer} from '../configFileNormalizer';
import {Observable} from 'rxjs';
import {catchError, finalize, map, toArray} from 'rxjs/operators';

const mock = require('mock-fs');
const assert = require('power-assert');

describe('TsLinter', () => {
  const linterPath: string = './';
  const targetPath: string = '/base/path/';
  const templateFile = path.join(linterPath, ContentRenderer.templateFileName);

  class MockedConfigFileNormalizer extends ConfigFileNormalizer {
    normalize(inPath: string, altRulesDirectory: string): string {
      return super.baseOutDir;
    }
  }

  describe('.originalConfigPath', () => {
    const rules: IRuleMetadata[] = [];
    it('returns the specified file on the base path', done => {
      // Given
      const config = 'configured.json';
      const codeClimateConfig: IConfig = {config, include_paths: []};
      const expected = path.join(targetPath, config);
      mock({[expected]: '{}', [templateFile]: 'exists'});
      // When
      const tsLinter = new TsLinter(
        {targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(targetPath)
      );
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
      const tsLinter = new TsLinter(
        {targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(targetPath)
      );
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
      const tsLinter = new TsLinter(
        {targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(targetPath)
      );
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
      const tsLinter = new TsLinter(
        {targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(targetPath)
      );
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
      const tsLinter = new TsLinter(
        {targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(targetPath)
      );
      (tsLinter as any).fileMatcher = new class {
        matchFiles(): string[] {
          return ['file.ts'];
        }
      }();
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
      constructor(options: ILinterOptions, private dummyFailures: RuleFailure[]) {
        super(options);
      }

      lint(fileName: string, source: string, configuration?: IConfigurationFile): void {
      }

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
      constructor(codeClimateConfig: IConfig, private dummyFailures: RuleFailure[]) {
        super({targetPath, linterPath, codeClimateConfig, rules}, new MockedConfigFileNormalizer(linterPath));
      }

      listFiles(): string[] {
        return ['file.ts'];
      }

      protected createLinter(): Linter {
        return new MockedLinter(this.linterOption, this.dummyFailures);
      }
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

    function assertLintResult(actual: Observable<IIssue>, expected: IIssue[], done: MochaDone): void {
      actual
        .pipe(
          // skip body comparison
          map((result: IIssue) => {
            result.content = {body: ''};
            return result;
          }),
          toArray(),
          catchError(assert.fail.bind(assert)),
          finalize(mock.restore.bind(mock))
        )
        .subscribe(
          (actual: any) => {
            // Then
            assert.deepStrictEqual(actual, expected);
            done();
          }
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
      const location = {
        path: fileName,
        positions: {
          begin: {line: 1, column: 2},
          end: {line: 2, column: 7}
        }
      };
      const issue: IIssue = {...createIssue(), location};
      const failure: RuleFailure = new RuleFailure(file, 1, 20, issue.description, ruleName);
      const tsLinter: TsLinter = new MockedTsLinter({include_paths: []}, [failure]);
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
      const warning: RuleFailure = new RuleFailure(file, 0, 0, warningIssue.description, ruleName);
      warning.setRuleSeverity('warning');
      const error: RuleFailure = new RuleFailure(file, 0, 0, errorIssue.description, ruleName);
      error.setRuleSeverity('error');
      const tsLinter: TsLinter = new MockedTsLinter(
        {include_paths: [], ignore_warnings: true},
        [warning, error]
      );
      const expected: IIssue[] = [errorIssue]; // warningIssue is not included
      // When
      const actual = tsLinter.lint();
      // Then
      assertLintResult(actual, expected, done);
    });
    it('returns runtime-error issue when failing to convert a rule failure to an issue', done => {
      // Given
      mockPaths();
      const failure: RuleFailure = new RuleFailure(file, 0, 0, 'whatever', 'non-existent');
      const tsLinter: TsLinter = new MockedTsLinter({include_paths: []}, [failure]);
      const error = new Error();
      tsLinter.issueConverter.convert = function failingConvert(failure: RuleFailure): IIssue {
        throw error;
      };
      const issue = {
        ...Utils.createIssueFromError(error, tsLinter.getRelativeFilePath('file.ts')),
        content: {body: ''}
      };
      const expected: IIssue[] = [issue];
      // When
      const actual = tsLinter.lint();
      // Then
      assertLintResult(actual, expected, done);
    });
  });
  describe('.getRelativeFilePath', () => {
    // Mocked version of TsLinter
    class MockedTsLinter extends TsLinter {
      constructor(targetPath: string) {
        super(
          {targetPath, linterPath, codeClimateConfig: {include_paths: []}, rules: []},
          new MockedConfigFileNormalizer(linterPath)
        );
      }
    }

    it('returns correct path', () => {
      const tsLinter = new MockedTsLinter('/code/src');
      assert(tsLinter.getRelativeFilePath('/code/src/foo.ts') === 'foo.ts');
      assert(tsLinter.getRelativeFilePath('/code/src/foo/bar.ts') === 'foo/bar.ts');
      assert(tsLinter.getRelativeFilePath('/code/tmp/foo.ts') === '../tmp/foo.ts');
      assert(tsLinter.getRelativeFilePath('/tmp/foo.ts') === '../../tmp/foo.ts');
    });
  });
});
