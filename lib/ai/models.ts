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
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'grok-beta',
    label: 'Nebula Chat Flash',
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