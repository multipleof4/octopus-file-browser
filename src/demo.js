import './demo.css';
import './octopus-file-browser.js';
import entries from 'virtual:octopus-repo-tree';

const browser = document.querySelector('octopus-file-browser');
browser.entries = entries;
