'use strict';

import {IRuleMetadata} from 'tslint';
import * as CodeClimate from './codeclimateDefinitions';

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

  createIssueFromError(e: Error): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: '(runtime error)',
      description: `${e.name}: ${e.message}\n${e.stack}`,
      categories: ['Bug Risk'],
      remediation_points: 50000,
      location: {
        path: '',
        positions: {
          begin: { line: 0, column: 0 },
          end: { line: 0, column: 0 }
        }
      }
    };
  }
}

export default new Utils();
