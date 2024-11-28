import {
  type Message,
  StreamData,
  convertToCoreMessages,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
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
  | 'functionDesign'|"diagram"|
  "updateDesign"
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  "updateDesign",
  'requestSuggestions','functionDesign',"diagram"
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

  await saveMessages({
    messages: [
      { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  });

  const streamingData = new StreamData();

  const runDifyWorkflow=async(usecase:string,apiKey:string)=>{
    const response = await fetch('https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { usecase:usecase },
        response_mode: "blocking",
        user: "v0-publish"
      }),
    })
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`+apiKey+JSON.stringify(response));
    }
  
    const data = await response.json()
    return data
  }

  const result = await streamText({
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
      functionDesign:{
        description: 'Run a Dify workflow and parse the result',
        parameters: z.object({
          useCase: z.string().describe('The use case for the workflow'),
        }),
        execute: async ({ useCase }) => {
          const apiKey = process.env.DIFY_API_KEY; // 确保在环境变量中设置了DIFY_API_KEY
          if (!apiKey) {
            throw new Error('DIFY_API_KEY is not set');
          }
          
          const streamingData = new StreamData();
          const id = generateUUID();
          let draftText = '';

          streamingData.append({
            type: 'id',
            content: id,
          });

          streamingData.append({
            type: 'title',
            content: useCase,
          });

          streamingData.append({
            type: 'clear',
            content: '',
          });
          try {
            const data = await runDifyWorkflow(useCase,apiKey);
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
              
              streamingData.append({ type: 'design', content: JSON.stringify(result) }); 
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

            streamingData.append({ type: 'finish', content: '' }); // 结束流
            if (session.user?.id) {
              await saveDocument({
                id,
                title:useCase,
                content: JSON.stringify(result),
                userId: session.user.id,
              });
            }
  
            return {
              id,
              title:useCase,
              content: 'A FunctionDesign was created and is now visible to the user.',
            };
          } catch (error:any) {
            console.error('Error running Dify workflow:', error);
            return {
              error: 'Failed to run Dify workflow',
              details: error.message,
            };
          }
        },
      },
      updateDesign: {
        description: 'Update a functionDesign with the given usecase',
        parameters: z.object({
          id: z.string().describe('The ID of the document to update'),
          useCase: z.string().describe('The use case for the workflow'),
        }),
        execute: async ({ id, useCase }) => {
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

          streamingData.append({
            type: 'clear',
            content: document.title,
          });

          try {
            const data = await runDifyWorkflow(useCase,apiKey);
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
              
              streamingData.append({ type: 'design', content: JSON.stringify(result) }); 
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
                content: draftText,
                userId: session.user.id,
              });
            }
  
            return {
              id,
              title: document.title,
              content: 'The functionDesign has been updated successfully.',
            };
          } catch (error:any) {
            console.error('Error running Dify workflow:', error);
            return {
              error: 'Failed to run Dify workflow',
              details: error.message,
            };
          }
        }
      },
      diagram:{
        description:"creat a diagram for a use case",
        parameters: z.object({
          useCase: z.string(),
        }),
        execute: async ({ useCase }) => {
          try {
            const apiKey = process.env.DIFY_API_DIAGRAM_KEY; // 确保在环境变量中设置了DIFY_API_KEY
          if (!apiKey) {
            throw new Error('DIFY_API_KEY is not set');
          }
          
          const streamingData = new StreamData();
          const id = generateUUID();
          let draftText = '';

          streamingData.append({
            type: 'id',
            content: id,
          });

          streamingData.append({
            type: 'title',
            content: useCase,
          });

          streamingData.append({
            type: 'clear',
            content: '',
          });
            const data = await runDifyWorkflow(useCase,apiKey);
            const result=JSON.parse(data.data.outputs.serviceinterface).serviceInterfaces
            
            streamingData.append({ type: 'diagram', content: JSON.stringify({serviceInterface:result}) }); 
            streamingData.append({ type: 'finish', content: '' }); // 结束流
            if (session.user?.id) {
              await saveDocument({
                id,
                title:useCase,
                content: JSON.stringify(result),
                userId: session.user.id,
              });
            }
  
            return {
              id,
              title:useCase,
              content: 'A Diagram was created and is now visible to the user.',
            };
          }catch(e:any){
            console.error('Error running Dify workflow:', e);
            return {
              error: 'Failed to run Dify workflow',
              details: e.message,
            };
          }
        }

      },
      createDocument: {
        description: 'Create a document for a writing activity',
        parameters: z.object({
          title: z.string(),
        }),
        execute: async ({ title }) => {
          const id = generateUUID();
          let draftText = '';

          streamingData.append({
            type: 'id',
            content: id,
          });

          streamingData.append({
            type: 'title',
            content: title,
          });

          streamingData.append({
            type: 'clear',
            content: '',
          });

          const { fullStream } = await streamText({
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
              streamingData.append({
                type: 'text-delta',
                content: textDelta,
              });
            }
          }

          streamingData.append({ type: 'finish', content: '' });

          if (session.user?.id) {
            await saveDocument({
              id,
              title,
              content: draftText,
              userId: session.user.id,
            });
          }

          return {
            id,
            title,
            content: 'A document was created and is now visible to the user.',
          };
        },
      },
      updateDocument: {
        description: 'Update a document with the given description',
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

          streamingData.append({
            type: 'clear',
            content: document.title,
          });

          const { fullStream } = await streamText({
            model: customModel(model.apiIdentifier),
            system:
              'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
            experimental_providerMetadata: {
              openai: {
                prediction: {
                  type: 'content',
                  content: currentContent,
                },
              },
            },
            messages: [
              {
                role: 'user',
                content: description,
              },
              { role: 'user', content: currentContent },
            ],
          });

          for await (const delta of fullStream) {
            const { type } = delta;

            if (type === 'text-delta') {
              const { textDelta } = delta;

              draftText += textDelta;
              streamingData.append({
                type: 'text-delta',
                content: textDelta,
              });
            }
          }

          streamingData.append({ type: 'finish', content: '' });

          if (session.user?.id) {
            await saveDocument({
              id,
              title: document.title,
              content: draftText,
              userId: session.user.id,
            });
          }

          return {
            id,
            title: document.title,
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

          const { elementStream } = await streamObject({
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

            streamingData.append({
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
            message: 'Suggestions have been added to the document',
          };
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user?.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(responseMessages);

          await saveMessages({
            messages: responseMessagesWithoutIncompleteToolCalls.map(
              (message) => {
                const messageId = generateUUID();

                if (message.role === 'assistant') {
                  streamingData.appendMessageAnnotation({
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

      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
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
