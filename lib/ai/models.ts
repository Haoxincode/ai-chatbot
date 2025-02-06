import { openai } from '@ai-sdk/openai';
import { fireworks } from '@ai-sdk/fireworks';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4o-mini'),
    'chat-model-large': openai('gpt-4o'),
    'chat-model-reasoning': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/deepseek-r1'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': openai('gpt-4-turbo'),
    'block-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'chat-model-large',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'gpt-4o-mini',
    name: 'Nebula Chat Plus',
    description: 'Nebula chat plus for EEA development',
  },
  // {
  //   id: 'gpt-4o',
  //   name: 'GPT 4o',
  //   description: 'For complex, multi-step tasks',
  // },
  {
    id: 'gemini-2-flash',
    name: 'Nebula Chat Flash',
    //apiIdentifier: 'gemini-2.0-flash-exp',
    description: 'Nebula chat flash for EEA development',
  },
  {
    id: 'groq-llama',
    name: 'Nebula Chat Ultra ',
    //apiIdentifier: 'llama-3.3-70b-versatile',
    description: 'Nebula chat ultra for EEA development ',
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
