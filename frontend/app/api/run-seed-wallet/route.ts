import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

// Promisify the exec function to use async/await syntax
const execPromise = util.promisify(exec);

/**
 * Handles POST requests to seed a wallet with USDC.
 * 
 * This function checks for the necessary environment variable, constructs the command
 * to execute the wallet seeding script, and handles the execution of the script.
 * It returns a JSON response indicating the success or failure of the operation.
 */
export async function POST() {
  // Check if the USDC_WHALE_ADDRESS environment variable is set
  if (!process.env.USDC_WHALE_ADDRESS) {
    console.error('API Error: USDC_WHALE_ADDRESS environment variable is not set.');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Whale address missing.' },
      { status: 500 }
    );
  }

  // Resolve the project root and script path
  const projectRoot = path.resolve(process.cwd(), '..');
  const scriptPath = path.join(projectRoot, 'test', 'demo', 'seedWallet.js');
  const command = `node "${scriptPath}"`;

  // Log the command and paths for debugging purposes
  console.log(`API [Seed Wallet]: Attempting to execute command: ${command}`);
  console.log(`API [Seed Wallet]: Script path resolved to: ${scriptPath}`);
  console.log(`API [Seed Wallet]: Current working directory: ${process.cwd()}`);
  console.log(`API [Seed Wallet]: Calculated project root: ${projectRoot}`);

  try {
    // Execute the wallet seeding script
    const { stdout, stderr } = await execPromise(command, {
       env: { ...process.env },
       cwd: projectRoot
     });

    // Log the standard output from the script
    console.log('API [Seed Wallet]: Script stdout:', stdout);
    if (stderr) {
      // Log any standard error output and return a warning in the response
      console.error('API [Seed Wallet]: Script stderr:', stderr);
      return NextResponse.json({ success: true, output: stdout, warning: stderr });
    }
    // Return a success response with the script's output
    return NextResponse.json({ success: true, output: stdout });

  } catch (error: any) {
    // Log and return an error response if the script execution fails
    console.error('API [Seed Wallet]: Error executing script:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute script', stderr: error.stderr, stdout: error.stdout },
      { status: 500 }
    );
  }
} 