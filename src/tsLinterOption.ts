'use strict';
import {IConfig} from './codeclimateDefinitions';
import {IRuleMetadata} from 'tslint';

export interface ITsLinterOption {
  targetPath: string;
  linterPath: string;
  codeClimateConfig: IConfig;
  rules: IRuleMetadata[];
}