/**
 * This script copies compiled contract artifacts from the build directory
 * to the frontend directory, ensuring that the frontend has access to the
 * latest contract ABIs and bytecode.
 */

const fs = require("fs");
const path = require("path");

// Define source and target directories for contract artifacts
const sourceDir = path.join(__dirname, "build", "contracts");
const targetDir = path.join(__dirname, "frontend", "contracts");

/**
 * Create the target directory if it doesn't exist.
 * This ensures that the directory structure is in place for copying files.
 */
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

/**
 * Copy contract artifacts from the source directory to the target directory.
 * This includes reading each JSON file and writing it to the target location.
 */
try {
  const files = fs.readdirSync(sourceDir);

  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const sourceFile = path.join(sourceDir, file);
      const targetFile = path.join(targetDir, file);

      // Read the content of the source file and write it to the target file
      const fileContent = fs.readFileSync(sourceFile);
      fs.writeFileSync(targetFile, fileContent);

      console.log(`Copied ${file} to frontend/contracts`);
    }
  });

  console.log("All contract artifacts copied successfully!");
} catch (error) {
  console.error("Error copying contract artifacts:", error);
}
