import css from 'material-icon-theme/icons/css.svg';
import file from 'material-icon-theme/icons/file.svg';
import folder from 'material-icon-theme/icons/folder.svg';
import git from 'material-icon-theme/icons/git.svg';
import html from 'material-icon-theme/icons/html.svg';
import image from 'material-icon-theme/icons/image.svg';
import javascript from 'material-icon-theme/icons/javascript.svg';
import json from 'material-icon-theme/icons/json.svg';
import license from 'material-icon-theme/icons/license.svg';
import markdown from 'material-icon-theme/icons/markdown.svg';
import npm from 'material-icon-theme/icons/npm.svg';
import svg from 'material-icon-theme/icons/svg.svg';
import typescript from 'material-icon-theme/icons/typescript.svg';
import vite from 'material-icon-theme/icons/vite.svg';
import yaml from 'material-icon-theme/icons/yaml.svg';

const EXTENSIONS = { css, htm: html, html, jpeg: image, jpg: image, js: javascript,
  json, md: markdown, mjs: javascript, png: image, svg, ts: typescript, yaml, yml: yaml };

export function resolveIcon(entry) {
  if (entry.icon) return entry.icon;
  if (entry.type === 'directory') return folder;
  const name = entry.name.toLowerCase();
  if (name === 'license' || name.startsWith('license.')) return license;
  if (name === 'package.json' || name === 'package-lock.json') return npm;
  if (name.startsWith('vite.config.')) return vite;
  if (name.startsWith('.git')) return git;
  return EXTENSIONS[name.split('.').pop()] || file;
}
