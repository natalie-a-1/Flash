import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  if (!process.env.USDC_WHALE_ADDRESS) {
    console.error('API Error: USDC_WHALE_ADDRESS environment variable is not set.');
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Whale address missing.' },
      { status: 500 }
    );
  }

  const projectRoot = path.resolve(process.cwd(), '..');
  const scriptPath = path.join(projectRoot, 'test', 'demo', 'seedWallet.js');
  const command = `node "${scriptPath}"`;

  console.log(`API [Seed Wallet]: Attempting to execute command: ${command}`);
  console.log(`API [Seed Wallet]: Script path resolved to: ${scriptPath}`);
  console.log(`API [Seed Wallet]: Current working directory: ${process.cwd()}`);
  console.log(`API [Seed Wallet]: Calculated project root: ${projectRoot}`);

  try {
    const { stdout, stderr } = await execPromise(command, {
       env: { ...process.env },
       cwd: projectRoot
     });

    console.log('API [Seed Wallet]: Script stdout:', stdout);
    if (stderr) {
      console.error('API [Seed Wallet]: Script stderr:', stderr);
      return NextResponse.json({ success: true, output: stdout, warning: stderr });
    }
    return NextResponse.json({ success: true, output: stdout });

  } catch (error: any) {
    console.error('API [Seed Wallet]: Error executing script:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute script', stderr: error.stderr, stdout: error.stdout },
      { status: 500 }
    );
  }
} 