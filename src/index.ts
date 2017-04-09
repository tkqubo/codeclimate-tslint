'use strict';

import * as fs from 'fs';
import {TsLinter} from './tsLinter';
import {IRuleMetadata} from 'tslint';
import {IConfig} from './codeclimateDefinitions';

const configPath: string = '/config.json';
const basePath: string = '/code/';
const rulesPath: string = '../docs/rules';

const config: IConfig = loadCodeClimateConfig(configPath);
const rules: IRuleMetadata[] = require(rulesPath);

function loadCodeClimateConfig(file: string): IConfig {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return JSON.parse(fs.readFileSync(file).toString('utf-8'));
  } else {
    return { enabled: true, include_paths: [] };
  }
}

const tsLinter: TsLinter = new TsLinter(
  basePath,
  config,
  rules
);

tsLinter
  .lint()
  .map((j) => JSON.stringify(j))
  .map((json) => `${json}\u0000`)
  .subscribe((line) => console.log(line));
