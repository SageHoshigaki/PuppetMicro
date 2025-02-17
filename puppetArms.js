const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const waitForDownload = require("./waitfordownload");

// Define the download directory inside the Docker container
const downloadPath = path.resolve("/tmp", "downloads");

async function puppetArms(url, entryId) {
  let browser;
  try {
    ensureDirectoryExists(downloadPath);

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

    // Enable download behavior in Puppeteer inside the Docker container
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath, // Ensuring downloads go to the correct directory
    });

    console.log("Opening the page...");
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Page opened.");

    // Click to open dropdown
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

    // Log file path for debugging
    console.log(`Downloaded PDF Path: ${filePath}`);

    const fileBuffer = fs.readFileSync(filePath);
    console.log("Document downloaded:", filePath);
    return fileBuffer;
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
