import { initOptionFields, attachOptionFieldsListeners } from '../fields.js';
import { loadSitemap } from '../sitemap.js';
import { humanFileSize, toHelixConfig } from '../utils.js';
import { search } from './search.js';

const PARENT_SELECTOR = '.search';
const SEARCH_BUTTON = document.querySelector(`${PARENT_SELECTOR} #searchButton`);
const SEARCH_STATUS_PANEL = document.querySelector(`${PARENT_SELECTOR} #searchStatus`);
const SEARCH_RESULTS_PANEL = document.querySelector(`${PARENT_SELECTOR} #searchResults`);

const config = {};

let totalSize = 0;
let totalFiles = 0;
let totalSearched = 0;
let totalFilesMatched = 0;
let startTime = new Date();
let endTime = 0;

function updateStatus() {
  const seconds = Math.floor((endTime - startTime) / 100) / 10;
  let bar = SEARCH_STATUS_PANEL.querySelector('sp-progress-bar');
  let div = SEARCH_STATUS_PANEL.querySelector('div');
  if (!bar) {
    bar = document.createElement('sp-progress-bar');
    bar.setAttribute('size', 'm');
    bar.setAttribute('label', 'Searching...');
    SEARCH_STATUS_PANEL.appendChild(bar);
    div = document.createElement('div');
    SEARCH_STATUS_PANEL.appendChild(div);
  }

  if (totalSearched === totalFiles) {
    bar.setAttribute('label', 'Done.');
  }
  bar.setAttribute('progress', Math.floor(100 * totalSearched / totalFiles));
  div.innerHTML = `Matched Files: ${totalFilesMatched} / ${totalFiles} (${humanFileSize(totalSize, true)}) ${seconds}s`;
}

async function edit(url, y) {
  try {
    const config = toHelixConfig(url);
    const statusRes = await fetch(`https://admin.hlx.page/status/${config.owner}/${config.repo}/${config.ref}${config.path}?editUrl=auto`);
    const status = await statusRes.json();
    const editUrl = status.edit && status.edit.url;
    if (y) {
      // scroll back to original position
      window.scrollTo(0, y);
    }
    if (editUrl) {
      window.open(editUrl);
    } else {
      throw new Error('admin did not return an edit url');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`failed to get edit url for ${path}`, e);
    // eslint-disable-next-line no-alert
    alert(`failed to get edit url for ${path}`);
  }
}

function displayResult(result) {
  totalSize += result.size;
  totalSearched += 1;
  totalFilesMatched += result.found ? 1 : 0;
  if (result.found) {
    const p = document.createElement('p');
    p.innerHTML = `${humanFileSize(result.size, true).padStart(9, ' ')} `;
    const link = document.createElement('sp-link');
    link.setAttribute('size', 'm');
    link.setAttribute('target', '_blank');
    link.setAttribute('href', result.url);
    link.innerHTML = result.pathname;
    p.append(link);
    p.innerHTML += ` (${result.status})`;
    const editButton = document.createElement('sp-action-button');
    editButton.setAttribute('size', 'm');
    editButton.innerHTML = '<sp-icon-edit slot="icon"></sp-icon-edit>';
    editButton.onclick = () => edit(result.url, window.scrollY);
    p.append(' ', editButton);
    SEARCH_RESULTS_PANEL.appendChild(p);
  }
}

function onResultFound(result) {
  displayResult(result);
  endTime = new Date();
  updateStatus();
}

// eslint-disable-next-line import/prefer-default-export
export async function doSearch() {
  SEARCH_BUTTON.setAttribute('disabled', 'true');
  totalSize = 0;
  totalFiles = 0;
  totalSearched = 0;
  totalFilesMatched = 0;
  startTime = new Date();
  endTime = new Date();
  SEARCH_RESULTS_PANEL.textContent = '';

  let rp = config.fields.searchRootPath;
  if (!rp || rp === '/') {
    rp = '';
  }
  const searchIn = config.fields.searchIn || '/';
  const sitemapURLs = await loadSitemap(`${rp}/sitemap.xml`, config.fields.searchHost);
  let pattern = config.fields.searchFor;// document.getElementById('input').value;
  let connections = 10;
  if (pattern.includes(' -c ')) {
    [pattern, connections] = pattern.split(' -c ');
  }
  const filteredURLs = sitemapURLs.filter((url) => {
    const u = new URL(url);
    return u.pathname.startsWith(searchIn);
  });
  totalFiles = filteredURLs.length;
  await search(filteredURLs, config.fields.searchHost, pattern, +connections, onResultFound);

  SEARCH_BUTTON.removeAttribute('disabled');
}

const attachListeners = () => {
  attachOptionFieldsListeners(config.fields, PARENT_SELECTOR);

  SEARCH_BUTTON.addEventListener('click', doSearch);
}

const init = () => {
  config.fields = initOptionFields(PARENT_SELECTOR);

  attachListeners();
};

init();