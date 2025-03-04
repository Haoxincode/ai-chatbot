import { openai } from '@ai-sdk/openai';
import { deepseek } from '@ai-sdk/deepseek';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': deepseek('deepseek-chat'),
    'chat-model-large': deepseek('deepseek-chat'),
    'chat-model-reasoning': wrapLanguageModel({
      model: deepseek('deepseek-reasoner'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': deepseek('deepseek-chat'),
    'block-model': deepseek('deepseek-chat'),
  },
/*   imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  }, */
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Nebula Chat Flash',
    description: 'Small model for fast, lightweight tasks for EEA development',
  },
  {
    id: 'chat-model-large',
    name: 'Nebula Chat Plus',
    description: 'Large model for complex, multi-step tasks for EEA development',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Nebula Reasoning model',
    description: 'Uses advanced reasoning for EEA development',
  },
];