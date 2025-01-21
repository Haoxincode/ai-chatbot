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
    description: 'Nebula chat flash for EEA development',
  },
  {
    id: 'groq-llama',
    label: 'Nebula Chat Ultra ',
    apiIdentifier: 'llama-3.3-70b-versatile',
    description: 'Nebula chat ultra for EEA development ',
  }
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';

