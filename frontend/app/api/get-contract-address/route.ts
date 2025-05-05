import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    // Read from the root .env file (one directory up from frontend)
    const envPath = path.resolve(process.cwd(), "..", ".env");
    const envContent = fs.readFileSync(envPath, "utf8");

    // Extract the contract address using regex
    const match = envContent.match(/FLASH_LOAN_CONTRACT_ADDRESS=([^\r\n]+)/);
    const contractAddress = match ? match[1] : null;

    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address not found in .env file" },
        { status: 404 },
      );
    }

    return NextResponse.json({ contractAddress });
  } catch (error) {
    console.error("Error reading contract address:", error);
    return NextResponse.json(
      { error: "Failed to read contract address" },
      { status: 500 },
    );
  }
}
