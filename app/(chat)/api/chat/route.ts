import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

//export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'generateFunctionDesign'|"generateServiceInterfaces"|
  "updateFunctionDesign"|"updateServiceInterfaces"|'createMermaid'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  "updateFunctionDesign",
  'requestSuggestions','generateFunctionDesign',"generateServiceInterfaces","updateServiceInterfaces",'createMermaid'
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });

      const runDifyWorkflow=async(params:any,apiKey:string)=>{
    
        let user=session&&session.user ?session.user.email:'v0'
        const response = await fetch('https://api.dify.ai/v1/workflows/run', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: { ...params },
            response_mode: "blocking",
            user: user
          }),
        })
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`+apiKey+JSON.stringify(response));
        }
      
        const data = await response.json()
        return data
      }
    
  const result = streamText({
    model: customModel(model.apiIdentifier),
    system: systemPrompt,
    messages: coreMessages,
    maxSteps: 5,
    experimental_activeTools: allTools,
    tools: {
      getWeather: {
        description: 'Get the current weather at a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
          );

              const weatherData = await response.json();
              return weatherData;
            },
          },
          generateFunctionDesign:{
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
                const data = await runDifyWorkflow({usecase:useCase},apiKey);
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
      
                // const reader = response.body?.getReader(); // 获取读取器
                // const decoder = new TextDecoder("utf-8");
                // let result = { sequencediagram: '', markdownContent: "" };
                // if(!reader){
                //   throw new Error(`Workflow error: no result`);
                // }
                // while (true) {
                //   const { done, value } = await reader.read(); // 读取流数据
                //   if (done) break;
                //   const chunk = decoder.decode(value, { stream: true });
                //   // 处理流数据并更新 result
                //   // 这里可以根据实际返回的数据格式进行解析和更新 result
                //   // 例如：
                //   let text= chunk.data.outputs.text
                //   draftText += chunk;
                //   streamingData.append({ type: 'design', content: chunk }); // 将流数据添加到 streamingData
                // }
      
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
          },
          updateFunctionDesign: {
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
                const data = await runDifyWorkflow({modifications:modifications,previousVersion:document.content,},apiKey);
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
            }
          },
          generateServiceInterfaces:{
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
      
                const data = await runDifyWorkflow({"sequenceDiagram":document.content},apiKey);
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
            }
      
          },
          updateServiceInterfaces:{
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
              
              const data = await runDifyWorkflow({previousVersion:document.content,modifications:modifications},apiKey);
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
          }
      
          },
          createMermaid:{
            description: 'Create a mermaid code for a writing activity.如果有图片识别图片的时序图并触发createmermaid。',
            parameters: z.object({
              title: z.string(),
            }),
            execute: async ({ title, kind='text' }) => {
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
                system:
                  'Write mermaid about the given topic. ',
                prompt: title,
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
                      kind,
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
          createDocument: {
            description: 'Create a document for a writing activity.',
            parameters: z.object({
              title: z.string(),
              kind: z.enum(['text', 'code']),
            }),
            execute: async ({ title, kind }) => {
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

          if (kind === 'text') {
            const { fullStream } = streamText({
              model: customModel(model.apiIdentifier),
              system:
                'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
              prompt: title,
            });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'text-delta') {
                    const { textDelta } = delta;

                    draftText += textDelta;
                    dataStream.writeData({
                      type: 'text-delta',
                      content: textDelta,
                    });
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (kind === 'code') {
                const { fullStream } = streamObject({
                  model: customModel(model.apiIdentifier),
                  system: codePrompt,
                  prompt: title,
                  schema: z.object({
                    code: z.string(),
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'object') {
                    const { object } = delta;
                    const { code } = object;

                    if (code) {
                      dataStream.writeData({
                        type: 'code-delta',
                        content: code ?? '',
                      });

                      draftText = code;
                    }
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              }

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title,
                  kind,
                  content: draftText,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title,
                kind,
                content:
                  'A document was created and is now visible to the user.',
              };
            },
          },
          updateDocument: {
            description: 'Update a document with the given description.',
            parameters: z.object({
              id: z.string().describe('The ID of the document to update'),
              description: z
                .string()
                .describe('The description of changes that need to be made'),
            }),
            execute: async ({ id, description }) => {
              const document = await getDocumentById({ id });

              if (!document) {
                return {
                  error: 'Document not found',
                };
              }

              const { content: currentContent } = document;
              let draftText = '';

              dataStream.writeData({
                type: 'clear',
                content: document.title,
              });

          if (document.kind === 'text') {
            const { fullStream } = streamText({
              model: customModel(model.apiIdentifier),
              system: updateDocumentPrompt(currentContent),
              prompt: description,
              experimental_providerMetadata: {
                openai: {
                  prediction: {
                    type: 'content',
                    content: currentContent,
                  },
                },
              },
            });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'text-delta') {
                    const { textDelta } = delta;

                    draftText += textDelta;
                    dataStream.writeData({
                      type: 'text-delta',
                      content: textDelta,
                    });
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              } else if (document.kind === 'code') {
                const { fullStream } = streamObject({
                  model: customModel(model.apiIdentifier),
                  system: updateDocumentPrompt(currentContent),
                  prompt: description,
                  schema: z.object({
                    code: z.string(),
                  }),
                });

                for await (const delta of fullStream) {
                  const { type } = delta;

                  if (type === 'object') {
                    const { object } = delta;
                    const { code } = object;

                    if (code) {
                      dataStream.writeData({
                        type: 'code-delta',
                        content: code ?? '',
                      });

                      draftText = code;
                    }
                  }
                }

                dataStream.writeData({ type: 'finish', content: '' });
              }

              if (session.user?.id) {
                await saveDocument({
                  id,
                  title: document.title,
                  content: draftText,
                  kind: document.kind,
                  userId: session.user.id,
                });
              }

              return {
                id,
                title: document.title,
                kind: document.kind,
                content: 'The document has been updated successfully.',
              };
            },
          },
          requestSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z
                .string()
                .describe('The ID of the document to request edits'),
            }),
            execute: async ({ documentId }) => {
              const document = await getDocumentById({ id: documentId });

              if (!document || !document.content) {
                return {
                  error: 'Document not found',
                };
              }

              const suggestions: Array<
                Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
              > = [];

          const { elementStream } = streamObject({
            model: customModel(model.apiIdentifier),
            system:
              'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
            prompt: document.content,
            output: 'array',
            schema: z.object({
              originalSentence: z.string().describe('The original sentence'),
              suggestedSentence: z.string().describe('The suggested sentence'),
              description: z
                .string()
                .describe('The description of the suggestion'),
            }),
          });

              for await (const element of elementStream) {
                const suggestion = {
                  originalText: element.originalSentence,
                  suggestedText: element.suggestedSentence,
                  description: element.description,
                  id: generateUUID(),
                  documentId: documentId,
                  isResolved: false,
                };

                dataStream.writeData({
                  type: 'suggestion',
                  content: suggestion,
                });

                suggestions.push(suggestion);
              }

              if (session.user?.id) {
                const userId = session.user.id;

                await saveSuggestions({
                  suggestions: suggestions.map((suggestion) => ({
                    ...suggestion,
                    userId,
                    createdAt: new Date(),
                    documentCreatedAt: document.createdAt,
                  })),
                });
              }

              return {
                id: documentId,
                title: document.title,
                kind: document.kind,
                message: 'Suggestions have been added to the document',
              };
            },
          },
        },
        onFinish: async ({ response }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
