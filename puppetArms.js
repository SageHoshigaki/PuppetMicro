const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const renameDownloadedFile = require("./utils/dwnloadRename");
const updatePdfLink = require("./utils/db/update");
const resizePDF = require("./utils/resizePdf");
const waitForDownload = require("./utils/waitForDownload");

const downloadPath = path.resolve("/tmp", "downloads");
const localSavePath = path.resolve("/tmp", "saved_files");

async function puppetArms(url, entryId) {
  let browser;
  try {
    ensureDirectoryExists(downloadPath);
    ensureDirectoryExists(localSavePath);

    console.log("Initializing Puppeteer browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
    console.log("Puppeteer browser initialized successfully.");

    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    console.log("Opening the page...");
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Page opened.");

    const dropdownTriggerSelector =
      'span.n-button__content > svg[aria-hidden="true"]';
    const downbtnSelector = ".v-binder-follower-content";

    console.log("Clicking the dropdown...");
    await page.waitForSelector(dropdownTriggerSelector, { visible: true });
    await page.click(dropdownTriggerSelector);
    console.log("Dropdown clicked.");

    console.log("Clicking the download button...");
    await page.waitForSelector(downbtnSelector, { visible: true });
    await page.click(downbtnSelector);
    console.log("Download button clicked.");

    console.log("Waiting for download to finish...");
    await waitForDownload(downloadPath);
    console.log("Download finished.");

    const filePath = await findDownloadedFile(downloadPath);
    const newFilePath = await renameDownloadedFile(filePath, entryId);
    const resizedFilePath = await resizePDF(newFilePath);
    const finalFilePath = path.join(
      localSavePath,
      path.basename(resizedFilePath)
    );

    fs.copyFileSync(resizedFilePath, finalFilePath);

    await updatePdfLink(entryId, finalFilePath); // Update DB with the local file path
    console.log(
      "Document saved locally and updated in the database:",
      finalFilePath
    );
    return finalFilePath;
  } catch (error) {
    console.error("Error in puppetArms function:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Puppeteer browser closed.");
    }
  }
}

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Directory created: ${directoryPath}`);
  }
}

async function findDownloadedFile(downloadPath) {
  const downloadedFiles = fs.readdirSync(downloadPath);
  const downloadedFile = downloadedFiles.find((file) => file.endsWith(".pdf"));
  if (!downloadedFile) {
    throw new Error("No downloaded PDF file found.");
  }
  return path.join(downloadPath, downloadedFile);
}

module.exports = puppetArms;
