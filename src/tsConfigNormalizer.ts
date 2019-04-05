'use strict';
import * as fs from 'fs';
import * as path from 'path';
import {RawConfigFile} from 'tslint/lib/configuration';
import {ensureTemporaryDir, getTemporaryFileName} from './utils';

import * as stripJsonComments from 'strip-json-comments';

export type RulesDirectory = string | string[] | undefined;

/**
 * Normalizes tsconfg.json file.
 * Currently doing these stuffs.
 * <ul>
 *   <li>
 *     Resolve rules directories if they are not found on the original path but defined in the tslint base path
 *   </li>
 * </ul>
 */
export function normalizeTsConfig(input: string, altRulesDirectory: string): string {
  const config = load(input);
  config.rulesDirectory = resolveRulesDirectory(config.rulesDirectory, altRulesDirectory);
  const output = getTemporaryFileName();
  save(config, output);
  return output;
}

function load(file: string): RawConfigFile {
  return JSON.parse(stripJsonComments(fs.readFileSync(file).toString('UTF-8')));
}

function save(rawConfig: RawConfigFile, file: string): void {
  ensureTemporaryDir();
  fs.writeFileSync(file, JSON.stringify(rawConfig), 'UTF-8');
}

/** Resolves rules directories */
export function resolveRulesDirectory(rulesDirectory: RulesDirectory, alternativeRulesDir: string): RulesDirectory {
  function normalizeRulesDirectoryPath(dir: string): string {
    if (!fs.existsSync(dir) && fs.existsSync(path.join(alternativeRulesDir, dir))) {
      return path.join(alternativeRulesDir, dir);
    }
    return dir;
  }

  if (!rulesDirectory) {
    return rulesDirectory;
  } else if (typeof rulesDirectory === 'string') {
    return normalizeRulesDirectoryPath(rulesDirectory);
  } else {
    return rulesDirectory.map(normalizeRulesDirectoryPath);
  }
}
