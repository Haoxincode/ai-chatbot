import { memo, type SetStateAction } from 'react';

import type { UIBlock } from './block';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons';
import {Paintbrush} from 'lucide-react'
const getActionText = (
  type: 'create' | 'update' | 'request-suggestions'|"generateFunctionDesign"|"updateFunctionDesign"|"generateServiceInterfaces",
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created';
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated';
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to';
    case "generateFunctionDesign":
      return tense === 'present'?"Designing":"Designed"
    case "updateFunctionDesign":
      return tense === 'present'?"Updating":"Updated"
    case "generateServiceInterfaces":
      return tense === 'present'?"Drawing":"Drawn"
    default:
      return null;
  }
};

interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions'|'generateFunctionDesign'|"updateFunctionDesign"|"generateServiceInterfaces";
  result: { id: string; title: string };
  block: UIBlock;
  setBlock: (value: SetStateAction<UIBlock>) => void;
}

function PureDocumentToolResult({
  type,
  result,
  setBlock,
}: DocumentToolResultProps) {
  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setBlock({
          documentId: result.id,
          content: '',
          sequenceDiagram:"",
          title: result.title,
          isVisible: true,
          status: 'idle',
          boundingBox,
        });
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon />
        ) : type === 'update' ? (
          <PencilEditIcon />
        ) : type === 'request-suggestions' ? (
          <MessageIcon />
        ) :type === 'generateFunctionDesign' ? (
          <Paintbrush size={16}  />
        ):type === 'updateFunctionDesign' ? (
          <Paintbrush size={16}  />
        ) :type === 'generateServiceInterfaces' ? (
          <Paintbrush size={16}  />
        ) : null}
      </div>
      <div className="text-left">
        {`${getActionText(type, 'past')} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions'|'generateFunctionDesign'|'updateFunctionDesign'|"generateServiceInterfaces";
  args: { title: string };
  setBlock: (value: SetStateAction<UIBlock>) => void;
}

function PureDocumentToolCall({ type, args, setBlock }: DocumentToolCallProps) {
  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setBlock((currentBlock) => ({
          ...currentBlock,
          isVisible: true,
          boundingBox,
        }));
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon />
          ) : type === 'update' ? (
            <PencilEditIcon />
          ) : type === 'request-suggestions' ? (
            <MessageIcon />
          ) :type === 'generateFunctionDesign' ? (
            <Paintbrush size={16} />
          ) :type === 'updateFunctionDesign' ? (
            <Paintbrush size={16}  />
          ) :type === 'generateServiceInterfaces' ? (
            <Paintbrush size={16}  />
          ): null}
        </div>

        <div className="text-left">
          {`${getActionText(type, 'present')} ${args.title ? `"${args.title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1">{<LoaderIcon />}</div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
