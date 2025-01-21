import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { customMiddleware } from './custom-middleware';

// 函数用于选择适当的提供商
const selectProvider = (apiIdentifier: string) => {
  if (apiIdentifier.startsWith('gpt-') || apiIdentifier.startsWith('text-davinci-')) {
    return openai;
  } else if (apiIdentifier === 'llama-3.3-70b-versatile') {
    return groq;
  } else if (apiIdentifier.startsWith('gemini-')) {
    return google;
  } else {
    throw new Error(`不支持的模型: ${apiIdentifier}`);
  }
};

export const customModel = (apiIdentifier: string) => {
  const provider = selectProvider(apiIdentifier);
  
  return wrapLanguageModel({
    model: provider(apiIdentifier),
    middleware: customMiddleware,
  });
};

