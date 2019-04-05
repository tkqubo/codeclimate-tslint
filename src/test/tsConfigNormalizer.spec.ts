'use strict';

import * as assert from 'power-assert';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import * as path from 'path';
import {temporaryDir} from '../utils';
import {load, normalizeTsConfig, resolveRulesDirectory, save} from '../tsConfigNormalizer';
import {RawConfigFile} from 'tslint/lib/configuration';

describe('tsConfigNormalizer', () => {
  const altBase = 'alternative';
  afterEach(() => mock.restore());
  describe('normalizeTsConfig', () => {
    it('should normalize tsconfig.json', async () => {
      // Given
      const input = '/somewhere/tsconfig.json';
      const existentOnBase = 'existent-on-base';
      const existentOnAltBase = 'existent-on-alt-base';
      const existentOnBoth = 'existent-on-both';
      const nonexistent = 'nonexistent';
      const originalConfig: RawConfigFile = {
        rules: {
          someRule: [Math.random()],
        },
        rulesDirectory: [existentOnBase, existentOnAltBase, existentOnBoth, nonexistent],
      };
      mock({
        [temporaryDir]: {},
        [input]: JSON.stringify(originalConfig),
        [existentOnBase]: '',
        [path.join(altBase, existentOnAltBase)]: '',
        [existentOnBoth]: '',
        [path.join(altBase, existentOnBoth)]: '',
      });
      const expectedNormalizedConfig: RawConfigFile = {
        ...originalConfig,
        rulesDirectory: [
          existentOnBase, path.join(altBase, existentOnAltBase), existentOnBoth, nonexistent
        ].map(p => path.resolve(p)),
      };
      // When
      const actual = normalizeTsConfig(input, altBase);
      // Then
      assert.equal(actual.startsWith(temporaryDir), true);
      assert.equal(actual.endsWith('.json'), true);
      const actualNormalizedConfig = load(actual);
      assert.deepStrictEqual(actualNormalizedConfig, expectedNormalizedConfig);
    });
  });
  describe('load', () => {
    it('should load JSON', async () => {
      // Given
      const fileName = 'json-with-comment.json';
      const json = `{
        // comment
        "key1": "value",
        "key2": 123,
        // key2: 456,
        /*
        key3: 789,
        */
        "key4": false,
        "key5": null
      }`;
      mock({[fileName]: json});
      const expected: any = {key1: 'value', key2: 123, key4: false, key5: null};
      // When
      const actual = load(fileName);
      // Then
      assert.deepStrictEqual(actual, expected);
    });
  });
  describe('save', () => {
    it('should save JSON', async () => {
      // Given
      mock({[temporaryDir]: {}});
      const file = `/tmp/codeclimate-tslint/tsconfig-${Math.random()}.json`;
      const expected: any = {saved: Math.random()};
      // When
      save(expected, file);
      // Then
      assert.deepStrictEqual(JSON.parse(fs.readFileSync(file).toString('UTF-8')), expected);
      fs.unlinkSync(file);
    });
  });
  describe('resolveRulesDirectory', () => {
    it('should retain rules directory when it exists', async () => {
      // Given
      const expected = 'single-dir';
      mock({[expected]: ''});
      // When
      const actual = resolveRulesDirectory(expected, altBase);
      // Then
      assert.deepStrictEqual(actual, path.resolve(expected));
    });
    it('should resolve rules directory when it does not exist but does on alternative base', async () => {
      // Given
      const dir = 'non-existent-dir';
      const expected = path.join(altBase, dir);
      mock({[expected]: ''});
      // When
      const actual = resolveRulesDirectory(dir, altBase);
      // Then
      assert.deepStrictEqual(actual, path.resolve(expected));
    });
    it('should retain rules directory when it does not exist', async () => {
      // Given
      const expected = 'single-dir';
      // When
      const actual = resolveRulesDirectory(expected, altBase);
      // Then
      assert.deepStrictEqual(actual, path.resolve(expected));
    });
    it('should resolve string array', async () => {
      // Given
      const existentOnBase = 'existent-on-base';
      const existentOnAltBase = 'existent-on-alt-base';
      const existentOnBoth = 'existent-on-both';
      const nonexistent = 'nonexistent';
      const expected = [existentOnBase, path.join(altBase, existentOnAltBase), existentOnBoth, nonexistent];
      mock({
        [existentOnBase]: '',
        [path.join(altBase, existentOnAltBase)]: '',
        [existentOnBoth]: '',
        [path.join(altBase, existentOnBoth)]: '',
      });
      // When
      const actual = resolveRulesDirectory(
        [existentOnBase, existentOnAltBase, existentOnBoth, nonexistent],
        altBase
      );
      // Then
      assert.deepStrictEqual(actual, expected.map(p => path.resolve(p)));
    });
    it('should not resolve undefined rules directory', async () => {
      // Given
      const expected: undefined = undefined;
      // When
      const actual = resolveRulesDirectory(expected, altBase);
      // Then
      assert.deepStrictEqual(actual, expected);
    });
  });
});
