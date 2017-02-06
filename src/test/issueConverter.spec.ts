'use strict';

const assert = require('power-assert');
import * as sinon from 'sinon';
import * as ts from 'typescript';
import {RuleFailure} from 'tslint/lib/language/rule/rule';
import {IssueConverter} from '../issueConverter';
import * as CodeClimate from '../codeclimateDefinitions';

describe('CodeClimateConverter', () => {
  it('.convert(failure: RuleFailure)', () => {
    const converter = new IssueConverter();
    const sourceFile = sinon.mock({}) as any as ts.SourceFile;
    sourceFile.fileName = '/code/target-source-file.ts';
    sourceFile.getLineAndCharacterOfPosition = (pos: number) => {
        return pos === 1 ? { line: 2, character: 30 } : { line: 8, character: 24 };
    };
    const failure = new RuleFailure(sourceFile, 1, 2, 'Style failed', 'style.failure');
    console.log(failure.getFileName);
    const actual = converter.convert(failure);
    assert(actual !== null && actual !== undefined);
    assert(actual.type === 'issue');
    assert(actual.categories.length === 1);
    assert(actual.categories[0] === 'Style');
    assert(actual.check_name === 'style.failure');
    assert(actual.description === 'Style failed');
    const location = actual.location as CodeClimate.IPositionLocation;
    const begin = location.positions.begin as CodeClimate.ILineColumnPosition ;
    const end = location.positions.end as CodeClimate.ILineColumnPosition ;
    assert(location.path === 'target-source-file.ts');
    assert(begin.line === 3);
    assert(begin.column === 31);
    assert(end.line === 9);
    assert(end.column === 25);
  });
});
