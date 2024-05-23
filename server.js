import express from "express";
import puppetArms from "./puppetArms";

const app = express();

app.get("/puppetremote", async (req, res) => {
  const { url, entryId } = req.query;
  try {
    const filePath = await puppetArms(url, entryId);
    res.send(`File saved at: ${filePath}`);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
