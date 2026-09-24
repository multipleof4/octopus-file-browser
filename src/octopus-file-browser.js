import styles from './octopus-file-browser.css?inline';
import { fileKindLabel, formatFileSize, formatRelativeDate, isRecent, sortEntries } from './file-browser-utils.js';
import { resolveIcon } from './icon-resolver.js';

const HTMLElementBase = globalThis.HTMLElement || class {};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class OctopusFileBrowser extends HTMLElementBase {
  #entries = [];
  #path = [];

  static get observedAttributes() { return ['empty-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.#render(); }
  attributeChangedCallback() { if (this.isConnected) this.#render(); }

  set entries(value) {
    this.#entries = Array.isArray(value) ? value : [];
    this.#render();
  }

  get entries() { return this.#entries; }

  set path(value) {
    this.#path = Array.isArray(value) ? [...value] : [];
    this.#render();
  }

  get path() { return [...this.#path]; }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  #open(entry) {
    if (entry.parent) return this.#emit('octopus:navigate', { path: this.#path.slice(0, -1) });
    if (entry.type === 'directory') return this.#emit('octopus:navigate', { path: [...this.#path, entry.name] });
    this.#emit('octopus:open', { entry, path: [...this.#path, entry.name] });
  }

  #renderEntry(entry) {
    const item = element('li');
    const row = element('button', 'entry');
    row.type = 'button';
    row.title = entry.parent ? 'Parent folder' : entry.name;
    row.setAttribute('aria-label', entry.parent
      ? 'Parent folder'
      : `${entry.name}, ${entry.type === 'directory' ? 'folder' : fileKindLabel(entry.name)}`);
    row.addEventListener('click', () => this.#open(entry));

    const name = element('span', 'cell name');
    const icon = element('img', 'icon');
    icon.alt = '';
    icon.src = resolveIcon(entry);
    name.append(icon, element('span', 'label', entry.name));
    if (entry.type !== 'directory') name.append(element('span', 'size', formatFileSize(entry.size)));
    const modified = element('span', 'cell modified', entry.modified ? formatRelativeDate(entry.modified) : '');
    if (entry.modified) {
      modified.title = new Date(entry.modified).toLocaleString();
      if (isRecent(entry.modified)) modified.classList.add('recent');
    }
    row.append(name, modified);
    item.append(row);
    return item;
  }

  #render() {
    if (!this.shadowRoot || typeof document === 'undefined') return;
    const style = element('style');
    style.textContent = styles;
    const list = element('ul', 'list');
    list.setAttribute('aria-label', 'Files');
    const entries = sortEntries(this.#entries);
    if (this.#path.length) list.append(this.#renderEntry({ name: '..', type: 'directory', parent: true }));
    if (entries.length) entries.forEach((entry) => list.append(this.#renderEntry(entry)));
    else list.append(element('li', 'empty', this.getAttribute('empty-label') || 'This folder is empty.'));
    this.shadowRoot.replaceChildren(style, list);
  }
}

if (globalThis.customElements && !customElements.get('octopus-file-browser'))
  customElements.define('octopus-file-browser', OctopusFileBrowser);

export function createOctopusFileBrowser(target, options = {}) {
  const browser = document.createElement('octopus-file-browser');
  if (options.emptyLabel) browser.setAttribute('empty-label', options.emptyLabel);
  browser.path = options.path || [];
  browser.entries = options.entries || [];
  target.append(browser);
  return browser;
}

export { fileKindLabel, formatFileSize, formatRelativeDate, isRecent, sortEntries };
