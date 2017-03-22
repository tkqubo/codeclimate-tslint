'use strict';

import { RuleFailure, RuleFailurePosition } from 'tslint/lib/language/rule/rule';
import * as CodeClimate from './codeclimateDefinitions';

export class IssueConverter {
  constructor() {
    this.convert = this.convert.bind(this);
    this.convertToLocation = this.convertToLocation.bind(this);
    this.convertToLineColumnPosition = this.convertToLineColumnPosition.bind(this);
  }

  convert(failure: RuleFailure): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: failure.getRuleName(),
      content: {
        body: this.contentBody(failure.getRuleName())
      },
      description: failure.getFailure(),
      categories: ['Style'], // currently only Style is available
      remediation_points: 50000, // all style issues are 50k
      location: this.convertToLocation(failure)
    };
  }

  private contentBody(name): string {
    const rules = require('../lib/docs/rules');
    const rule = rules.find((el) => el.ruleName === name);
    const examplesString = rule.optionExamples.reduce((agg, ex) => {
      return agg + '\n' + '```' + ex + '```';
    }, '');
    const schemaString = rule.options != null ? `
      ## Schema
      ${'```' + JSON.stringify(rule.options, null, 2) + '```'}
    ` : '';
    ;
    return `
    # Rule: ${name}
    ## Config
    ${rule.optionsDescription}

    ## Examples
    ${examplesString}

    ${schemaString}

    For more information see [this page](https://palantir.github.io/tslint/rules/${name}).
    `;
  }

  private convertToLocation(failure: RuleFailure): CodeClimate.Location {
    return {
      path: this.getFilePath(failure),
      positions: {
        begin: this.convertToLineColumnPosition(failure.getStartPosition()),
        end: this.convertToLineColumnPosition(failure.getEndPosition())
      }
    };
  }

  private getFilePath(failure: RuleFailure): string {
    return failure.getFileName().match(/\/code\/(.*)/i).pop();
  };

  private convertToLineColumnPosition(position: RuleFailurePosition): CodeClimate.ILineColumnPosition {
    return {
      line: position.getLineAndCharacter().line + 1,
      column: position.getLineAndCharacter().character + 1
    };
  }
}
