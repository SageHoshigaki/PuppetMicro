const express = require("express");
const fs = require("fs");
const path = require("path");
const puppetArms = require("./puppetarms");

const app = express();
app.use(express.json());

app.get("/connect-test", (req, res) => {
  res.status(200).json({ message: "Connection successful" });
});

app.post("/puppetremote", async (req, res) => {
  const { url, entryId } = req.body;

  try {
    const filePath = await puppetArms(url, entryId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${entryId}.pdf"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      console.log(`PDF file sent: ${filePath}`);
    });

    fileStream.on("error", (error) => {
      console.error("Error reading the file:", error);
      res.status(500).send(`Error: ${error.message}`);
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
