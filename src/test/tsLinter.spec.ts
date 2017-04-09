'use strict';
import {TsLinter} from '../tsLinter';
import * as path from 'path';
import * as ts from 'typescript';
import {IRuleMetadata, LintResult, RuleFailure} from 'tslint';
import Linter = require('tslint/lib/linter');
const mock = require('mock-fs');
const assert = require('power-assert');


describe('TsLinter', () => {
  let basePath = '/base/path/';
  describe('.tsLintFilePath', () => {
    it('returns the specified file on the base path', done => {
      // Given
      let config = 'configured.json';
      let expected = path.join(basePath, config);
      mock({ [expected]: 'exists' });
      // When
      let tsLinter = new TsLinter(basePath, {config, include_paths: []}, []);
      // Then
      assert.equal(tsLinter.tsLintFilePath, expected);
      mock.restore();
      done();
    });
    it('returns path with default file name on the base path', done => {
      // Given
      let expected = path.join(basePath, TsLinter.defaultTsLintFileName);
      mock({ [expected]: 'exists' });
      // When
      let tsLinter = new TsLinter(basePath, {include_paths: []}, []);
      // Then
      assert.equal(tsLinter.tsLintFilePath, expected);
      mock.restore();
      done();
    });
    it('returns default path if the specified file does not exist on the base path', done => {
      // Given
      let expected = TsLinter.defaultTsLintFilePath;
      mock({ [expected]: 'exists' });
      // When
      let tsLinter = new TsLinter(basePath, {config: 'configured.json', include_paths: []}, []);
      // Then
      assert.equal(tsLinter.tsLintFilePath, expected);
      mock.restore();
      done();
    });
    it('returns default path if default tslint.json does not exist on the base path', done => {
      // Given
      let expected = TsLinter.defaultTsLintFilePath;
      mock({ [expected]: 'exists' });
      // When
      let tsLinter = new TsLinter(basePath, {include_paths: []}, []);
      // Then
      assert.equal(tsLinter.tsLintFilePath, expected);
      mock.restore();
      done();
    });
  });
  describe('.listFiles()', () => {
    it('returns file list', done => {
      // Given
      let tsLinter = new TsLinter(basePath, {include_paths: []}, []);
      (tsLinter as any).fileMatcher = new class {
        matchFiles(): string[] { return ['file.ts']; }
      };
      // When
      let actual = tsLinter.listFiles();
      // Then
      assert.deepStrictEqual(actual, [ 'file.ts' ]);
      done();
    });
  });
  describe('.lint()', () => {
    it('passes', done => {
      // Given
      mock({
        [TsLinter.defaultTsLintFilePath]: '{}',
        'file.ts': ''
      });
      const ruleName = 'foo-rule';
      const failureText = 'some failure';
      const ruleMetadata: IRuleMetadata = {
        description: 'foo',
        ruleName,
        type: 'style',
        typescriptOnly: true,
        options: null,
        optionsDescription: '',
        optionExamples: []
      };
      let fileName = "failed.ts";
      let source = `'use strict';
      var unused = 32;
      let object = {
        c: 42,
        a: false
      };
      `;
      let sourceFile: ts.SourceFile = ts.createSourceFile(`${basePath}${fileName}`, source, ts.ScriptTarget.ES2016);
      class MockedTsLinter extends TsLinter {
        listFiles(): string[] { return ['file.ts']; }
        protected createLinter(): Linter {
          return new class {
            lint() { }
            getResult(): LintResult {
              return {
                errorCount: 2,
                warningCount: 0,
                failures: [new RuleFailure(sourceFile, 1, 20, failureText, ruleName)],
                format: 'json',
                output: 'output'
              };
            }
          } as any;
        }
      }
      const expected = [
        {
          type: "issue",
          check_name: ruleName,
          content: {
            body: "" // omit testing
          },
          description: failureText,
          categories: [ "Style" ],
          remediation_points: 50000,
          location: {
            path: fileName,
            positions: {
              begin: { line: 1, column: 2 },
              end: { line: 2, column: 7 }
            }
          }
        }
      ];
      let tsLinter = new MockedTsLinter(basePath, {include_paths: []}, [ruleMetadata]);
      // When
      tsLinter
        .lint()
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
    });
  });
});
