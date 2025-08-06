export default function TypingIndicator() {
  return (
    <>
      <div className="flex items-center space-x-1 text-green-500 font-semibold">
        <span className="text-green-500 font-semibold tracking-widest font-bold">
          typing
        </span>
        <span className="dot dot1">.</span>
        <span className="dot dot2">.</span>
        <span className="dot dot3">.</span>
      </div>

      <style>
        {`
          .dot {
            display: inline-block;
            font-size: 1.5em;
            animation: bounce 1.4s infinite ease-in-out;
          }

          .dot1 { animation-delay: 0s; }
          .dot2 { animation-delay: 0.2s; }
          .dot3 { animation-delay: 0.4s; }

          @keyframes bounce {
            0%, 80%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.8;

            }
            40% {
              transform: translateY(-5px) scale(1.4);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
}
