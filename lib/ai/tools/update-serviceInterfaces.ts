import { generateUUID } from '@/lib/utils';
import {
  DataStreamWriter,
  tool,
} from 'ai';
import { z } from 'zod';
import { saveDocument,getDocumentById } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { Model } from '../models';
import { runDifyWorkflow } from './runDifyWorkflow';

interface CreateDocumentProps {
  model: Model;
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateServiceInterfaces = ({
  model,
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description: '根据用户反馈的修改意见，更新服务接口',
            parameters: z.object({
              id: z.string().describe('The ID of the last ServiceInterface document '),
              modifications:z.string().describe('用户反馈的修改意见')
            }),
            execute: async ({ id,modifications }) => {
              const document = await getDocumentById({ id });
      
              if (!document) {
                return {
                  error: 'Document not found',
                };
              }
              dataStream.writeData({
                type: 'clear',
                content: document.title,
              });
              try {
                const apiKey = process.env.DIFY_API_DIAGRAM_KEY; // DIFY_API_DIAGRAM_KEY
              if (!apiKey) {
                throw new Error('DIFY_API_KEY is not set');
              }
              
              const data = await runDifyWorkflow({previousVersion:document.content,modifications:modifications},apiKey,session);
              console.log(data)
              let result={serviceInterface:""}
              if(data.data.outputs && data.data.outputs.serviceinterface){
                const ssresult=JSON.parse(data.data.outputs.serviceinterface)
                result.serviceInterface=ssresult.serviceInterfaces
                
              }
              
              
              dataStream.writeData({ type: 'res', content: data.data.outputs }); 
              dataStream.writeData({ type: 'diagram', content: JSON.stringify(result) }); 
              dataStream.writeData({ type: 'finish', content: '' }); // 结束流
              if (session.user?.id) {
                await saveDocument({
                  id,
                  title:document.title,
                  
                  kind:"text",
                  content: JSON.stringify(result),
                  userId: session.user.id,
                });
              }
              return {
                id,
                kind:"text",
                title:document.title,
                content: 'A ServiceInterfaces was updated and is now visible to the user.',
              };
            }catch(e:any){
              console.error('Error running workflow:', e);
              return {
                error: 'Failed to run workflow',
                details: e.message,
              };
            }
            
    },
  });
