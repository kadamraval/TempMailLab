
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log the entire body to the console for debugging
    console.log('--- INCOMING WEBHOOK BODY ---');
    console.log(JSON.stringify(body, null, 2));
    
    // For now, return a success response to prevent timeout errors during debug
    return NextResponse.json({ message: "Request received and logged." }, { status: 200 });

  } catch (error: any) {
    console.error("Critical error in inboundWebhook API route:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Bad Request: Invalid JSON body." }, { status: 400 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
