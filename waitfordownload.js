import fs from "fs";
import path from "path";

async function waitForDownload(downloadPath, timeout = 400000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      watcher.close(); // Stop watching
      reject(new Error("Download did not complete within the expected time."));
    }, timeout);

    const watcher = fs.watch(downloadPath, (eventType, filename) => {
      if (eventType === "rename" && filename.endsWith(".pdf")) {
        clearTimeout(timeoutId);
        watcher.close();
        resolve(path.join(downloadPath, filename));
      }
    });

    process.on("exit", () => {
      clearTimeout(timeoutId);
      watcher.close();
    });
  });
}

export default waitForDownload;
