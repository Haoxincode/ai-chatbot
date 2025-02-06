import { generateUUID } from '@/lib/utils';
import {
  DataStreamWriter,
  tool,
} from 'ai';
import { z } from 'zod';
import { saveDocument,getDocumentById } from '@/lib/db/queries';
import { Session } from 'next-auth';
import { runDifyWorkflow } from './runDifyWorkflow';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateServiceInterfaces = ({
  session,
  dataStream,
}: CreateDocumentProps) =>
  tool({
    description:"根据功能设计生成相关的服务接口",
            parameters: z.object({
              designId: z.string().describe('The ID of the last design document,如果没有id,提示用户先生成功能设计')
            }),
            execute: async ({ designId }) => {
              try {
                const apiKey = process.env.DIFY_API_DIAGRAM_KEY; // DIFY_API_DIAGRAM_KEY
              if (!apiKey) {
                throw new Error('DIFY_API_KEY is not set');
              }
              
              const document = await getDocumentById({ id:designId });
      
              if (!document) {
                return {
                  error: 'Document not found',
                };
              }
             // const streamingData = new StreamData();
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
                content: document.title,
              });
      
                const data = await runDifyWorkflow({"sequenceDiagram":document.content},apiKey,session);
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
                    title:document.title+"服务接口",
                    
                    kind:"text",
                    content: JSON.stringify(result),
                    userId: session.user.id,
                  });
                }
                return {
                  id,
                  title:document.title+"服务接口",
                  kind:"text",
                  content: 'A ServiceInterfaces was created and is now visible to the user.',
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
