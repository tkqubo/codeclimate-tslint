'use strict';

import {IRuleMetadata} from 'tslint';
import * as CodeClimate from './codeclimate';
import {RuleNameNotFoundError} from './issueConverter';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

class Utils {
  createEmptyRuleMetadata(ruleName: string): IRuleMetadata {
    return {
      ruleName,
      type: 'style',
      description: '*No description is given*',
      optionsDescription: '',
      options: {},
      typescriptOnly: false
    };
  }

  createIssueFromError(e: Error, locationPath: string): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: this.resolveCheckName(e),
      description: `Sorry, description could not be provided due to the internal error:\n${e.stack}`,
      categories: ['Bug Risk'],
      remediation_points: 50000,
      location: {
        path: locationPath,
        positions: {
          begin: { line: 0, column: 0 },
          end: { line: 0, column: 0 }
        }
      }
    };
  }

  private resolveCheckName(e: Error): string {
    if (e instanceof RuleNameNotFoundError) {
      return e.ruleName;
    } else {
      return '(runtime error)';
    }
  }
}

export default new Utils();

export const temporaryDir = '/tmp/codeclimate-tslint';

export function getTemporaryFileName(extension: string = 'json'): string {
  return path.join(temporaryDir, `${crypto.randomBytes(32).toString('hex')}.${extension}`);
}

export function ensureTemporaryDir() {
  if (!fs.existsSync(temporaryDir)) {
    fs.mkdirSync(temporaryDir);
  }
}
