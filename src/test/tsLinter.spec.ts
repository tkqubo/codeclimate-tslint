'use strict';

import * as assert from 'power-assert';
import * as _ from 'lodash';
import * as mock from 'mock-fs';
import * as path from 'path';
import * as ts from 'typescript';
import {ILinterOptions, IRuleMetadata, Linter, LintResult, RuleFailure} from 'tslint';
import {ITsLinterOption, TsLinter} from '../tsLinter';
import {IConfig, IIssue} from '../codeclimate';
import {ContentRenderer} from '../contentRenderer';
import {IConfigurationFile} from 'tslint/lib/configuration';
import Utils, {temporaryDir} from '../utils';
import {Observable} from 'rxjs';
import {catchError, map, toArray} from 'rxjs/operators';

describe('TsLinter', () => {
  const linterPath: string = './';
  const targetPath: string = '/base/path/';
  const option: ITsLinterOption = {targetPath, linterPath, codeClimateConfig: {include_paths: []}, rules: []};
  const templateFile = path.join(linterPath, ContentRenderer.templateFileName);
  const defaultTsLintFile = path.join(linterPath, TsLinter.defaultTsLintFileName);

  function mockFiles(...files: string[]) {
    mock(_
      .reduce<string, any>(
        files.concat(defaultTsLintFile, templateFile),
        (acc, file) => {
          acc[file] = '{}';
          return acc;
        },
        {[temporaryDir]: {}}
      ));
  }

  afterEach(() => mock.restore());

  describe('.getTsLintFile()', () => {
    it('returns a specified file on the target', () => {
      // Given
      const config = 'specified.json';
      const codeClimateConfig: IConfig = {config, include_paths: []};
      const expected = path.join(targetPath, config);
      mockFiles(expected);
      // When
      const tsLinter = new TsLinter({...option, codeClimateConfig});
      // Then
      assert.equal(tsLinter.getTsLintFile(), expected);
    });
    it('returns a default file on the linter when a specified file on the target doe not exist', () => {
      // Given
      const config = 'non-existent.json';
      const codeClimateConfig: IConfig = {config, include_paths: []};
      const targetDefaultTsLintFile = path.join(targetPath, TsLinter.defaultTsLintFileName);
      mockFiles(targetDefaultTsLintFile);
      // When
      const tsLinter = new TsLinter({...option, codeClimateConfig});
      // Then
      assert.equal(tsLinter.getTsLintFile(), defaultTsLintFile);
    });
    it('returns a default file on the linter when no file on the target exists', () => {
      // Given
      const config = 'non-existent.json';
      const codeClimateConfig: IConfig = {config, include_paths: []};
      mockFiles();
      // When
      const tsLinter = new TsLinter({...option, codeClimateConfig});
      // Then
      assert.equal(tsLinter.getTsLintFile(), defaultTsLintFile);
    });
    it('returns a default file on the target', () => {
      // Given
      const targetDefaultTsLintFile = path.join(targetPath, TsLinter.defaultTsLintFileName);
      mockFiles(targetDefaultTsLintFile);
      // When
      const tsLinter = new TsLinter(option);
      // Then
      assert.equal(tsLinter.getTsLintFile(), targetDefaultTsLintFile);
    });
    it('returns a default file on the linter', () => {
      // Given
      mockFiles();
      // When
      const tsLinter = new TsLinter(option);
      // Then
      assert.equal(tsLinter.getTsLintFile(), defaultTsLintFile);
    });
  });
  describe('.listFiles()', () => {
    it('returns file list', () => {
      // Given
      mockFiles();
      const include_paths: string[] = ['one.ts', 'two.ts'];
      const codeClimateConfig: IConfig = {...option.codeClimateConfig, include_paths};
      const tsLinter = new TsLinter({...option, codeClimateConfig});
      tsLinter.fileMatcher.matchFiles = includePaths => includePaths.concat('three.ts');
      // When
      const actual = tsLinter.listFiles();
      // Then
      assert.deepStrictEqual(actual, include_paths.concat('three.ts'));
    });
  });
  describe('.lint()', () => {
    // Mocked version of Linter
    class MockedLinter extends Linter {
      constructor(options: ILinterOptions, private dummyFailures: RuleFailure[]) {
        super(options);
      }

      lint(fileName: string, source: string, configuration?: IConfigurationFile): void {
        //
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
        super({targetPath, linterPath, codeClimateConfig, rules});
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
          path: sourceFile,
          positions: {
            begin: {line: 1, column: 1},
            end: {line: 1, column: 1}
          }
        }
      };
    }

    function assertLintResult(actual$: Observable<IIssue>, expected: IIssue[], done: Mocha.Done): void {
      actual$
        .pipe(
          // skip body comparison
          map((result: IIssue) => {
            result.content = {body: ''};
            return result;
          }),
          toArray(),
          catchError(assert.fail.bind(assert)),
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
    const sourceFile = 'failed.ts';
    const file = createSourceFile(sourceFile);

    it('passes', done => {
      // Given
      const tslintPath = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mockFiles(tslintPath, 'file.ts');
      const location = {
        path: sourceFile,
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
      const tslintPath = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mockFiles(tslintPath, 'file.ts');
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
      const tslintPath = path.join(linterPath, TsLinter.defaultTsLintFileName);
      mockFiles(tslintPath, 'file.ts');
      const failure: RuleFailure = new RuleFailure(file, 0, 0, 'whatever', 'non-existent');
      const tsLinter: TsLinter = new MockedTsLinter({include_paths: []}, [failure]);
      const error = new Error();
      tsLinter.issueConverter.convert = () => {
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
    it('returns correct path', () => {
      const tsLinter = new TsLinter({...option, targetPath: '/code/src'});
      assert(tsLinter.getRelativeFilePath('/code/src/foo.ts') === 'foo.ts');
      assert(tsLinter.getRelativeFilePath('/code/src/foo/bar.ts') === 'foo/bar.ts');
      assert(tsLinter.getRelativeFilePath('/code/src/foo/bar/baz.ts') === 'foo/bar/baz.ts');
      assert(tsLinter.getRelativeFilePath('/code/tmp/foo.ts') === '../tmp/foo.ts');
      assert(tsLinter.getRelativeFilePath('/tmp/foo.ts') === '../../tmp/foo.ts');
    });
  });
});
