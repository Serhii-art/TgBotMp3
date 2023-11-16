import OpenAI from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenIA {
  roles = {
    ASSISTANT: "assistant",
    USER: "user",
    SYSTEM: "system",
  };
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey, // Используем переданный API-ключ
    });
  }

  async chat(messages) {
    try {
      const response = await this.openai.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo",
      });
      return response.choices[0].message;
    } catch (e) {
      console.log("Error while gpt Chat: ");
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        model: "whisper-1",
        file: createReadStream(filepath), // Передаем поток файла, созданный из пути к файлу
      });
      return response.text;
      //   return response.data.text;
    } catch (e) {
      console.log("Error while transcriptions: ", e.message);
    }
  }
}

// export const openai = new OpenIA(config.get("OPENAI_KEY"));

export const openai = new OpenIA(
  process.env.OPENAI_API_KEY || config.get("OPENAI_KEY")
);
