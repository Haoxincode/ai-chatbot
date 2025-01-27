import { generateUUID } from '@/lib/utils';
import {
  DataStreamWriter,
  tool,
} from 'ai';
import { z } from 'zod';
import { saveDocument } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { Model } from '../models';
import { runDifyWorkflow } from './runDifyWorkflow';

interface CreateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateFunctionDesign = ({
  model,
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description: '根据输入用例生成时序图及其相应的描述',
    parameters: z.object({
        useCase: z.string().describe('User-described use case'),
    }),
    execute: async ({ useCase }) => {
        const apiKey = process.env.DIFY_API_KEY; // 确保在环境变量中设置了DIFY_API_KEY
        if (!apiKey) {
          throw new Error('DIFY_API_KEY is not set');
        }
        
        const id = generateUUID();
        let draftText = '';

        dataStream.writeData({
          type: 'clear',
          content: '',
        });
        dataStream.writeData({
          type: 'id',
          content: id,
        });

        dataStream.writeData({
          type: 'kind',
          content: "text",
        });
        dataStream.writeData({
          type: 'title',
          content: useCase,
        });

        try {
          const data = await runDifyWorkflow({usecase:useCase},apiKey,session);
          let result={sequencediagram:'',markdownContent :""}
          if (data.data && data.data.outputs) {
            if (data.data.outputs.sequencediagram) {
              const sequenceDiagramCode = data.data.outputs.sequencediagram.replace(/```zenuml\n|\n```/g, '')
              result.sequencediagram=sequenceDiagramCode
            }
            if (data.data.outputs.sequenceDescription) {
              // Extract markdown content from the code block
              const markdownContent = data.data.outputs.sequenceDescription.replace(/```markdown\n|\n```/g, '')
              result.markdownContent=markdownContent
            }
            
            dataStream.writeData({ type: 'design', content: JSON.stringify(result) }); 
          }else {
            throw new Error('Invalid response format')
          }
          if (data.error) {
            throw new Error(`Workflow error: ${data.error}`);
          }

          dataStream.writeData({ type: 'finish', content: '' }); // 结束流
          if (session.user?.id) {
            await saveDocument({
              id,
              title:useCase,
              kind:'text',
              content: JSON.stringify(result),
              userId: session.user.id,
            });
          }
        
     

      return {
        id,
        kind:'text',
        title:useCase,
        content: 'A generateFunctionDesign was created and is now visible to the user.',
     
      };
    } catch (error:any) {
        console.error('Error running workflow:', error);
        return {
          error: 'Failed to run workflow',
          details: error.message,
        };
      }
    },
  });
