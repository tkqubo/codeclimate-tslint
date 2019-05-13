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
 *   <li>
 *     Make rules directories as absolute paths
 *   </li>
 * </ul>
 */
export function normalizeTsConfig(input: string, altBase: string): string {
  const config = load(input);
  config.rulesDirectory = resolveRulesDirectory(config.rulesDirectory, altBase);
  const output = getTemporaryFileName();
  if (!isJSFile(input)) {
    save(config, output);
  }
  return output;
}

function isJSFile(file: string) {
  return file.endsWith('.js');
}

export function load(file: string): RawConfigFile {
  if (isJSFile(file)) {
    return require(file);
  }

  return JSON.parse(stripJsonComments(fs.readFileSync(file).toString('UTF-8')));
}

export function save(rawConfig: RawConfigFile, file: string): void {
  ensureTemporaryDir();
  fs.writeFileSync(file, JSON.stringify(rawConfig), 'UTF-8');
}

function normalizeRulesDirectoryPath(dir: string, altBase: string): string {
  if (!fs.existsSync(dir) && fs.existsSync(path.join(altBase, dir))) {
    return path.resolve(path.join(altBase, dir));
  }
  return path.resolve(dir);
}

/** Resolves rules directories */
export function resolveRulesDirectory(rulesDirectory: RulesDirectory, altBase: string): RulesDirectory {
  if (!rulesDirectory) {
    return rulesDirectory;
  } else if (typeof rulesDirectory === 'string') {
    return normalizeRulesDirectoryPath(rulesDirectory, altBase);
  } else {
    return rulesDirectory.map(dir => normalizeRulesDirectoryPath(dir, altBase));
  }
}
