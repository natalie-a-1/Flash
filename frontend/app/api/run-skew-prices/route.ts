import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  // Note: Skewing might not need specific env vars unless the script itself requires them
  // We still run with process.env to ensure node path etc. are inherited correctly

  // Resolve paths assuming cwd is /Flash/frontend
  const projectRoot = path.resolve(process.cwd(), '..'); // Go up one level to /Flash
  const scriptPath = path.join(projectRoot, 'test', 'demo', 'skewPrices.js');
  const command = `node "${scriptPath}"`;

  console.log(`API [Skew Prices]: Attempting to execute command: ${command}`);
  console.log(`API [Skew Prices]: Script path resolved to: ${scriptPath}`);
  console.log(`API [Skew Prices]: Current working directory: ${process.cwd()}`);
  console.log(`API [Skew Prices]: Calculated project root: ${projectRoot}`);

  try {
    const { stdout, stderr } = await execPromise(command, {
       env: { ...process.env },
       cwd: projectRoot // Execute the script from the project root directory
     });

    console.log('API [Skew Prices]: Script stdout:', stdout);
    if (stderr) {
      console.error('API [Skew Prices]: Script stderr:', stderr);
      return NextResponse.json({ success: true, output: stdout, warning: stderr });
    }
    return NextResponse.json({ success: true, output: stdout });

  } catch (error: any) {
    console.error('API [Skew Prices]: Error executing script:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute script', stderr: error.stderr, stdout: error.stdout },
      { status: 500 }
    );
  }
} 