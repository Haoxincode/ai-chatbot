import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Connection,
} from 'reactflow'
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,useRef
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {useCopyToClipboard, useDebounceCallback, useWindowSize } from 'usehooks-ts';
import {createNodes,getLayoutedElements,ServiceInterfaceNode,downloadIDL,EventNode,FieldNode,MethodNode,generateIDL}from './diagram'


import type { Document, Suggestion, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { DiffView } from './diffview';
import { DocumentSkeleton } from './document-skeleton';
import { Editor } from './editor';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { Button } from './ui/button';
import { VersionFooter } from './version-footer';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';


import { BlockActions } from './block-actions';
import { BlockCloseButton } from './block-close-button';
import { BlockMessages } from './block-messages';
import ReactMarkdown from 'react-markdown'

import Diagram from '@zenuml/core'
import { Download } from 'lucide-react';

const nodesType={
  serviceInterface: ServiceInterfaceNode,
  method: MethodNode,
  field: FieldNode,
  event: EventNode
}
interface ZenUMLRendererProps {
    code: string
    height: string
    width: string
  }
  
  function ZenUMLRenderer({ code, height, width }: ZenUMLRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      if (containerRef.current) {
        const diagram = new Diagram(containerRef.current)
        diagram.render(code)
      }
    }, [code])
  
    return (
      <div 
        ref={containerRef} 
        style={{ height, width, border: '1px solid #ddd', borderRadius: '4px' }}
      />
    )
  }
export interface UIBlock {
  title: string;
  documentId: string;
  content: string;
  sequenceDiagram?:any
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureBlock({
  chatId,
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  block,
  setBlock,
  messages,
  setMessages,
  votes,
}: {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  votes: Array<Vote> | undefined;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
}) {
  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    block && block.status !== 'streaming'
      ? `/api/document?id=${block.documentId}`
      : null,
    fetcher,
  );

