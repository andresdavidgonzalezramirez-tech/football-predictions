#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import generatorModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default;
const generate = generatorModule.default;

const repoRoot = process.cwd();
const parserOptions = {
  sourceType: 'module',
  plugins: ['jsx'],
  errorRecovery: true,
};

const readUtf8 = (filePath) => fs.readFileSync(filePath, 'utf8');
const writeUtf8 = (filePath, content) => fs.writeFileSync(filePath, content, 'utf8');

const run = (command) => {
  try {
    return execSync(command, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
};

const getConflictFiles = () => {
  const diffOutput = run('git diff --name-only --diff-filter=U');
  const files = diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => file.endsWith('.js'));

  if (files.length) return files;

  const trackedJs = run('git ls-files "*.js"');
  return trackedJs
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      if (!fs.existsSync(absolutePath)) return false;
      const content = readUtf8(absolutePath);
      const startMarker = '<'.repeat(7);
      const midMarker = '='.repeat(7);
      const endMarker = '>'.repeat(7);
      return content.includes(startMarker) || content.includes(midMarker) || content.includes(endMarker);
    });
};

const resolveConflictBlocks = (content) => {
  const startMarker = '<'.repeat(7);
  const midMarker = '='.repeat(7);
  const endMarker = '>'.repeat(7);

  if (!content.includes(startMarker)) return content;

  const lines = content.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].startsWith(startMarker)) {
      output.push(lines[i]);
      i += 1;
      continue;
    }

    i += 1;
    const currentChunk = [];
    while (i < lines.length && !lines[i].startsWith(midMarker)) {
      currentChunk.push(lines[i]);
      i += 1;
    }

    if (i < lines.length && lines[i].startsWith(midMarker)) i += 1;

    const incomingChunk = [];
    while (i < lines.length && !lines[i].startsWith(endMarker)) {
      incomingChunk.push(lines[i]);
      i += 1;
    }

    if (i < lines.length && lines[i].startsWith(endMarker)) i += 1;

    const merged = [...currentChunk, ...incomingChunk]
      .filter((line, index, arr) => {
        if (!line.trim()) return true;
        return arr.findIndex((candidate) => candidate.trim() === line.trim()) === index;
      });

    output.push(...merged);
  }

  return output.join('\n');
};

const normalizeAst = (code) => {
  const ast = parser.parse(code, parserOptions);
  const functionNameSeen = new Set();

  traverse(ast, {
    Program(programPath) {
      if (programPath.scope.hasBinding('parseStatsRows')) {
        programPath.scope.rename('parseStatsRows', 'normalizeStatsRows');
      }
      if (programPath.scope.hasBinding('probabilities')) {
        programPath.scope.rename('probabilities', 'predictions');
      }
    },
    FunctionDeclaration(functionPath) {
      const functionId = functionPath.node.id;
      if (!functionId || !functionId.name) return;

      const name = functionId.name;
      if (!functionNameSeen.has(name)) {
        functionNameSeen.add(name);
        return;
      }

      if (functionPath.parentPath.isExportNamedDeclaration()) {
        functionPath.parentPath.remove();
      } else {
        functionPath.remove();
      }
    },
    VariableDeclarator(variablePath) {
      if (!t.isIdentifier(variablePath.node.id)) return;
      const name = variablePath.node.id.name;
      const init = variablePath.node.init;
      const isFunctionLike = t.isFunctionExpression(init) || t.isArrowFunctionExpression(init);
      if (!isFunctionLike) return;

      if (!functionNameSeen.has(name)) {
        functionNameSeen.add(name);
        return;
      }

      const declarationPath = variablePath.parentPath;
      if (declarationPath.node.declarations.length > 1) {
        variablePath.remove();
      } else if (declarationPath.parentPath.isExportNamedDeclaration()) {
        declarationPath.parentPath.remove();
      } else {
        declarationPath.remove();
      }
    },
    Identifier(identifierPath) {
      if (identifierPath.node.name === 'probabilities'
        && (identifierPath.isReferencedIdentifier() || identifierPath.isBindingIdentifier())) {
        identifierPath.node.name = 'predictions';
      }

      if (identifierPath.node.name === 'parseStatsRows'
        && (identifierPath.isReferencedIdentifier() || identifierPath.isBindingIdentifier())) {
        identifierPath.node.name = 'normalizeStatsRows';
      }
    },
    ObjectProperty(propertyPath) {
      if (!propertyPath.node.computed && t.isIdentifier(propertyPath.node.key)) {
        if (propertyPath.node.key.name === 'probabilities') {
          propertyPath.node.key = t.identifier('predictions');
        }
        if (propertyPath.node.key.name === 'parseStatsRows') {
          propertyPath.node.key = t.identifier('normalizeStatsRows');
        }
      }
    },
  });

  const generated = generate(ast, {
    retainLines: false,
    compact: false,
    comments: true,
    jsescOption: { minimal: true },
  }, code);

  return generated.code.endsWith('\n') ? generated.code : `${generated.code}\n`;
};

const processFile = (relativePath) => {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return false;

  const originalCode = readUtf8(absolutePath);
  const conflictResolvedCode = resolveConflictBlocks(originalCode);

  let normalizedCode;
  try {
    normalizedCode = normalizeAst(conflictResolvedCode);
  } catch (error) {
    console.error(`AST parsing failed for ${relativePath}: ${error.message}`);
    return false;
  }

  if (normalizedCode !== originalCode) {
    writeUtf8(absolutePath, normalizedCode);
    return true;
  }

  return false;
};

const main = () => {
  const files = getConflictFiles();
  if (!files.length) {
    process.stdout.write('No conflicted files found.\n');
    process.exit(0);
  }

  const touched = [];
  files.forEach((filePath) => {
    const changed = processFile(filePath);
    if (changed) touched.push(filePath);
  });

  if (touched.length) {
    process.stdout.write(`Resolved files: ${touched.join(', ')}\n`);
  } else {
    process.stdout.write('No file changes were necessary.\n');
  }
};

main();
