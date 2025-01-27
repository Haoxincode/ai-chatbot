import { generateUUID, } from '@/lib/utils';
import {
  DataStreamWriter,
  tool,
} from 'ai';
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { Model } from '../models';
import { runDifyWorkflow } from './runDifyWorkflow';

interface CreateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}



export const updateFunctionDesign = ({
  model,
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description: '根据用户反馈的修改意见，更新功能设计。',
            parameters: z.object({
              id: z.string().describe('The ID of the last function design document to update'),
              modifications:z.string().describe('用户反馈的修改意见')
            }),
            execute: async ({ id, modifications }) => {
              const document = await getDocumentById({ id });
      
              if (!document) {
                return {
                  error: 'Document not found',
                };
              }
              const apiKey = process.env.DIFY_API_KEY; // 确保在环境变量中设置了DIFY_API_KEY
              if (!apiKey) {
                throw new Error('DIFY_API_KEY is not set');
              }
      
              const { content: currentContent } = document;
              let draftText = '';
      
              dataStream.writeData({
                type: 'clear',
                content: document.title,
              });
      
              try {
                const data = await runDifyWorkflow({modifications:modifications,previousVersion:document.content,},apiKey,session);
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
                if (session.user?.id) {
                  await saveDocument({
                    id,
                    title: document.title,
                    kind:"text",
                    content: JSON.stringify(result),
                    userId: session.user.id,
                  });
                }
      
                dataStream.writeData({ type: 'finish', content: '' });
                return {
                  id,
                  kind:"text",
                  title: document.title,
                  content: 'The generateFunctionDesign has been updated successfully.',
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
