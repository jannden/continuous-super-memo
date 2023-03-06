// import AWS from "aws-sdk";
import {
  TranslateClient,
  TranslateTextCommand
} from "@aws-sdk/client-translate";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

// Keep this private - shouldn't use in frontend
const AWS_REGION = "";
const AWS_ACCESS_KEY_ID = "";
const AWS_SECRET_ACCESS_KEY = "";

const translator = new TranslateClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

const translateCall = async (textForTranslation: string) => {
  const params = {
    SourceLanguageCode: "it",
    TargetLanguageCode: "en",
    Text: textForTranslation
  };

  try {
    const command = new TranslateTextCommand(params);
    return await translator.send(command);
  } catch (e) {
    console.log("translationCall:", e);
    return null;
  }
};

const polly = new PollyClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

const pollyCall = async (text: string) => {
  const params = {
    OutputFormat: "mp3",
    Text: text,
    TextType: "text",
    VoiceId: "Bianca" // Bianca for neural Italian, Carla for Spanish, Joanna for English, Marlene for German
  };

  try {
    const command = new SynthesizeSpeechCommand(params);
    const data = await polly.send(command);
    return data;
  } catch (e) {
    console.log("pollyCall:", e);
    return null;
  }
};

export const getTranslation = async (text: string): Promise<string> => {
  const result = await translateCall(text);
  return result?.TranslatedText || "";
};

export const getAudioReadableStream = async (
  text: string
): Promise<ReadableStream> => {
  const data = await pollyCall(text);
  const stream = data?.AudioStream;
  const reader = stream && stream.getReader();
  return new ReadableStream({
    start(controller) {
      function pump() {
        return reader.read().then(({ done, value }) => {
          // When no more data needs to be consumed, close the stream
          if (done) {
            controller.close();
            return;
          }
          // Enqueue the next data chunk into our target stream
          controller.enqueue(value);
          return pump();
        });
      }
      return pump();
    }
  });
};
