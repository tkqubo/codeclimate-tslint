'use strict';

import {loadCodeClimateConfig} from '../codeclimate';
import * as _ from 'lodash';
import * as assert from 'power-assert';
import * as mock from 'mock-fs';

describe('codeclimate', () => {
  describe('loadCodeClimateConfig', () => {
    it('should load a file as a config if it exists', async () => {
      // Given
      const filePath = 'filePath' + _.random();
      const expected = {
        include_paths: [ 'something', ],
      };
      mock({[filePath]: JSON.stringify(expected)});
      // When
      const actual = loadCodeClimateConfig(filePath);
      // Then
      assert.deepStrictEqual(actual, expected);
    });
    it('should return a default config if a config file does not exist', () => {
      // Given
      const filePath = 'filePath' + _.random();
      const expected = {enabled: true, include_paths: ['src']};
      // When
      const actual = loadCodeClimateConfig(filePath);
      // Then
      assert.deepStrictEqual(actual, expected);
    });
    afterEach(() => mock.restore());
  });
});
