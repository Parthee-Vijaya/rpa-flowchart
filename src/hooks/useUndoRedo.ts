"use client";
import { useState, useCallback, useRef } from "react";

interface HistoryEntry<T> {
  nodes: T[];
  edges: T[];
}

export function useUndoRedo<N, E>(initialNodes: N[], initialEdges: E[]) {
  const [past, setPast] = useState<HistoryEntry<unknown>[]>([]);
  const [future, setFuture] = useState<HistoryEntry<unknown>[]>([]);
  const isUndoRedo = useRef(false);

  const takeSnapshot = useCallback(
    (nodes: N[], edges: E[]) => {
      if (isUndoRedo.current) {
        isUndoRedo.current = false;
        return;
      }
      setPast((prev) => [
        ...prev.slice(-49),
        { nodes: nodes as unknown[], edges: edges as unknown[] },
      ]);
      setFuture([]);
    },
    []
  );

  const undo = useCallback(
    (
      currentNodes: N[],
      currentEdges: E[],
      setNodes: (nodes: N[]) => void,
      setEdges: (edges: E[]) => void
    ) => {
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      setPast((prev) => prev.slice(0, -1));
      setFuture((prev) => [
        ...prev,
        { nodes: currentNodes as unknown[], edges: currentEdges as unknown[] },
      ]);
      isUndoRedo.current = true;
      setNodes(previous.nodes as N[]);
      setEdges(previous.edges as E[]);
    },
    [past]
  );

  const redo = useCallback(
    (
      _currentNodes: N[],
      _currentEdges: E[],
      setNodes: (nodes: N[]) => void,
      setEdges: (edges: E[]) => void
    ) => {
      if (future.length === 0) return;
      const next = future[future.length - 1];
      setFuture((prev) => prev.slice(0, -1));
      setPast((prev) => [
        ...prev,
        { nodes: _currentNodes as unknown[], edges: _currentEdges as unknown[] },
      ]);
      isUndoRedo.current = true;
      setNodes(next.nodes as N[]);
      setEdges(next.edges as E[]);
    },
    [future]
  );

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
