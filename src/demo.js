import './demo.css';
import './octopus-file-browser.js';
import tree from 'virtual:octopus-repo-tree';

const browser = document.querySelector('octopus-file-browser');

// Stands in for an app backend: returns one directory listing per request.
function list(path) {
  return path.reduce((entries, name) =>
    entries.find((entry) => entry.type === 'directory' && entry.name === name)?.children || [], tree)
    .map(({ children, ...entry }) => entry);
}

browser.addEventListener('octopus:navigate', ({ detail }) => {
  browser.path = detail.path;
  browser.entries = list(detail.path);
});

browser.entries = list([]);
