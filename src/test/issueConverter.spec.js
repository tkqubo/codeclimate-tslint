'use strict';
var assert = require('power-assert');
var sinon = require('sinon');
var rule_1 = require('tslint/lib/language/rule/rule');
var issueConverter_1 = require('../src/issueConverter');
describe('CodeClimateConverter', function () {
    it('.convert(failure: RuleFailure)', function () {
        var converter = new issueConverter_1.IssueConverter();
        var sourceFile = sinon.mock({});
        sourceFile.fileName = '/code/target-source-file.ts';
        sourceFile.getLineAndCharacterOfPosition = function (pos) { return pos === 1 ? { line: 2, character: 30 } : { line: 8, character: 24 }; };
        var failure = new rule_1.RuleFailure(sourceFile, 1, 2, 'Style failed', 'style.failure');
        console.log(failure.getFileName);
        var actual = converter.convert(failure);
        assert(actual !== null && actual !== undefined);
        assert(actual.type === 'issue');
        assert(actual.categories.length === 1);
        assert(actual.categories[0] === 'Style');
        assert(actual.check_name === 'style.failure');
        assert(actual.description === 'Style failed');
        var location = actual.location;
        var begin = location.positions.begin;
        var end = location.positions.end;
        assert(location.path === 'target-source-file.ts');
        assert(begin.line === 3);
        assert(begin.column === 31);
        assert(end.line === 9);
        assert(end.column === 25);
    });
});
//# sourceMappingURL=issueConverter.spec.js.map