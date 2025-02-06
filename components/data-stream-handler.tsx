'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { blockDefinitions, BlockKind } from './block';
import { Suggestion } from '@/lib/db/schema';
import { initialBlockData, useBlock } from '@/hooks/use-block';

export type DataStreamDelta = {
  type:
    | 'text-delta'|'diagram'|'design'|'mermaid'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind';
  content: string | Suggestion;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { block, setBlock, setMetadata } = useBlock();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      const blockDefinition = blockDefinitions.find(
        (blockDefinition) => blockDefinition.kind === block.kind,
      );

      if (blockDefinition?.onStreamPart) {
        blockDefinition.onStreamPart({
          streamPart: delta,
          setBlock,
          setMetadata,
        });
      }

      setBlock((draftBlock) => {
        if (!draftBlock) {
          return { ...initialBlockData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftBlock,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftBlock,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftBlock,
              kind: delta.content as BlockKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftBlock,
              content: draftBlock.content + (delta.content as string),
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 400 &&
                draftBlock.content.length < 450
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible:
                draftBlock.status === 'streaming' &&
                draftBlock.content.length > 300 &&
                draftBlock.content.length < 310
                  ? true
                  : draftBlock.isVisible,
              status: 'streaming',
            };

          case 'image-delta':
            return {
              ...draftBlock,
              content: delta.content as string,
              isVisible: true,
              status: 'streaming',
            };
            case 'mermaid':
              return {
                ...draftBlock,
                content: draftBlock.content + (delta.content as string),
                isVisible:
                  draftBlock.status === 'streaming' &&
                  draftBlock.content.length > 100 
                    ? true
                    : draftBlock.isVisible,
                status: 'streaming',
              };
            case 'diagram':
              return {
                ...draftBlock,
                content: delta.content as string,
                isVisible:
                  draftBlock.status === 'streaming' &&
                  draftBlock.content ? true
                    : draftBlock.isVisible,
                status: 'streaming',
              };
            case 'design':
              return {
                ...draftBlock,
                content: delta.content as string,
                isVisible:
                  draftBlock.status === 'streaming' &&
                  draftBlock.content? true
                    : draftBlock.isVisible,
                status: 'streaming',
              };

          case 'clear':
            return {
              ...draftBlock,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftBlock,
              status: 'idle',
            };

          default:
            return draftBlock;
        }
      });
    });
  }, [dataStream, setBlock, setMetadata, block]);

  return null;
}
