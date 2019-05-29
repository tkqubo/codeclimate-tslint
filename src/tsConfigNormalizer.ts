'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {RawConfigFile} from 'tslint/lib/configuration';
import {ensureTemporaryDir, getTemporaryFileName} from './utils';

import * as stripJsonComments from 'strip-json-comments';
import * as yaml from 'js-yaml';

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
  save(config, output);
  return output;
}

function isJSFile(file: string) {
  return file.endsWith('.js');
}

function isYAMLFile(file: string) {
  return /\.(yaml|yml)$/.test(file);
}

export function load(file: string): RawConfigFile {
  if (isJSFile(file)) {
    return require(file);
  }

  // Read in file
  const content = fs.readFileSync(file).toString('UTF-8');
  
  // Parse if yaml, else use plain content
  const json = isYAMLFile(file) ? yaml.safeLoad(content) : content;

  return JSON.parse(stripJsonComments(json));
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
