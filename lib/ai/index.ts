import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { customMiddleware } from './custom-middleware';

// 函数用于选择适当的提供商
const selectProvider = (apiIdentifier: string) => {
  if (apiIdentifier.startsWith('gpt-') || apiIdentifier.startsWith('text-davinci-')) {
    return openai;
  } else if (apiIdentifier === 'grok-beta') {
    return xai;
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