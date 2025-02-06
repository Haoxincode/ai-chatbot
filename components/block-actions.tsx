import { cn, generateUUID } from '@/lib/utils';
import { ClockRewind, CopyIcon, DeltaIcon, PlayIcon, RedoIcon, UndoIcon } from './icons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { blockDefinitions, UIBlock } from './block';
import { Dispatch, memo, SetStateAction, useState } from 'react';
import { BlockActionContext } from './create-block';
import { toast } from 'sonner';
import {downloadIDL,generateIDL}from './diagram'
import { Download } from 'lucide-react';

interface BlockActionsProps {
  block: UIBlock;
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: 'read-only' | 'edit' | 'diff';
  nodes:any
  serviceInterfaces:any
  metadata: any;
  setMetadata: Dispatch<SetStateAction<any>>;
}

function PureBlockActions({
  block,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,nodes,serviceInterfaces,
  metadata,
  setMetadata,
}: BlockActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const blockDefinition = blockDefinitions.find(
    (definition) => definition.kind === block.kind,
  );

  if (!blockDefinition) {
    throw new Error('Block definition not found!');
  }
  const actionContext: BlockActionContext = {
    content: block.content,
    handleVersionChange,
    currentVersionIndex,
    isCurrentVersion,
    mode,
    metadata,
    setMetadata,
  };

  const handleExport = () => {
    if (serviceInterfaces.length > 0) {
      const idl = generateIDL(serviceInterfaces);
      downloadIDL(idl);
    } else {
      if(block.content.indexOf('serviceInterface')>-1){
        let service=JSON.parse(block.content)
        if(service &&service.serviceInterface){
          const idl = generateIDL(service.serviceInterface);
          downloadIDL(idl);
        }
      }
      //setError('No service interfaces to export');
    }
  };
  return (
    <div className="flex flex-row gap-1">
      {blockDefinition.actions.map((action) => (
        <Tooltip key={action.description}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn('h-fit dark:hover:bg-zinc-700', {
                'p-2': !action.label,
                'py-1.5 px-2': action.label,
              })}
              onClick={async () => {
                setIsLoading(true);

                try {
                  await Promise.resolve(action.onClick(actionContext));
                } catch (error) {
                  toast.error('Failed to execute action');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={
                isLoading || block.status === 'streaming'
                  ? true
                  : action.isDisabled
                    ? action.isDisabled(actionContext)
                    : false
              }
            >
              {action.icon}
              {action.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.description}</TooltipContent>
        </Tooltip>
      ))}
{block.content.indexOf("serviceInterface")>0 &&<Tooltip>
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
  );
}

export const BlockActions = memo(PureBlockActions, (prevProps, nextProps) => {
  if (prevProps.block.status !== nextProps.block.status) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;
  if (prevProps.block.content !== nextProps.block.content) return false;

  return true;
});
