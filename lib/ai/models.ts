// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'Nebula Chat Plus',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Nebula chat plus for EEA development',
  },
/*   {
    id: 'gpt-4o',
    label: 'GPT-4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  }, */
  {
    id: 'gemini-2-flash',
    label: 'Nebula Chat Flash',
    apiIdentifier: 'gemini-2.0-flash-exp',
    description: 'Fast and efficient Gemini model for Nebula chat',
  },
/*   {
    id: 'grok-2-1212',
    label: 'Nebula Chat Flash',
    apiIdentifier: 'grok-2-1212',
    description: 'Nebula chat for EEA development',
  }, */
/*   {
    id: 'grok-2-vision-1212',
    label: 'Grok Vision Beta',
    apiIdentifier: 'grok-2-vision-1212',
    description: 'xAI\'s multimodal model supporting image input',
  }, */
  {
    id: 'groq-llama',
    label: 'Nebula Chat Ultra ',
    apiIdentifier: 'llama-3.3-70b-versatile',
    description: 'Nebula chat ultra for EEA development ',
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';