  const { data: suggestions } = useSWR<Array<Suggestion>>(
    documents && block && block.status !== 'streaming'
      ? `/api/suggestions?documentId=${block.documentId}`
      : null,
    fetcher,
    {
      dedupingInterval: 5000,
    },
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setBlock((currentBlock) => ({
          ...currentBlock,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setBlock]);

  useEffect(() => {
    mutateDocuments();
  }, [block.status, mutateDocuments]);


  const [diagramCode, setDiagramCode] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const [serviceInterfaces, setServiceInterfaces] = useState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  useEffect(() => {
    if (serviceInterfaces.length > 0) {
      const { nodes: newNodes, edges: newEdges } = createNodes(serviceInterfaces)
      const { nodes:  layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges)
      setNodes([...layoutedNodes])
      setEdges([...layoutedEdges])
    }
  }, [serviceInterfaces, setNodes, setEdges])

  const parseDiagram=(content:any)=>{
    try{
      let relsequenceDiagram=JSON.parse(content)
      console.log(relsequenceDiagram)
      if(relsequenceDiagram &&relsequenceDiagram.sequencediagram){
        setDiagramCode(relsequenceDiagram.sequencediagram)
      }
      if(relsequenceDiagram &&relsequenceDiagram.markdownContent){
        setDescription(relsequenceDiagram.markdownContent)
      }
    }catch(e){
      console.log(e,'parseDiagramError')
    }
  }
  const parseInterface=(content:any)=>{
    try{
      let service=JSON.parse(content)
      if(service &&service.serviceInterface){
        setServiceInterfaces(service.serviceInterface)
      }
    }catch(e){
      console.log(e)
    }
  }
  useEffect(() => {
      // 假设您在这里获取 generateFunctionDesign 的输出
      const { content } = block; // 根据实际情况调整

      console.log(block)
      if(content ){
        if(content.indexOf('sequencediagram')>-1){
        
          parseDiagram(content)
        
        }
        if(content.indexOf('serviceInterface')>-1){
            parseInterface(content)
        }
      }
      
      // if (sequenceDiagram && sequenceDiagram.includes('sequenceDescription')) {
      //   let str= sequenceDiagram.split('outputs')[1].replace(':','')
      //   let rel=str.split('sequenceDescription')[0]
        
      //   try{
      //     let se=str.split("sequencediagram")[1]
      //     se=se.split(",")[0]
      //     const sequenceDiagramCode = se.replace(/```zenuml\n|\n```/g, '')
      //     if(sequenceDiagramCode){
      //       setDiagramCode(sequenceDiagramCode);
      //     }
      //     if(str.indexOf('error')){
      //       let other=str.split('sequenceDescription')[1].replace(":","")
      //       let others=other.split('}')[0]
      //       other= others.replace(/```markdown\n|\n```/g, '')
      //       if(other){
      //         setDescription(other);
      //       }
      //     }else{
      //       let other=str.split('sequenceDescription')[1].replace(":","")
      //       other= other.replace(/```markdown\n|\n```/g, '')
      //       if(other){
      //         setDescription(other);
      //       }
      //     }
      //   }catch(e){
      //     console.error('parse error',sequenceDiagram,rel)
      //   }
       
      // }
      
  }, [block]);
  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!block) return;

      mutate<Array<Document>>(
        `/api/document?id=${block.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${block.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: block.title,
                content: updatedContent,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [block, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    let curIndex=currentVersionIndex
    if (type === 'latest') {
      curIndex=documents.length - 1
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode:any) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        curIndex=currentVersionIndex-1
        setCurrentVersionIndex((index:number) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        curIndex=currentVersionIndex+1
        setCurrentVersionIndex((index:number) => index + 1);
      }
    }
    console.log(curIndex)
    setCurrentVersionIndex(curIndex)
    if(diagramCode && documents[curIndex].content){
      parseDiagram(documents[curIndex].content)
    }
    if(serviceInterfaces && documents[curIndex].content){
      parseInterface(documents[curIndex].content)
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const handleExport = () => {
    if (serviceInterfaces.length > 0) {
      const idl = generateIDL(serviceInterfaces);
      downloadIDL(idl);
    } else {
      //setError('No service interfaces to export');
    }
  };
  return (
    <motion.div
      className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-muted"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.4 } }}
    >
      {!isMobile && (
        <motion.div
          className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0.95,
            transition: { delay: 0 },
          }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full justify-between items-center gap-4">
            
            <BlockMessages
               chatId={chatId}
               block={block}
               isLoading={isLoading}
               setBlock={setBlock}
               votes={votes}
               messages={messages}
             />
 

            <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
              />
            </form>
          </div>
        </motion.div>
      )}

      <motion.div
        className="fixed dark:bg-muted bg-background h-dvh flex flex-col shadow-xl overflow-y-scroll"
        initial={
          isMobile
            ? {
                opacity: 0,
                x: 0,
                y: 0,
                width: windowWidth,
                height: windowHeight,
                borderRadius: 50,
              }
            : {
                opacity: 0,
                x: block.boundingBox.left,
                y: block.boundingBox.top,
                height: block.boundingBox.height,
                width: block.boundingBox.width,
                borderRadius: 50,
              }
        }
        animate={
          isMobile
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                width: windowWidth,
                height: '100dvh',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
            : {
                opacity: 1,
                x: 400,
                y: 0,
                height: windowHeight,
                width: windowWidth ? windowWidth - 400 : 'calc(100dvw-400px)',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          transition: {
            delay: 0.1,
            type: 'spring',
            stiffness: 600,
            damping: 30,
          },
        }}
      >
        <div className="p-2 flex flex-row justify-between items-start">
          <div className="flex flex-row gap-4 items-start">
            <BlockCloseButton setBlock={setBlock} />

            <div className="flex flex-col">
              <div className="font-medium">
                {document?.title ?? block.title}
              </div>

              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(
                    new Date(document.createdAt),
                    new Date(),
                    {
                      addSuffix: true,
                    },
                  )}`}
                </div>
              ) : (
                <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
              )}
            </div>
          </div>

          <BlockActions
            block={block}
            currentVersionIndex={currentVersionIndex}
            handleVersionChange={handleVersionChange}
            isCurrentVersion={isCurrentVersion}
            mode={mode}
          />
          {nodes.length>0 &&<Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700"
                  onClick={() => {
                    handleExport();
                    toast.success('download success!');
                  }}
                  disabled={block.status === 'streaming'}
                >
                  <Download size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export IDL</TooltipContent>
            </Tooltip>}
        </div>

        <div className="prose dark:prose-invert dark:bg-muted bg-background h-full overflow-y-scroll px-4 py-8 md:p-20 !max-w-full pb-40 items-center">
          {
            diagramCode&&
            ( <div className="prose dark:prose-invert dark:bg-muted bg-background px-4 py-8 md:p-20 !max-w-full pb-40 items-center">
              {diagramCode && (
                <ZenUMLRenderer code={diagramCode} height="100%" width="100%" />
              )}{/* 其他内容 */}
              {description && (
                <div className="mt-4 bg-white text-zinc-950 rounded-lg p-6 border border-zinc-200">
                  <h1 className="text-lg font-semibold mb-2">Sequence Description</h1>
                  <div className="w-full h-px bg-zinc-200 mb-4"></div>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{description}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>)
          }
        {nodes.length > 0 && (<div style={{ height: 800 }}>
          <ReactFlow 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            fitView
            nodeTypes={nodesType}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow></div>
        )}
          {!diagramCode&&nodes.length<1 &&<div className="flex flex-row max-w-[600px] mx-auto">
         
            {isDocumentsFetching && !block.content&&!diagramCode ? (
              <DocumentSkeleton />
            ) : mode === 'edit' ? (
              <Editor
                content={
                  isCurrentVersion
                    ? block.content
                    : getDocumentContentById(currentVersionIndex)
                }
                isCurrentVersion={isCurrentVersion}
                currentVersionIndex={currentVersionIndex}
                status={block.status}
                saveContent={saveContent}
                suggestions={isCurrentVersion ? (suggestions ?? []) : []}
              />
            ) : (
              <DiffView
                oldContent={getDocumentContentById(currentVersionIndex - 1)}
                newContent={getDocumentContentById(currentVersionIndex)}
              />
            )}
            
            {suggestions ? (
              <div className="md:hidden h-dvh w-12 shrink-0" />
            ) : null}

            <AnimatePresence>
              {isCurrentVersion && (
                <Toolbar
                  isToolbarVisible={isToolbarVisible}
                  setIsToolbarVisible={setIsToolbarVisible}
                  append={append}
                  isLoading={isLoading}
                  stop={stop}
                  setMessages={setMessages}
                />
              )}
            </AnimatePresence>
          </div>}
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              block={block}
              currentVersionIndex={currentVersionIndex}
              documents={documents}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export const Block = memo(PureBlock, (prevProps, nextProps) => {
  return false;
});
