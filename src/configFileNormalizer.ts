'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {RawConfigFile} from 'tslint/lib/configuration';
import * as crypto from 'crypto';


const JSONC: any = require('json-comments');

const tmpJsonPath = '/tmp/codeclimate-tslint';

/**
 * Normalizes tsconfg.json file.
 * Currently doing these stuffs.
 * <ul>
 *   <li>Redirect rule directories if they are not found on the original path but are defined in the tslint base path</li>
 * </ul>
 */
export class ConfigFileNormalizer {
  constructor(public baseOutDir: string) {

  }
  normalize(inPath: string, altRulesDirectory: string) {
    const rawConfig: RawConfigFile = JSONC.parse(fs.readFileSync(inPath).toString('UTF-8'));
    if (typeof rawConfig.rulesDirectory === 'string') {
      rawConfig.rulesDirectory = this.normalizeRulesDirectoryPath(rawConfig.rulesDirectory, altRulesDirectory);
    } else if (rawConfig.rulesDirectory !== undefined) {
      rawConfig.rulesDirectory = rawConfig.rulesDirectory.map(dir => this.normalizeRulesDirectoryPath(dir, altRulesDirectory));
    }
    this.ensureTemporaryDirectory();
    const outPath = this.randomFilePath();
    fs.writeFileSync(outPath, JSON.stringify(rawConfig), 'UTF-8');
    return outPath;
  }

  private ensureTemporaryDirectory() {
    if (!fs.existsSync(tmpJsonPath)) {
      fs.mkdirSync(tmpJsonPath);
    }
  }

  private normalizeRulesDirectoryPath(dirPath: string, altRulesDirectory: string): string {
    if (!fs.existsSync(dirPath) && fs.existsSync(path.join(altRulesDirectory, dirPath))) {
      return path.join(altRulesDirectory, dirPath);
    }
    return dirPath;
  }

  private randomFilePath(): string {
    return path.join(tmpJsonPath, `${crypto.randomBytes(32).toString('hex')}.json`);
  }
}
