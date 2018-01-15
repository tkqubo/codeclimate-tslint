'use strict';

const assert = require('power-assert');
import {IRuleMetadata} from 'tslint';
import {ContentRenderer} from '../contentRenderer';

describe('ContentRenderer', () => {
  describe('.render(name: string, rule: IRuleMetadata)', () => {
    it('renders markdown with full information from rule metadata', done => {
      // Given
      const renderer = new ContentRenderer('./');
      const rule: IRuleMetadata = {
        ruleName: 'foo-rule',
        type: 'style',
        description: 'DESCRIPTION',
        descriptionDetails: 'DETAILS',
        hasFix: true,
        optionsDescription: '`true`',
        options: {
          type: 'array',
          items: {
            type: 'string',
            enum: [ 'yes', 'no' ]
          }
        },
        optionExamples: [
          'true', 'false'
        ],
        rationale: 'RATIONALE',
        requiresTypeInfo: true,
        typescriptOnly: true
      };
      const optionExamples = (rule.optionExamples as string[]).map(o => '```json\n' + '"' + rule.ruleName + '": ' + o + '\n```').join('\n');
      const options = '```json\n' + JSON.stringify(rule.options, null, 2) + '\n```';
      const expected = `# Rule: ${rule.ruleName}

${rule.description}

${rule.descriptionDetails}

##### Rationale

${rule.rationale}

##### Notes

- **TypeScript Only**
- **Has Fix**
- **Requires Type Info**

### Config

${rule.optionsDescription}

##### Examples

${optionExamples}

##### Schema

${options}

For more information see [this page](https://palantir.github.io/tslint/rules/${rule.ruleName}).
`;
      // When
      const actual = renderer.render(rule);
      // Then
      assert.equal(actual, expected);
      done();
    });
    it('renders markdown with least information from rule metadata', done => {
      // Given
      const renderer = new ContentRenderer('./');
      const rule: IRuleMetadata = {
        ruleName: 'foo-rule',
        type: 'style',
        description: 'DESCRIPTION',
        optionsDescription: '`true`',
        options: { },
        typescriptOnly: false
      };
      const options = '```json\n' + JSON.stringify(rule.options, null, 2) + '\n```';
      const expected = `# Rule: ${rule.ruleName}

${rule.description}

### Config

${rule.optionsDescription}

##### Schema

${options}

For more information see [this page](https://palantir.github.io/tslint/rules/${rule.ruleName}).`;
      // When
      const actual = renderer.render(rule);
      // Then
      done();
    });
  });
});
