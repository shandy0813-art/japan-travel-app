import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_PATH = join(DATA_DIR, 'trip.json');

function readData() {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return { state: null, lastModified: 0 };
  }
}

export async function GET() {
  return NextResponse.json(readData());
}

export async function POST(req: Request) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const state = await req.json();
    const data = { state, lastModified: Date.now() };
    writeFileSync(DATA_PATH, JSON.stringify(data), 'utf8');
    return NextResponse.json({ lastModified: data.lastModified });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
