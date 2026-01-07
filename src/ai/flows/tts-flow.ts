'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) flow using Genkit and Google AI.
 *
 * - speak - A function that converts text to speech.
 * - SpeakInput - The input type for the speak function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

const SpeakInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  accent: z.enum(['US', 'UK']).default('US').describe('The accent of the voice.'),
  speed: z.number().min(0.25).max(4.0).default(1.0).describe('The speed of the speech.'),
  volume: z.number().min(0).max(1).default(1.0).describe('The volume of the speech.'),
});

export type SpeakInput = z.infer<typeof SpeakInputSchema>;

export async function speak(input: SpeakInput): Promise<string | null> {
  const result = await speakFlow(input);
  return result.audioDataUri;
}

const voiceMap = {
    US: 'en-US-Standard-C',
    UK: 'en-GB-Standard-A',
};

const speakFlow = ai.defineFlow(
  {
    name: 'speakFlow',
    inputSchema: SpeakInputSchema,
    outputSchema: z.object({
      audioDataUri: z.string().nullable(),
    }),
  },
  async (input) => {
    const { text, accent, speed } = input;

    // The Gemini TTS model is currently in preview and might have limitations.
    // It returns audio in PCM format.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Note: The list of prebuilt voices may change.
            // Using a simple mapping for US/UK accents.
            prebuiltVoiceConfig: { voiceName: voiceMap[accent] },
          },
          // Speed is available in some underlying APIs but might not be fully supported here yet.
          // This is a placeholder for when it becomes available.
          // speed: speed, 
        },
      },
      prompt: text,
    });
    
    if (!media || !media.url) {
      console.error('TTS generation failed, no media returned.');
      return { audioDataUri: null };
    }

    try {
      const pcmData = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      // Convert PCM to WAV format to be playable in browsers
      const wavData = await toWav(pcmData);
      return { audioDataUri: `data:audio/wav;base64,${wavData}` };
    } catch (error) {
      console.error('Error processing audio data:', error);
      return { audioDataUri: null };
    }
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000, // Gemini TTS default sample rate
  sampleWidth = 2 // 16-bit audio
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (chunk) => {
      bufs.push(chunk);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
