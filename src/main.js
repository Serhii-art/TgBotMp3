import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf(config.get("TELEGRAMM_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Welcome! I support: text, voice messages, and image generation in the text"
  );
});
bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "I am waiting for your voice or text message, you can also use the function of image generation using the (/dalle) command"
  );
});

import { Markup } from "telegraf";

bot.command("dalle", async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;

  try {
    await ctx.reply(
      "Please indicate the description for generating the image using DALL-E.",
      Markup.keyboard([["Отмена"]])
    );

    // Установка состояния "ожидания ответа"
    ctx.session.awaitingDescription = true;
  } catch (e) {
    console.log("Ошибка при обработке команды DALL-E:", e.message);
    await ctx.reply(
      "Произошла ошибка при использовании DALL-E. Попробуйте позже."
    );
  }
});

bot.on("text", async (ctx) => {
  ctx.session = ctx.session || INITIAL_SESSION;

  if (ctx.session.awaitingDescription) {
    const userDescription = ctx.message.text;

    if (userDescription.toLowerCase() === "отмена") {
      // If the user enters "Отмена," reset the state and notify
      ctx.reply("Генерация изображения DALL-E отменена.");
      ctx.session.awaitingDescription = false;
    } else {
      console.log("Ответ пользователя для DALL-E:", userDescription);

      try {
        const imageUrl = await openai.dallEGeneration(userDescription);
        await ctx.reply(
          `Your prompt "${userDescription}" expect, generating an image.`
        );
        console.log("URL изображения DALL-E:", imageUrl);

        // Send the image in response to the command
        await ctx.replyWithPhoto({ url: imageUrl });

        // Reset the "awaitingDescription" state
        ctx.session.awaitingDescription = false;
      } catch (e) {
        console.log("Error while using DALL-E:", e.message);
        await ctx.reply(
          "Произошла ошибка при использовании DALL-E. Попробуйте позже."
        );
      }
    }
  }
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("Сообщение принял, жду ответа от сервера..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Ваш запрос: ${text}`));
    ctx.session.messages.push({ role: openai.roles.USER, content: text });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (e) {
    console.log("Error while voice message:", e.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("Сообщение принял, жду ответа от сервера..."));

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (e) {
    console.log("Error while voice message:", e.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
