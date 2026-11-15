const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { performDriveWebhookBackup } = require("../services/gdriveWebhookBackupService");

(async () => {
  try {
    console.log("🚀 Testing Raw CSV Google Drive Backup (Books & Users)...");
    const result = await performDriveWebhookBackup({ force: true });
    if (result.skipped) {
      console.log(`\n✅ Database is up to date! No new data since last backup.`);
      console.log(`Last Backup Time: ${result.lastBackupAt}`);
      process.exit(0);
    }
    console.log("\n🎉 Raw CSV Backup Completed Successfully!");
    console.log("Format: CSV Spreadsheets (Opens directly with Google Sheets / Excel)");
    console.log("Uploaded Files:");
    result.uploadedFiles.forEach((f) => {
      console.log(`  📄 ${f.fileName} (${(f.sizeBytes / 1024).toFixed(2)} KB) -> ID: ${f.fileId}`);
      if (f.url) console.log(`     Link: ${f.url}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backup Failed:", error.message);
    if (error.response?.data) {
      console.error("Server response:", error.response.data);
    }
    process.exit(1);
  }
})();
