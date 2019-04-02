'use strict';
import {RuleNameNotFoundError} from '../issueConverter';
import * as CodeClimate from '../codeclimateDefinitions';
import Utils from '../utils';

const mock = require('mock-fs');
const assert = require('power-assert');

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
      const e = new RuleNameNotFoundError('some-rule');
      const actual = Utils.createIssueFromError(e, path);
      assert.equal(
        actual.description,
        `Sorry, description could not be provided due to the internal error:\n${e.stack}`
      );
      assert.equal(actual.type, CodeClimate.issueTypes.Issue);
      done();
    });
  });
});
