interface ToolCallGroupProps {
  children: React.ReactNode;
}

export function ToolCallGroup({ children }: ToolCallGroupProps) {
  return (
    <div className="flex flex-wrap gap-1 my-1">
      {children}
    </div>
  );
}
