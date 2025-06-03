import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq API key not configured.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    console.log("Groq STT: Received audio file:", audioFile.name, audioFile.type, audioFile.size);

    // Groq SDK for audio transcriptions
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile, // Pass the File object
      model: 'whisper-large-v3', // Or other Whisper model supported by Groq
      // language: 'en', // Optional
      // response_format: 'json', // Default is json
    });

    console.log("Groq Whisper Transcription:", transcription.text);
    return NextResponse.json({ transcript: transcription.text });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error transcribing audio with Groq:', error.response?.data || error.message || error);
    let errorMessage = 'Failed to transcribe audio with Groq';
    if (error instanceof Groq.APIError) {
        errorMessage = `Groq API Error: ${error.status} ${error.name} ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}