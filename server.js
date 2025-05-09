const app = require("./app");
const dotenv = require("dotenv");
const { CronJob } = require("cron");
const {
  BookSheet,
  ConsignorSheet,
  list_kpi,
} = require("./controllers/updatesheet");
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const job = new CronJob(
  "0 0 * * 1", // cronTime
  function () {
    BookSheet();
    ConsignorSheet();
    list_kpi();
    console.log("Cron job executed");
  }, // onTick
  null, // onComplete
  true, // start
  "Asia/Ho_Chi_Minh" // timeZone
);
