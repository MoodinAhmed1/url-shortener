import { NextRequest, NextResponse } from 'next/server';
import { shortenUrl } from '../../../lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url: string; customCode?: string };
    const { url, customCode } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await shortenUrl(url, customCode || null);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to shorten URL" 
    }, { status: 500 });
  }
}