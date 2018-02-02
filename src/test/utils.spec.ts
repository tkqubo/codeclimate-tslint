'use strict';

const mock = require('mock-fs');
const assert = require('power-assert');
import * as CodeClimate from '../codeclimateDefinitions';
import Utils from '../utils';

describe('Utils', () => {
  describe('createEmptyRuleMetadata(ruleName: string)', () => {
    it('creates correct instance', done => {
      const name = 'rule-name';
      const actual = Utils.createEmptyRuleMetadata(name);
      assert.equal(actual.ruleName, name);
      done();
    });
  });
  describe('createIssueFromError(e: Error)', () => {
    it('creates correct instance', done => {
      const path = 'some path';
      const e = new Error('error message');
      const actual = Utils.createIssueFromError(e, path);
      assert.equal(actual.description, `${e.name}: ${e.message}\n${e.stack}`);
      assert.equal(actual.type, CodeClimate.issueTypes.Issue);
      done();
    });
  });
});
