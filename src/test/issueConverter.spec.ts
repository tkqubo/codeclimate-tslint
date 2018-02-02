'use strict';

import {fail, ok} from 'power-assert';
import * as sinon from 'sinon';
import * as ts from 'typescript';
import {IRuleMetadata, RuleFailure} from 'tslint';
import {IssueConverter} from '../issueConverter';
import * as CodeClimate from '../codeclimateDefinitions';
import {IConfig} from '../codeclimateDefinitions';

const assert = require('power-assert');

describe('IssueConverter', () => {
  describe('.convert(failure: RuleFailure)', () => {
    const linterPath: string = './';
    const targetPath: string = '/base/path/';
    const codeClimateConfig: IConfig = {include_paths: []};
    const failure = 'Style failed';
    const ruleName = 'foo-rule';
    const ruleMetadata: IRuleMetadata = {
      description: 'foo',
      ruleName,
      type: 'style',
      typescriptOnly: true,
      options: null,
      optionsDescription: 'option',
      optionExamples: [
        'foo', 'bar'
      ]
    };
    const converter = new IssueConverter({targetPath, linterPath, codeClimateConfig, rules: [ruleMetadata]});
    const sourceFile = sinon.mock({}) as any as ts.SourceFile;
    const sourcePath = 'path/target-source-file.ts';
    sourceFile.fileName = `${targetPath}${sourcePath}`;
    sourceFile.getLineAndCharacterOfPosition = (pos: number) => {
      return pos === 1 ? {line: 2, character: 30} : {line: 8, character: 24};
    };
    it('converts RuleFailure object properly', () => {
      // given
      const ruleFailure = new RuleFailure(sourceFile, 1, 2, failure, ruleName);
      // when
      const actual = converter.convert(ruleFailure);
      // then
      assert(actual !== null && actual !== undefined);
      assert(actual.type === 'issue');
      assert(actual.categories.length === 1);
      assert(actual.categories[0] === 'Style');
      assert(actual.check_name === ruleName);
      assert(actual.description === failure);
      const location = actual.location as CodeClimate.IPositionLocation;
      const begin = location.positions.begin as CodeClimate.ILineColumnPosition;
      const end = location.positions.end as CodeClimate.ILineColumnPosition;
      assert(location.path === sourcePath);
      assert(begin.line === 3);
      assert(begin.column === 31);
      assert(end.line === 9);
      assert(end.column === 25);
    });
    it('throws an error when rule name is not found', () => {
      // given
      const ruleFailure = new RuleFailure(sourceFile, 1, 2, failure, 'non-existent');
      try {
        // when
        converter.convert(ruleFailure);
        fail();
      } catch (e) {
        // then
        ok('should fail');
      }
    });
  });
});
