'use strict';

import {IRuleMetadata} from 'tslint';
import * as CodeClimate from './codeclimate';
import {RuleNameNotFoundError} from './issueConverter';

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

  createIssueFromError(e: Error, path: string): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: this.resolveCheckName(e),
      description: `Sorry, description could not be provided due to the internal error:\n${e.stack}`,
      categories: ['Bug Risk'],
      remediation_points: 50000,
      location: {
        path,
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
