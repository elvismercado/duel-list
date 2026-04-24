import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// Two separate contexts so consumers of the *setter* don't re-render when the
// *node* changes. Without this split, calling `setNode` from `useHeaderActions`
// would re-render the calling page (it would consume the combined context),
// producing a new JSX identity for the action node, which re-runs the effect →
// infinite loop.
const SetNodeContext = createContext<((node: ReactNode) => void) | null>(null);
const NodeContext = createContext<ReactNode>(null);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [node, setNodeState] = useState<ReactNode>(null);
  const setNode = useCallback((n: ReactNode) => setNodeState(n), []);
  return (
    <SetNodeContext.Provider value={setNode}>
      <NodeContext.Provider value={node}>{children}</NodeContext.Provider>
    </SetNodeContext.Provider>
  );
}

/**
 * Pages call this to register a trailing-slot node into the Layout header.
 * The node is replaced on every render of the calling page, and cleared on unmount.
 */
export function useHeaderActions(node: ReactNode) {
  const setNode = useContext(SetNodeContext);
  useEffect(() => {
    if (!setNode) return;
    setNode(node);
    return () => setNode(null);
  }, [setNode, node]);
}

/** Layout-only: read the currently registered actions for rendering. */
export function useHeaderActionsSlot(): ReactNode {
  return useContext(NodeContext);
}
