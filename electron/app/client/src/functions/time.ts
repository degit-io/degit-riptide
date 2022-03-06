export const getTimeFromNow = (unixTimestamp: number): string => {
  const timeDiff = Date.now() - unixTimestamp;

  if (timeDiff < 60000) {
    return Math.floor(timeDiff / 1000) + ' seconds ago';
  } else if (timeDiff < 3600000) {
    return Math.floor(timeDiff / 60000) + ' minutes ago';
  } else if (timeDiff < 86400000) {
    return Math.floor(timeDiff / 3600000) + ' hours ago';
  } else if (timeDiff < 604800000) {
    return Math.floor(timeDiff / 86400000) + ' days ago';
  } else if (timeDiff < 2419200000) {
    return Math.floor(timeDiff / 604800000) + ' weeks ago';
  } else {
    return Math.floor(timeDiff / 2419200000) + ' years ago';
  }
}