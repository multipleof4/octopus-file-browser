import styles from './octopus-file-browser.css?inline';
import { fileKindLabel, formatFileSize, formatRelativeDate, isRecent, menuItemsFor, sortEntries } from './file-browser-utils.js';
import { resolveIcon } from './icon-resolver.js';

const HTMLElementBase = globalThis.HTMLElement || class {};
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class OctopusFileBrowser extends HTMLElementBase {
  #entries = [];
  #path = [];
  #contextMenu = [];
  #menu = null;
  #menuRow = null;
  #press = null;

  static get observedAttributes() { return ['empty-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() { this.#render(); }
  disconnectedCallback() { this.#cancelPress(); this.#closeMenu(); }
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

  set contextMenu(value) {
    this.#contextMenu = Array.isArray(value) ? value : [];
    this.#closeMenu();
  }

  get contextMenu() { return this.#contextMenu; }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  #open(entry) {
    if (entry.parent) return this.#emit('octopus:navigate', { path: this.#path.slice(0, -1) });
    if (entry.type === 'directory') return this.#emit('octopus:navigate', { path: [...this.#path, entry.name] });
    this.#emit('octopus:open', { entry, path: [...this.#path, entry.name] });
  }

  #bindMenu(row, entry) {
    row.addEventListener('contextmenu', (event) => {
      const items = menuItemsFor(this.#contextMenu, entry, [...this.#path, entry.name]);
      if (!items.length) return;
      event.preventDefault();
      this.#cancelPress();
      if (this.#menuRow === row) return; // Already opened by a long press.
      const fromKeyboard = !event.clientX && !event.clientY;
      const rect = row.getBoundingClientRect();
      this.#openMenu(row, entry, items, fromKeyboard ? rect.left + 16 : event.clientX, fromKeyboard ? rect.bottom : event.clientY);
    });

    // iOS never fires contextmenu for touch, so long presses are detected here.
    row.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' || !this.#contextMenu.length) return;
      this.#cancelPress();
      const { clientX: x, clientY: y } = event;
      const timer = setTimeout(() => {
        this.#press = null;
        const items = menuItemsFor(this.#contextMenu, entry, [...this.#path, entry.name]);
        if (items.length && this.#menuRow !== row) this.#openMenu(row, entry, items, x, y);
      }, LONG_PRESS_MS);
      this.#press = { timer, x, y };
    });
    row.addEventListener('pointermove', (event) => {
      if (this.#press && Math.hypot(event.clientX - this.#press.x, event.clientY - this.#press.y) > LONG_PRESS_SLOP)
        this.#cancelPress();
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
      row.addEventListener(type, () => this.#cancelPress());
  }

  #cancelPress() {
    if (!this.#press) return;
    clearTimeout(this.#press.timer);
    this.#press = null;
  }

  #openMenu(row, entry, items, x, y) {
    this.#closeMenu();
    const path = [...this.#path, entry.name];
    const menu = element('div', 'menu');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', entry.name);
    menu.setAttribute('popover', 'manual');
    for (const item of items) {
      const button = element('button', item.danger ? 'menu-item danger' : 'menu-item', item.label);
      button.type = 'button';
      button.tabIndex = -1;
      button.setAttribute('role', 'menuitem');
      button.addEventListener('click', () => {
        this.#closeMenu(true);
        item.action?.(entry, path);
      });
      menu.append(button);
    }
    menu.addEventListener('keydown', (event) => this.#onMenuKey(event));
    this.shadowRoot.append(menu);
    menu.showPopover?.();

    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(4, Math.min(x, innerWidth - width - 4))}px`;
    menu.style.top = `${y + height > innerHeight - 4 ? Math.max(4, y - height) : y}px`;

    this.#menu = menu;
    this.#menuRow = row;
    document.addEventListener('pointerdown', this.#onOutsidePointer, true);
    addEventListener('scroll', this.#onDismiss, true);
    addEventListener('resize', this.#onDismiss);
    addEventListener('blur', this.#onDismiss);
    menu.firstChild.focus({ preventScroll: true });
  }

  #closeMenu(restoreFocus = false) {
    if (!this.#menu) return;
    const row = this.#menuRow;
    this.#menu.remove();
    this.#menu = null;
    this.#menuRow = null;
    document.removeEventListener('pointerdown', this.#onOutsidePointer, true);
    removeEventListener('scroll', this.#onDismiss, true);
    removeEventListener('resize', this.#onDismiss);
    removeEventListener('blur', this.#onDismiss);
    if (restoreFocus && row.isConnected) row.focus();
  }

  #onOutsidePointer = (event) => {
    if (!event.composedPath().includes(this.#menu)) this.#closeMenu();
  };

  #onDismiss = () => this.#closeMenu();

  #onMenuKey(event) {
    const items = [...this.#menu.children];
    const index = items.indexOf(this.shadowRoot.activeElement);
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      items[(next + items.length) % items.length].focus();
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      this.#closeMenu(true);
    }
  }

  #renderEntry(entry) {
    const item = element('li');
    const row = element('button', 'entry');
    row.type = 'button';
    row.title = entry.parent ? 'Parent folder' : entry.name;
    row.setAttribute('aria-label', entry.parent
      ? 'Parent folder'
      : `${entry.name}, ${entry.type === 'directory' ? 'folder' : fileKindLabel(entry.name)}`);
    // While a menu is open, a click is the release of the long press that opened it.
    row.addEventListener('click', () => { if (!this.#menu) this.#open(entry); });
    if (!entry.parent) this.#bindMenu(row, entry);

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
    this.#cancelPress();
    this.#closeMenu();
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
  if (options.contextMenu) browser.contextMenu = options.contextMenu;
  browser.path = options.path || [];
  browser.entries = options.entries || [];
  target.append(browser);
  return browser;
}

export { fileKindLabel, formatFileSize, formatRelativeDate, isRecent, sortEntries };
