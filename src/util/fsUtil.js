import * as BrowserFS from "browserfs";
import * as Promise from "bluebird";

let fs = null;

const configureFs = () =>
  new Promise((resolve) => {
    BrowserFS.configure(
      {
        fs: "LocalStorage",
      },
      function (e) {
        if (e) {
          // An error occurred.
          throw e;
        }
        // Otherwise, you can interact with the configured backends via our Node FS polyfill!
        fs = BrowserFS.BFSRequire("fs");
        resolve(fs);
      }
    );
  });

export const getFs = async () => {
  if (fs) {
    return fs;
  }
  fs = await configureFs();
  return {
    exists: (url) => new Promise(resolve => fs.exists(url, resolve)),
    mkdir: Promise.promisify(fs.mkdir),
    unlink: Promise.promisify(fs.unlink),
    readFile: Promise.promisify(fs.readFile),
    writeFile: Promise.promisify(fs.writeFile),
    rmdir: Promise.promisify(fs.rmdir),
    readdir: Promise.promisify(fs.readdir)
  };
};
