import { cn } from '@/lib/utils';
import { CopyIcon, DeltaIcon, RedoIcon, UndoIcon } from './icons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from 'sonner';
import { UIBlock } from './block';
import { memo } from 'react';
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
}

function PureBlockActions({
  block,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,nodes,serviceInterfaces
}: BlockActionsProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const handleExport = () => {
    if (serviceInterfaces.length > 0) {
      const idl = generateIDL(serviceInterfaces);
      downloadIDL(idl);
    } else {
      //setError('No service interfaces to export');
    }
  };
  return (
    <div className="flex flex-row gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700"
            onClick={() => {
              copyToClipboard(block.content);
              toast.success('Copied to clipboard!');
            }}
            disabled={block.status === 'streaming'}
          >
            <CopyIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy to clipboard</TooltipContent>
      </Tooltip>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
            onClick={() => {
              handleVersionChange('prev');
            }}
            disabled={currentVersionIndex === 0 || block.status === 'streaming'}
          >
            <UndoIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Previous version</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
            onClick={() => {
              handleVersionChange('next');
            }}
            disabled={isCurrentVersion || block.status === 'streaming'}
          >
            <RedoIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Next version</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'p-2 h-fit !pointer-events-auto dark:hover:bg-zinc-700',
              {
                'bg-muted': mode === 'diff',
              },
            )}
            onClick={() => {
              handleVersionChange('toggle');
            }}
            disabled={block.status === 'streaming' || currentVersionIndex === 0}
          >
            <DeltaIcon size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View changes</TooltipContent>
      </Tooltip>
    </div>
  );
}

export const BlockActions = memo(PureBlockActions, (prevProps, nextProps) => {
  if (prevProps.block.status !== nextProps.block.status) return false;
  if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex)
    return false;
  if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) return false;

  return true;
});
