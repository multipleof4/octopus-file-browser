export type OctopusDate = string | number | Date;

export interface OctopusEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: OctopusDate;
  icon?: string;
}

export interface OctopusOpenDetail {
  entry: OctopusEntry;
  path: string[];
}

export interface OctopusNavigateDetail {
  path: string[];
}

export interface OctopusFileBrowserEventMap {
  'octopus:open': CustomEvent<OctopusOpenDetail>;
  'octopus:navigate': CustomEvent<OctopusNavigateDetail>;
}

export class OctopusFileBrowser extends HTMLElement {
  entries: OctopusEntry[];
  path: string[];
  addEventListener<K extends keyof OctopusFileBrowserEventMap>(
    type: K,
    listener: (this: OctopusFileBrowser, event: OctopusFileBrowserEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export function createOctopusFileBrowser(
  target: Element,
  options?: { entries?: OctopusEntry[]; path?: string[]; emptyLabel?: string },
): OctopusFileBrowser;

export function fileKindLabel(name?: string): string;
export function formatFileSize(bytes?: number): string;
export function formatRelativeDate(value: OctopusDate, now?: number): string;
export function isRecent(value: OctopusDate, now?: number): boolean;
export function sortEntries(entries?: OctopusEntry[]): OctopusEntry[];

declare global {
  interface HTMLElementTagNameMap {
    'octopus-file-browser': OctopusFileBrowser;
  }
}
