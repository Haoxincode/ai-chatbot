import { generateUUID } from '@/lib/utils';
import {
  DataStreamWriter,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';
import { customModel, imageGenerationModel } from '..';
import { codePrompt } from '../prompts';
import { saveDocument } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { Model } from '../models';

interface CreateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const createMermaid = ({
  model,
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description: '识别图片中的图表类型(如时序图、流程图等),并生成对应的mermaid代码。当检测到图片输入时自动触发此工具。',
            
            parameters: z.object({
              title: z.string(),
              image:z.string().describe('含图表类型的图片'),
            }),
            execute: async ({ title,image }) => {
                let kind='text'
              const id = generateUUID();
              let draftText = '';

              dataStream.writeData({
                type: 'id',
                content: id,
              });

              dataStream.writeData({
                type: 'title',
                content: title,
              });

              dataStream.writeData({
                type: 'kind',
                content: kind,
              });

              dataStream.writeData({
                type: 'clear',
                content: '',
              });

              const { fullStream } = streamText({
                model: customModel(model.apiIdentifier),
                experimental_transform: smoothStream({ chunking: 'word' }),
                system: `
                You are a specialized assistant for diagram recognition and mermaid code generation.
                1. First analyze the input image and identify its diagram type (sequence diagram, flowchart, class diagram, stateDiagram, requirement diagram, erDiagram, etc.)
                2. Based on the recognition result, generate corresponding standard mermaid code
                3. Output only the mermaid code, without any explanatory text
                4. Ensure the generated code complies with mermaid syntax specifications
                
                Rules:
                - For sequence diagrams: Use 'sequenceDiagram' syntax
                - For flowcharts: Use 'graph TD' or 'graph LR' syntax
                - For class diagrams: Use 'classDiagram' syntax
                - For state diagrams: Use 'stateDiagram-v2' syntax
                - For entity relationship diagrams: Use 'erDiagram' syntax
                - For requirement diagrams: Use 'requirementDiagram' syntax with:
                    * requirement syntax: requirement [id] { text }
                    * element syntax: element [id] { text }
                    * relationship types: contains, copies, derives, satisfies, verifies, refines, traces
                    * proper arrow syntax: |o--|, |--|>, etc.
                
                Remember to maintain proper indentation and syntax structure in the generated code.
            `,
                prompt: title+"图片描述："+image,
              });
  
                  for await (const delta of fullStream) {
                    const { type } = delta;
  
                    if (type === 'text-delta') {
                      const { textDelta } = delta;
  
                      draftText += textDelta;
                      dataStream.writeData({
                        type: 'mermaid',
                        content: textDelta,
                      });
                    }
                  }
  
                  dataStream.writeData({ type: 'finish', content: '' });
                  if (session.user?.id) {
                    await saveDocument({
                      id,
                      title,
                      kind:"text",
                      content: draftText,
                      userId: session.user.id,
                    });
                  }
    
                  return {
                    id,
                    title,
                    kind,
                    content:
                      'A mermaid was created and is now visible to the user.',
                  };
            }
          },
  )