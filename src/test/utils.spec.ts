'use strict';

import Linter = require('tslint/lib/linter');
const mock = require('mock-fs');
const assert = require('power-assert');
import * as CodeClimate from '../codeclimateDefinitions';
import Utils from '../utils';

describe('Utils', () => {
  describe('createEmptyRuleMetadata(ruleName: string)', () => {
    it('creates correct instance', done => {
      let name = 'rule-name';
      let actual = Utils.createEmptyRuleMetadata(name);
      assert.equal(actual.ruleName, name);
      done();
    });
  });
  describe('createIssueFromError(e: Error)', () => {
    it('creates correct instance', done => {
      let e = new Error('error message');
      let actual = Utils.createIssueFromError(e);
      assert.equal(actual.description, `${e.name}: ${e.message}\n${e.stack}`);
      assert.equal(actual.type, CodeClimate.issueTypes.Issue);
      done();
    });
  });
});
