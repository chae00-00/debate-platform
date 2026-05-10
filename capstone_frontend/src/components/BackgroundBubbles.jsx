const BackgroundBubbles = ({ activeTopic }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {activeTopic === 'tech' && (
        <img
          src="/technology.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.05 }}
        />
      )}
      {activeTopic === 'economy' && (
        <img
          src="/economy.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.07 }}
        />
      )}
      {activeTopic === 'society' && (
        <img
          src="/justice.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.07 }}
        />
      )}
      {activeTopic === 'science' && (
        <img
          src="/sci.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.07 }}
        />
      )}

      <div className="absolute left-[-16px] top-[1px] h-[999px] w-[1480px]">
        <img
          src="/image.png"
          alt=""
          className="absolute inset-0 h-full w-full max-w-none"
          style={{
            opacity: 0.58,
            filter: 'brightness(0) saturate(0)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    </div>
  );
};

export default BackgroundBubbles;
