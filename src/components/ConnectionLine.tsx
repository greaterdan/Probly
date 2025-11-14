import { motion } from "framer-motion";

interface ConnectionLineProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  color?: string;
}

export const ConnectionLine = ({ startPos, endPos, color = "#6b9e7d" }: ConnectionLineProps) => {
  return (
    <svg className="fixed inset-0 pointer-events-none z-10" style={{ width: '100%', height: '100%' }}>
      <motion.line
        x1={startPos.x}
        y1={startPos.y}
        x2={endPos.x}
        y2={endPos.y}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.circle
        cx={endPos.x}
        cy={endPos.y}
        r="3"
        fill={color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
};
