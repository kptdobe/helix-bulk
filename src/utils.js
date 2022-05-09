function humanFileSize(bytes, si = false, dp = 1) {
  let numBytes = bytes;
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    numBytes /= thresh;
    u += 1;
  } while (Math.round(Math.abs(numBytes) * r) / r >= thresh && u < units.length - 1);

  return `${numBytes.toFixed(dp)} ${units[u]}`;
}

function toHelixConfig(url) {
  const u = new URL(url);
  const split = u.host.split('--');
  const owner = split[2].split('.')[0];
  return {
    ref: split[0],
    repo: split[1],
    owner,
    path: u.pathname,
    host: u.hostname
  }
}

export {
  humanFileSize,
  toHelixConfig,
};
