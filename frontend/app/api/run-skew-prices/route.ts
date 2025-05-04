import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

// Promisify the exec function to use async/await syntax
const execPromise = util.promisify(exec);

/**
 * Handles POST requests to skew prices in the Uniswap V2 USDC/WETH pool.
 * 
 * This function constructs the command to execute the price skewing script,
 * logs the command and paths for debugging purposes, and handles the execution
 * of the script. It returns a JSON response indicating the success or failure
 * of the operation.
 */
export async function POST() {
  // Note: Skewing might not need specific env vars unless the script itself requires them
  // We still run with process.env to ensure node path etc. are inherited correctly

  // Resolve paths assuming cwd is /Flash/frontend
  const projectRoot = path.resolve(process.cwd(), '..'); // Go up one level to /Flash
  const scriptPath = path.join(projectRoot, 'test', 'demo', 'skewPrices.js');
  const command = `node "${scriptPath}"`;

  // Log the command and paths for debugging purposes
  console.log(`API [Skew Prices]: Attempting to execute command: ${command}`);
  console.log(`API [Skew Prices]: Script path resolved to: ${scriptPath}`);
  console.log(`API [Skew Prices]: Current working directory: ${process.cwd()}`);
  console.log(`API [Skew Prices]: Calculated project root: ${projectRoot}`);

  try {
    // Execute the price skewing script
    const { stdout, stderr } = await execPromise(command, {
       env: { ...process.env },
       cwd: projectRoot // Execute the script from the project root directory
     });

    // Log the standard output from the script
    console.log('API [Skew Prices]: Script stdout:', stdout);
    if (stderr) {
      // Log any standard error output and return a warning in the response
      console.error('API [Skew Prices]: Script stderr:', stderr);
      return NextResponse.json({ success: true, output: stdout, warning: stderr });
    }
    // Return a success response with the script's output
    return NextResponse.json({ success: true, output: stdout });

  } catch (error: any) {
    // Log and return an error response if the script execution fails
    console.error('API [Skew Prices]: Error executing script:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute script', stderr: error.stderr, stdout: error.stdout },
      { status: 500 }
    );
  }
} 