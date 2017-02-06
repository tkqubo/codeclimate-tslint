'use strict';

const assert = require('power-assert');
import * as proxyquire from 'proxyquire';
const globMock: any = {};
const fsMock: any = {
  lstatSync: (file: string): any => ({
    isFile: () => !/\.non-file/.test(file),
    isSymbolicLink: () => /.sym/.test(file),
    isDirectory: () => file.indexOf('.') === -1
  })
};
import {FileMatcher as ActualFileMatcher} from '../fileMatcher';
const fileMatcherModule = proxyquire('../fileMatcher', { glob: globMock, fs: fsMock });
const FileMatcher: typeof ActualFileMatcher = fileMatcherModule.FileMatcher;

const basePath = '/file-matcher-test/';

function createSyncMockFunction(baseMap: { [pattern: string]: string[] }): (path: string) => string[] {
  return (path: string) => {
    return (baseMap[path.substring(basePath.length)] || []).map((file) => `${basePath}${file}`);
  };
}

describe('FileMatcher', () => {
  globMock.sync = createSyncMockFunction({
    '**/**': [
      'index.ts',
      'index.js',
      'some.non-file.ts',
      'some.sym.ts',
      'src',
      'src/lib',
      'src/lib/util.ts',
      'src/lib/util.js',
      'node_modules',
      'node_modules/util/util.ts',
      'node_modules/util/util.js',
      'node_modules/README.md'
    ],
    'node_modules': [
      'node_modules',
      'node_modules/util/util.ts',
      'node_modules/util/util.js',
      'node_modules/README.md'
    ],
    '*.ts': [
      'index.ts',
      'some.non-file.ts',
      'some.sym.ts',
    ],
    'src/**/*': [
      'src/lib',
      'src/lib/util.ts',
      'src/lib/util.js',
    ]
  });
  const fileMatcher = new FileMatcher(basePath, ['.ts']);

  describe('.exclusionBasedFileListBuilder(excludePaths: string[])', () => {
    it('passes with constant path pattern', (done) => {
      const expected = [
        'index.ts',
        'src/lib/util.ts'
      ];
      const actual: string[] = [];
      fileMatcher
        .exclusionBasedFileListBuilder(['node_modules'])
        .subscribe((next) => {
          actual.push(next);
        }, (error) => {
          assert.fail(error);
        }, () => {
          assert(actual.length === expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] === `${basePath}${expected[i]}`);
          });
          done();
        })
      ;
    });

    it('passes with empty list', (done) => {
      const actual: string[] = [];
      const expected = [
        'index.ts',
        'src/lib/util.ts',
        'node_modules/util/util.ts'
      ];
      fileMatcher
        .exclusionBasedFileListBuilder([])
        .subscribe((next) => {
          actual.push(next);
        }, (error) => {
          assert.fail(error);
        }, () => {
          assert(actual.length === expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] === `${basePath}${expected[i]}`);
          });
          done();
        })
      ;
    });
  });

  describe('.inclusionBasedFileListBuilder(includePaths: string[])', () => {
    it('passes', (done) => {
      const expected = [
        'index.ts',
        'src/lib/util.ts'
      ];
      const actual: string[] = [];
      fileMatcher
        .inclusionBasedFileListBuilder(['*.ts', 'src/**/*'])
        .subscribe((next) => {
          actual.push(next);
        }, (error) => {
          assert.fail(error);
        }, () => {
          assert(actual.length === expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] === `${basePath}${expected[i]}`);
          });
          done();
        })
      ;
    });

    it('passes with empty list', (done) => {
      const expected: string[] = [];
      const actual: string[] = [];
      fileMatcher
        .inclusionBasedFileListBuilder([])
        .subscribe((next) => {
          actual.push(next);
        }, (error) => {
          assert.fail(error);
        }, () => {
          assert(actual.length === expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] === `${basePath}${expected[i]}`);
          });
          done();
        })
      ;
    });
  });
});
