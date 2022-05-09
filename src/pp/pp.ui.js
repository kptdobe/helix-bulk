import { initOptionFields, attachOptionFieldsListeners } from '../fields.js';
import { preview, publish } from './pp.js';

const PARENT_SELECTOR = '.pp';
const PREVIEW_BUTTON = document.querySelector(`${PARENT_SELECTOR} #previewButton`);
const PUBLISH_BUTTON = document.querySelector(`${PARENT_SELECTOR} #publishButton`);
const PP_BUTTON = document.querySelector(`${PARENT_SELECTOR} #ppButton`);
const OPERATION_STATUS_PANEL = document.getElementById('ppStatus');
const OPERATION_RESULTS_PANEL = document.getElementById('ppResults');

const config = {};

const getURLs = () => {
  return config.fields.ppURLs.split('\n').map(e => e.trim());
}

const clear = () => {
  OPERATION_STATUS_PANEL.innerHTML = '';
  OPERATION_RESULTS_PANEL.innerHTML = '';
};

const updateStatus = (operation, counter, total) => {
  let bar = OPERATION_STATUS_PANEL.querySelector('sp-progress-bar');
  let div = OPERATION_STATUS_PANEL.querySelector('div');
  if (!bar) {
    bar = document.createElement('sp-progress-bar');
    bar.setAttribute('size', 'm');
    bar.setAttribute('label', `${operation} in progress...`);
    OPERATION_STATUS_PANEL.appendChild(bar);
    div = document.createElement('div');
    OPERATION_STATUS_PANEL.appendChild(div);
  }

  if (counter === total) {
    bar.setAttribute('label', `${operation} done.`);
  }
  bar.setAttribute('progress', Math.floor(100 * counter / total));
  div.innerHTML = `${operation}: ${counter} / ${total}`;
};

const displayResult = (operation, counter, url) => {
    const p = document.createElement('p');
    p.innerHTML = `${counter} / ${operation}: `
    const link = document.createElement('sp-link');
    link.setAttribute('size', 'm');
    link.setAttribute('target', '_blank');
    link.setAttribute('href', url);
    link.innerHTML = url;
    p.append(link);
    OPERATION_RESULTS_PANEL.appendChild(p);
}

const doPreview = async () => {
  const urls = getURLs();
  await preview(urls, (url, operation, counter, total, adminURL, json) => {
    updateStatus('Preview', counter, total);
    displayResult('Preview', counter, json.preview.url);
  });
}

const doPublish = async () => {
  const urls = getURLs();
  await publish(urls, (url, operation, counter, total, adminURL, json) => {
    updateStatus('Publish', counter, total);
    displayResult('Publish', counter, json.live.url);
  });
}

const attachListeners = () => {
  attachOptionFieldsListeners(config.fields, PARENT_SELECTOR);

  PREVIEW_BUTTON.addEventListener('click', async () => {
    clear();
    await doPreview();
  });
  PUBLISH_BUTTON.addEventListener('click', async () => {
    clear();
    await doPublish(); 
  });
  PP_BUTTON.addEventListener('click', async () => {
    clear();
    await doPreview();
    await doPublish();
  });
}

const init = () => {
  config.fields = initOptionFields(PARENT_SELECTOR);

  attachListeners();
};

init();
