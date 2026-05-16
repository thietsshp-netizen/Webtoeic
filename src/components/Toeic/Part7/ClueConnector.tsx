"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Connection {
  sourceId: string;
  sourceRect: DOMRect;
  targetRect: DOMRect;
}

interface ClueConnectorProps {
  clueSids: string[];
  questionId: string;
  color: string;
  show: boolean;
}

export default function ClueConnector({ clueSids, questionId, color, show }: ClueConnectorProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const requestRef = useRef<number>(0);

  const updatePositions = useCallback(() => {
    if (!show || clueSids.length === 0 || !questionId) {
      setConnections([]);
      return;
    }

    const newConnections: Connection[] = [];
    const targetEl = document.getElementById(`question-${questionId}`);
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();

    clueSids.forEach(sid => {
      // Find both original and normalized SIDs 
      const normalizedSid = sid.replace(/^p\d+-/, '');
      const sourceEls = document.querySelectorAll(`[data-sid="${sid}"], [data-sid="${normalizedSid}"]`);
      
      let bestSource: { el: Element, rect: DOMRect } | null = null;

      for (const el of Array.from(sourceEls)) {
        const rect = el.getBoundingClientRect();
        
        // Basic visibility check
        if (rect.width === 0 || rect.height === 0) continue;

        // Check if element is within its scrollable container's bounds
        const scrollParent = el.closest('.overflow-y-auto');
        if (scrollParent) {
          const pRect = scrollParent.getBoundingClientRect();
          const isVisible = (
            rect.top >= pRect.top - 10 && 
            rect.bottom <= pRect.bottom + 10
          );
          if (!isVisible) continue;
        }

        // If we found a visible one, that's our best source for this SID
        bestSource = { el, rect };
        break;
      }
      
      if (bestSource) {
        newConnections.push({
          sourceId: sid,
          sourceRect: bestSource.rect,
          targetRect: targetRect,
        });
      }
    });

    setConnections(newConnections);
    requestRef.current = requestAnimationFrame(updatePositions);
  }, [clueSids, questionId, show]);

  useEffect(() => {
    if (show) {
      requestRef.current = requestAnimationFrame(updatePositions);
    } else {
      cancelAnimationFrame(requestRef.current);
      setConnections([]);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [show, updatePositions]);

  if (!show || connections.length === 0) return null;

  return (
    <svg 
      className="fixed inset-0 pointer-events-none z-[60]" 
      style={{ width: '100vw', height: '100vh' }}
    >
      <defs>
        <marker
          id={`arrowhead-${questionId}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      
      {connections.map((conn, idx) => {
        // Start point: Center of the clue sentence
        const startX = conn.sourceRect.right;
        const startY = conn.sourceRect.top + conn.sourceRect.height / 2;
        
        // Target point: Left side of the question card
        const endX = conn.targetRect.left;
        const endY = conn.targetRect.top + conn.targetRect.height / 2;

        // Control points for a smooth S-curve
        const distanceX = Math.abs(endX - startX);
        const cp1X = startX + distanceX * 0.4;
        const cp2X = startX + distanceX * 0.6;

        return (
          <motion.path
            key={`${conn.sourceId}-${idx}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            d={`M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            markerEnd={`url(#arrowhead-${questionId})`}
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))"
          />
        );
      })}
    </svg>
  );
}
