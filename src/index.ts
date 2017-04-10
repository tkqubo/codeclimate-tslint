'use strict';

import * as fs from 'fs';
import {TsLinter} from './tsLinter';
import {IRuleMetadata} from 'tslint';
import {IConfig} from './codeclimateDefinitions';
import {loadTslintEslintRules} from './rule-loaders/loadTslintEslintRules';

const configPath: string = '/config.json';
const targetPath: string = '/code/';
const linterPath: string = '/usr/src/app/';
const rulesPath: string = '../docs/tslint-rules';

const codeClimateConfig: IConfig = loadCodeClimateConfig(configPath);
const rules: IRuleMetadata[] = (require(rulesPath) as IRuleMetadata[])
  .concat(loadTslintEslintRules(linterPath))
;

function loadCodeClimateConfig(file: string): IConfig {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return JSON.parse(fs.readFileSync(file).toString('utf-8'));
  } else {
    console.warn(`${file} does not exist, so defaulting to process all the file under the 'src' directory`);
    return { enabled: true, include_paths: ['src'] };
  }
}

const tsLinter: TsLinter = new TsLinter({
  targetPath,
  linterPath,
  codeClimateConfig,
  rules
});

tsLinter
  .lint()
  .map((j) => JSON.stringify(j))
  .map((json) => `${json}\u0000`)
  .subscribe((line) => console.log(line));
