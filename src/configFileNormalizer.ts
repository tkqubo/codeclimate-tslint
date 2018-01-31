'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {RawConfigFile} from 'tslint/lib/configuration';

/**
 * Normalizes tsconfg.json file.
 * Currently doing these stuffs.
 * <ul>
 *   <li>Redirect rule directories if they are not found on the original path but are defined in the tslint base path</li>
 * </ul>
 */
export class ConfigFileNormalizer {
  normalize(inPath: string, outPath: string, altRulesDirectory: string) {
    const rawConfig: RawConfigFile = JSON.parse(fs.readFileSync(inPath).toString('UTF-8'));
    if (typeof rawConfig.rulesDirectory === 'string') {
      rawConfig.rulesDirectory = this.normalizeRulesDirectoryPath(rawConfig.rulesDirectory, altRulesDirectory);
    } else if (rawConfig.rulesDirectory !== undefined) {
      rawConfig.rulesDirectory = rawConfig.rulesDirectory.map(dir => this.normalizeRulesDirectoryPath(dir, altRulesDirectory));
    }
    fs.writeFileSync(outPath, JSON.stringify(rawConfig), 'UTF-8');
  }

  normalizeRulesDirectoryPath(dirPath: string, altRulesDirectory: string): string {
    if (!fs.existsSync(dirPath) && fs.existsSync(path.join(altRulesDirectory, dirPath))) {
      return path.join(altRulesDirectory, dirPath);
    }
    return dirPath;
  }
}
