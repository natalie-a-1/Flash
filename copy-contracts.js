const fs = require("fs");
const path = require("path");

// Paths
const sourceDir = path.join(__dirname, "build", "contracts");
const targetDir = path.join(__dirname, "frontend", "contracts");

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy contract artifacts
try {
  const files = fs.readdirSync(sourceDir);

  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const sourceFile = path.join(sourceDir, file);
      const targetFile = path.join(targetDir, file);

      // Read and write the file
      const fileContent = fs.readFileSync(sourceFile);
      fs.writeFileSync(targetFile, fileContent);

      console.log(`Copied ${file} to frontend/contracts`);
    }
  });

  console.log("All contract artifacts copied successfully!");
} catch (error) {
  console.error("Error copying contract artifacts:", error);
}
