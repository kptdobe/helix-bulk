import { toHelixConfig } from '../utils.js';

const PREVIEW_CONCURRENCY = 5;
const PUBLISH_CONCURRENCY = 40;

const run = async (urls, operation, onOperation) => {
  const total = urls.length;
  let counter = 0;

  const executeOperation = async (url) => {
    const hlx = toHelixConfig(url);
    const adminURL = `https://admin.hlx.page/${operation}/${hlx.owner}/${hlx.repo}/${hlx.ref}${hlx.path}`;
    const resp = await fetch(adminURL, {
        method: 'POST',
    }); 
    const json = await resp.json();
    counter += 1;
    if (onOperation) {
      onOperation.call(null, url, operation, counter, total, adminURL, json);
    }
  }

  const dequeue = async () => {
    while (urls.length) {
      const url = urls.shift();
      await executeOperation(url);    
    }
  };

  const concurrency = operation === 'live' ? PUBLISH_CONCURRENCY : PREVIEW_CONCURRENCY;
  const promises = [];
  for (let i = 0; i < concurrency; i += 1) {
    promises.push(dequeue());
  }
  await Promise.all(promises);
};

const preview = async (urls, onOperation) => {
  await run(urls, 'preview', onOperation);
};

const publish = async (urls, onOperation) => {
  await run(urls, 'live', onOperation);
};

export {
  preview,
  publish,
};
