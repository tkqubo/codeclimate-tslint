'use strict';

import {TsLinter} from './tsLinter';
import {IRuleMetadata} from 'tslint';
import {IConfig, loadCodeClimateConfig} from './codeclimate';
import {getRules} from './ruleLoader';
import {map} from 'rxjs/operators';

/** A path where code under analysis is deployed */
const targetPath: string = '/code/';
/** A path where this codeclimate-tslint program is installed on Docker container */
const linterPath: string = '/usr/src/app/';
/** Codeclimate config path */
const configPath: string = '/config.json';

const codeClimateConfig: IConfig = loadCodeClimateConfig(configPath);
const rules: IRuleMetadata[] = getRules(linterPath);

const tsLinter: TsLinter = new TsLinter({
  targetPath,
  linterPath,
  codeClimateConfig,
  rules
});

tsLinter
  .lint()
  .pipe(
    map((j) => JSON.stringify(j)),
    map((json) => `${json}\u0000`)
  )
  .subscribe((line) => console.log(line));
