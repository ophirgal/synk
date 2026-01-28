import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";


import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroup>) {
  return (
    <PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  customHandle,
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & {
  withHandle?: boolean
  customHandle?: React.ReactNode
}) {
  return (
    <PanelResizeHandle
      data-slot="horizontal-resizable-handle"
      className={cn(
        "bg-border focus-visible:outline-hidden relative flex w-px items-center justify-center after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2",
        className
      )}
      {...props}
    >
      {(withHandle && customHandle) ??
        <div className="bg-border z-10 flex w-4 h-3 items-center justify-center rounded-xs border h-[20px]">
          <GripVerticalIcon className="size-2.5" />
        </div>
      }
    </PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
