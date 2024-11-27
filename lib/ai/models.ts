// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
/*   {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  }, */
  {
    id: 'grok-beta',
    label: 'Nebula Chat',
    apiIdentifier: 'grok-beta',
    description: 'Nebula chat for EEA development',
  },
/*   {
    id: 'grok-vision-beta',
    label: 'Grok Vision Beta',
    apiIdentifier: 'grok-vision-beta',
    description: 'xAI\'s multimodal model supporting image input',
  }, */
] as const;

export const DEFAULT_MODEL_NAME: string = 'grok-beta';