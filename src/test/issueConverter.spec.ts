'use strict';

const assert = require('power-assert');
import * as sinon from 'sinon';
import * as ts from 'typescript';
import { RuleFailure, IRuleMetadata } from 'tslint';
import { IssueConverter } from '../issueConverter';
import * as CodeClimate from '../codeclimateDefinitions';

describe('IssueConverter', () => {
  it('.convert(failure: RuleFailure)', () => {
    // given
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
    const converter = new IssueConverter([ruleMetadata]);
    const sourceFile = sinon.mock({}) as any as ts.SourceFile;
    const sourcePath = 'path/target-source-file.ts';
    sourceFile.fileName = `/code/${sourcePath}`;
    sourceFile.getLineAndCharacterOfPosition = (pos: number) => {
        return pos === 1 ? { line: 2, character: 30 } : { line: 8, character: 24 };
    };
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
    const begin = location.positions.begin as CodeClimate.ILineColumnPosition ;
    const end = location.positions.end as CodeClimate.ILineColumnPosition ;
    assert(location.path === sourcePath);
    assert(begin.line === 3);
    assert(begin.column === 31);
    assert(end.line === 9);
    assert(end.column === 25);
  });
});
