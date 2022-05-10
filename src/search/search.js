async function fgrep(url, host, pattern) {
  const u = new URL(url);
  let pathname = u.pathname;
  if (pathname.endsWith('/')) {
    pathname = `${pathname}index`;
  }
  const resp = await fetch(`${host}${pathname}.md`);
  const text = await resp.text();
  let found = false;
  if (text.indexOf(pattern) >= 0) {
    found = true;
  }
  const { status } = resp;
  const size = +resp.headers.get('content-length');
  return ({
    found,
    size,
    status,
    pathname: u.pathname,
    url: `${host}${u.pathname}`,
  });
}

async function fgrepNextFile(host, queue, pattern, onResultFound) {
  const url = queue.shift();
  if (url) {
    const result = await fgrep(url, host, pattern);
    if (onResultFound) {
      onResultFound(result);
    }
    if (queue[0]) return fgrepNextFile(host, queue, pattern, onResultFound);
  }
}

async function fgrepFiles(sitemap, host, pattern, connections, onResultFound) {
  const queue = [...sitemap];
  const promises = [];
  for (let c = 0; c < connections; c += 1) {
    promises.push(fgrepNextFile(host, queue, pattern, onResultFound));
  }
  await Promise.all(promises);
}

async function search(sitemap, host, pattern, connections, onResultFound) {
  return fgrepFiles(sitemap, host, pattern, connections, onResultFound);
}

export {
  search,
};
