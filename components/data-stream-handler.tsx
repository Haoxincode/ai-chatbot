'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { artifactDefinitions, ArtifactKind } from './artifact';
import { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

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
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: 'streaming',
            };

          case 'kind':
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: 'streaming',
            };

          case 'text-delta':
            return {
              ...draftArtifact,
              content: draftArtifact.content + (delta.content as string),
              isVisible:
                draftArtifact.status === 'streaming' &&
                draftArtifact.content.length > 400 &&
                draftArtifact.content.length < 450
                  ? true
                  : draftArtifact.isVisible,
              status: 'streaming',
            };

          case 'code-delta':
            return {
              ...draftArtifact,
              content: delta.content as string,
              isVisible:
                draftArtifact.status === 'streaming' &&
                draftArtifact.content.length > 300 &&
                draftArtifact.content.length < 310
                  ? true
                  : draftArtifact.isVisible,
              status: 'streaming',
            };

          case 'image-delta':
            return {
              ...draftArtifact,
              content: delta.content as string,
              isVisible: true,
              status: 'streaming',
            };
            case 'mermaid':
              return {
                ...draftArtifact,
                content: draftArtifact.content + (delta.content as string),
                isVisible:
                  draftArtifact.status === 'streaming' &&
                  draftArtifact.content.length > 100 
                    ? true
                    : draftArtifact.isVisible,
                status: 'streaming',
              };
            case 'diagram':
              return {
                ...draftArtifact,
                content: delta.content as string,
                isVisible:
                  draftArtifact.status === 'streaming' &&
                  draftArtifact.content ? true
                    : draftArtifact.isVisible,
                status: 'streaming',
              };
            case 'design':
              return {
                ...draftArtifact,
                content: delta.content as string,
                isVisible:
                  draftArtifact.status === 'streaming' &&
                  draftArtifact.content? true
                    : draftArtifact.isVisible,
                status: 'streaming',
              };

          case 'clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
