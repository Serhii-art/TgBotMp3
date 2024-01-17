import OpenAI from 'openai'
import config from 'config'
import { createReadStream } from 'fs'

class OpenIA {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system'
  }

  constructor (apiKey) {
    this.openai = new OpenAI({
      key: apiKey // Use the passed API key
    })
  }

  async chat (messages) {
    try {
      const response = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo'
      })
      return response.choices[0].message
    } catch (e) {
      console.log('Error while gpt Chat: ', e.message)
    }
  }

  async transcription (filepath) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: createReadStream(filepath)
      })
      return response.text
    } catch (e) {
      console.log('Error while transcriptions: ', e.message)
    }
  }

  async dallEGeneration (
    prompt = 'a white siamese cat',
    size = '1024x1024',
    quality = 'standard',
    n = 1
  ) {
    try {
      console.log('Before DALL-E request')
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        n
      })
      console.log('After DALL-E request:', response.data)

      // Check if the response has the expected structure
      if (response.data && response.data.length > 0 && response.data[0].url) {
        const imageUrl = response.data[0].url
        console.log('URL изображения DALL-E:', imageUrl)
        return imageUrl
      } else {
        console.log('Invalid response structure from DALL-E')
        throw new Error('Invalid response structure from DALL-E')
      }
    } catch (e) {
      console.log('Error while generating image with DALL-E: ', e.message)
      throw e
    }
  }
}
export const openai = new OpenIA(
  process.env.OPENAI_API_KEY || config.get('OPENAI_KEY')
)
