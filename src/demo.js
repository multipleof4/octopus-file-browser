import './demo.css';
import './octopus-file-browser.js';
import tree from 'virtual:octopus-repo-tree';

const browser = document.querySelector('octopus-file-browser');
const pathText = (path) => `/${path.join('/')}`;
const isDirectory = (entry) => entry.type === 'directory';

// Stands in for an app backend: `tree` is its filesystem and `list` returns one directory per request.
function directory(path) {
  return path.reduce((entries, name) =>
    entries.find((entry) => isDirectory(entry) && entry.name === name)?.children || [], tree);
}

function list(path) {
  return directory(path).map(({ children, ...entry }) => entry);
}

function show(path) {
  browser.path = path;
  browser.entries = list(path);
}

function stored(path) {
  return directory(path.slice(0, -1)).find((entry) => entry.name === path.at(-1));
}

browser.contextMenu = [
  { label: 'Open', when: isDirectory, action: (entry, path) => show(path) },
  {
    label: 'New folder…',
    when: isDirectory,
    action: (entry, path) => {
      const name = prompt(`New folder in ${pathText(path)}`)?.trim();
      if (name) directory(path).push({ name, type: 'directory', modified: new Date().toISOString(), children: [] });
    },
  },
  {
    label: 'Download',
    when: (entry) => entry.type === 'file',
    action: (entry, path) => console.log('Download', pathText(path)),
  },
  {
    label: 'Validate JSON',
    when: (entry) => entry.type === 'file' && entry.name.toLowerCase().endsWith('.json'),
    action: (entry, path) => console.log('Validate JSON', pathText(path)),
  },
  { label: 'Copy path', action: (entry, path) => navigator.clipboard?.writeText(pathText(path)).catch(() => {}) },
  {
    label: 'Rename…',
    action: (entry, path) => {
      const name = prompt(`Rename ${entry.name}`, entry.name)?.trim();
      if (!name || name === entry.name || list(browser.path).some((sibling) => sibling.name === name)) return;
      stored(path).name = name;
      browser.entries = list(browser.path);
    },
  },
  {
    label: 'Delete',
    danger: true,
    action: (entry, path) => {
      if (!confirm(`Delete ${pathText(path)}?`)) return;
      const siblings = directory(path.slice(0, -1));
      siblings.splice(siblings.indexOf(stored(path)), 1);
      browser.entries = list(browser.path);
    },
  },
];

browser.addEventListener('octopus:navigate', ({ detail }) => show(detail.path));

show([]);
