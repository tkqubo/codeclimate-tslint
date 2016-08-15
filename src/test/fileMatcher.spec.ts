'use strict';

const assert = require('power-assert');
import * as proxyquire from 'proxyquire';
let globMock: any = {};
let fsMock: any = {
  lstatSync: (file: string): any => ({
    isFile: () => !/\.non-file/.test(file),
    isSymbolicLink: () => /.sym/.test(file),
    isDirectory: () => file.indexOf('.') == -1
  })
};
import {FileMatcher as ActualFileMatcher} from '../fileMatcher';
let fileMatcherModule = proxyquire('../fileMatcher', { glob: globMock, fs: fsMock });
let FileMatcher: typeof ActualFileMatcher = fileMatcherModule.FileMatcher;

const BasePath = "/file-matcher-test/";

function createSyncMockFunction(baseMap: { [pattern: string]: string[] }): (path: string) => string[] {
  return (path: string) => {
    return (baseMap[path.substring(BasePath.length)] || []).map(file => `${BasePath}${file}`);
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
    node_modules: [
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
  const fileMatcher = new FileMatcher(BasePath, ['.ts']);

  describe('.exclusionBasedFileListBuilder(excludePaths: string[])', () => {
    it('passes with constant path pattern', done => {
      let expected = [
        'index.ts',
        'src/lib/util.ts'
      ];
      let actual: string[] = [];
      fileMatcher
        .exclusionBasedFileListBuilder(['node_modules'])
        .subscribe(next => {
          actual.push(next);
        }, error => {
          assert.fail(error);
        }, () => {
          assert(actual.length == expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] == `${BasePath}${expected[i]}`);
          });
          done();
        })
      ;
    });

    it('passes with empty list', done => {
      let actual: string[] = [];
      let expected = [
        'index.ts',
        'src/lib/util.ts',
        'node_modules/util/util.ts'
      ];
      fileMatcher
        .exclusionBasedFileListBuilder([])
        .subscribe(next => {
          actual.push(next);
        }, error => {
          assert.fail(error);
        }, () => {
          assert(actual.length == expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] == `${BasePath}${expected[i]}`);
          });
          done();
        })
      ;
    });
  });

  describe('.inclusionBasedFileListBuilder(includePaths: string[])', () => {
    it('passes', done => {
      let expected = [
        'index.ts',
        'src/lib/util.ts'
      ];
      let actual: string[] = [];
      fileMatcher
        .inclusionBasedFileListBuilder(['*.ts', 'src/**/*'])
        .subscribe(next => {
          actual.push(next);
        }, error => {
          assert.fail(error);
        }, () => {
          assert(actual.length == expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] == `${BasePath}${expected[i]}`);
          });
          done();
        })
      ;
    });

    it('passes with empty list', done => {
      let expected: string[] = [];
      let actual: string[] = [];
      fileMatcher
        .inclusionBasedFileListBuilder([])
        .subscribe(next => {
          actual.push(next);
        }, error => {
          assert.fail(error);
        }, () => {
          assert(actual.length == expected.length);
          actual.forEach((file, i) => {
            assert(actual[i] == `${BasePath}${expected[i]}`);
          });
          done();
        })
      ;
    });
  });
});
