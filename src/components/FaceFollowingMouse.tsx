import React, { useState, useEffect, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface CenterPosition {
  x: number;
  y: number;
}

type Emotion = 'neutral' | 'happy' | 'surprised' | 'bored';

const FaceFollowingMouse: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [lastActive, setLastActive] = useState<number>(Date.now());
  const [isActive, setIsActive] = useState<boolean>(true);
  const [happinessLevel, setHappinessLevel] = useState<number>(0);
  const [boredState, setBoredState] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const centerPosition = useRef<CenterPosition>({ x: 0, y: 0 });
  const emotionTimer = useRef<NodeJS.Timeout | null>(null);
  const boredTimer = useRef<NodeJS.Timeout | null>(null);
  const boredStateTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrame = useRef<number>(0);
  const happinessDecayInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      const now = Date.now();
      
      if (now - lastActive > 2000 && !isActive) {
        setEmotion('surprised');
        if (emotionTimer.current) {
          clearTimeout(emotionTimer.current);
        }
        emotionTimer.current = setTimeout(() => {
          setEmotion('neutral');
          resetBoredTimer();
        }, 2000);
      }
      
      setLastActive(now);
      setIsActive(true);
    };
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height, left, top } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        centerPosition.current = { 
          x: left + width / 2, 
          y: top + height / 2 
        };
      }
    };
    
    const startHappinessDecay = () => {
      if (happinessDecayInterval.current) {
        clearInterval(happinessDecayInterval.current);
      }
      
      happinessDecayInterval.current = setInterval(() => {
        if (!isActive && happinessLevel > 0) {
          setHappinessLevel(prev => {
            const newValue = Math.max(0, prev - 0.02);
            if (newValue < 0.1 && emotion === 'happy') {
              setEmotion('neutral');
            }
            return newValue;
          });
        }
      }, 100);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateDimensions);
    
    updateDimensions();
    resetBoredTimer();
    startHappinessDecay();
    
    const inactivityCheck = setInterval(() => {
      if (Date.now() - lastActive > 2000 && isActive) {
        setIsActive(false);
      }
    }, 500);
    
    const proximityCheck = setInterval(() => {
      if (!isActive) return;
      
      const dx = mousePosition.x - centerPosition.current.x;
      const dy = mousePosition.y - centerPosition.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const maxDistance = dimensions.width * 1.5;
      const proximityFactor = Math.max(0, 1 - (distance / maxDistance));
      
      setHappinessLevel(prev => {
        return prev + (proximityFactor - prev) * 0.1;
      });
      
      if (happinessLevel > 0.6) {
        if (emotion !== 'happy') {
          setEmotion('happy');
        }
      } else if (emotion === 'happy' && happinessLevel < 0.3) {
        setEmotion('neutral');
      }
    }, 30);
    
    startIdleAnimation();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateDimensions);
      clearInterval(inactivityCheck);
      clearInterval(proximityCheck);
      if (emotionTimer.current) clearTimeout(emotionTimer.current);
      if (boredTimer.current) clearTimeout(boredTimer.current);
      if (boredStateTimer.current) clearTimeout(boredStateTimer.current);
      if (happinessDecayInterval.current) clearInterval(happinessDecayInterval.current);
      cancelAnimationFrame(animationFrame.current);
    };
  }, [lastActive, isActive, emotion, happinessLevel]);
  
  const resetBoredTimer = () => {
    if (boredTimer.current) {
      clearTimeout(boredTimer.current);
    }
    
    boredTimer.current = setTimeout(() => {
      if (Date.now() - lastActive > 4000 && happinessLevel < 0.2) {
        setEmotion('bored');
        startBoredStateAlternation();
      }
    }, 5000);
  };
  
  const startBoredStateAlternation = () => {
    if (boredStateTimer.current) {
      clearTimeout(boredStateTimer.current);
    }
    
    const alternateBored = () => {
      if (emotion === 'bored') {
        setBoredState(prevState => prevState === 0 ? 1 : 0);
        boredStateTimer.current = setTimeout(alternateBored, 3000);
      }
    };
    
    alternateBored();
  };
  
  const startIdleAnimation = () => {
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      animationFrame.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  const calculateEyeStyle = (eyeX: number, eyeY: number) => {
    if (dimensions.width === 0) return { eyeball: {}, pupil: {} };
    
    const eyeCenterX = dimensions.width * eyeX;
    const eyeCenterY = dimensions.height * eyeY;
    
    const absoluteEyeX = containerRef.current?.getBoundingClientRect().left ?? 0 + eyeCenterX;
    const absoluteEyeY = containerRef.current?.getBoundingClientRect().top ?? 0 + eyeCenterY;
    
    const dx = mousePosition.x - absoluteEyeX;
    const dy = mousePosition.y - absoluteEyeY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const angle = Math.atan2(dy, dx);
    
    const maxPupilTravel = 15;
    const pupilX = Math.cos(angle) * Math.min(distance / 10, maxPupilTravel);
    const pupilY = Math.sin(angle) * Math.min(distance / 10, maxPupilTravel);
    
    const maxEyeballTravel = 5;
    const eyeballX = Math.cos(angle) * Math.min(distance / 20, maxEyeballTravel);
    const eyeballY = Math.sin(angle) * Math.min(distance / 20, maxEyeballTravel);
    
    const maxDistance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
    const normalizedDistance = distance / maxDistance;
    
    const minPupilSize = 0.4;
    const maxPupilSize = 0.7;
    const pupilSizeMultiplier = maxPupilSize - (normalizedDistance * (maxPupilSize - minPupilSize));
    
    let extraStyles = {};
    
    if (emotion === 'bored') {
      if (boredState === 0) {
        extraStyles = {
          height: '16px',
          borderRadius: '16px',
          marginTop: '4px'
        };
      } else {
        extraStyles = {
          height: '12px',
          borderRadius: '12px',
          marginTop: '6px',
          transform: `rotate(${eyeX < 0.5 ? '-5deg' : '5deg'})`
        };
      }
    }
    
    return {
      eyeball: {
        transform: `translate(${eyeballX}px, ${eyeballY}px)`,
        ...extraStyles
      },
      pupil: {
        transform: `translate(${pupilX}px, ${pupilY}px)`,
        width: `${pupilSizeMultiplier * 100}%`,
        height: `${pupilSizeMultiplier * 100}%`
      }
    };
  };

  const getMouthStyle = () => {
    switch(emotion) {
      case 'surprised':
        return {
          width: '60px',
          height: '80px',
          borderRadius: '50%',
          background: '#450a0a'
        };
      case 'happy':
        const smileWidth = 70 + (happinessLevel * 40);
        const smileHeight = 40 + (happinessLevel * 30);
        
        return {
          width: `${smileWidth}px`,
          height: `${smileHeight}px`,
          borderRadius: '0 0 50px 50px',
          borderTop: 'none',
          background: '#450a0a',
          transform: `translateY(${happinessLevel * 5}px)`
        };
      case 'bored':
        if (boredState === 0) {
          return {
            width: '70px',
            height: '10px',
            borderRadius: '5px',
            background: '#450a0a',
            transform: 'rotate(-10deg) translateY(15px)'
          };
        } else {
          return {
            width: '50px',
            height: '8px',
            borderRadius: '5px',
            background: '#450a0a',
            transform: 'rotate(-15deg) translateY(20px) translateX(-5px)'
          };
        }
      default:
        return {
          width: '70px',
          height: '15px',
          borderRadius: '5px',
          background: '#450a0a'
        };
    }
  };
  
  const getNoseStyle = () => {
    const baseStyle = {
      width: '10px',
      height: '10px',
      background: '#ffb700',
      borderRadius: '50%'
    };
    
    if (emotion === 'happy') {
      return {
        ...baseStyle,
        transform: `scale(${1 + (happinessLevel * 0.3)}) translateY(${happinessLevel * -3}px)`,
      };
    } else if (emotion === 'bored') {
      if (boredState === 0) {
        return {
          ...baseStyle,
          transform: 'translateY(5px)'
        };
      } else {
        return {
          ...baseStyle,
          transform: 'translateY(8px) translateX(3px)'
        };
      }
    }
    
    return baseStyle;
  };
  
  const getFaceContainerStyle = () => {
    const time = Date.now() / 1000;
    
    const baseStyle = {
      transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
    
    if (emotion === 'happy') {
      return {
        ...baseStyle,
        transform: `translateY(${Math.sin(time * 2) * happinessLevel * 5}px)`
      };
    } else if (emotion === 'bored') {
      if (boredState === 0) {
        const boredMovement = Math.sin(time * 0.5) * 3;
        return {
          ...baseStyle,
          transform: `translate(${Math.sin(time * 0.3) * 2}px, ${5 + boredMovement}px) rotate(${Math.sin(time * 0.2) * 2}deg)`
        };
      } else {
        const boredMovement = Math.sin(time * 0.3) * 4;
        return {
          ...baseStyle,
          transform: `translate(${Math.sin(time * 0.4) * 3}px, ${7 + boredMovement}px) rotate(${Math.sin(time * 0.2) * -3}deg)`
        };
      }
    } else if (emotion === 'surprised') {
      return {
        ...baseStyle,
        transform: `translate(${Math.sin(time * 10) * 2}px, ${Math.cos(time * 10) * 2}px)`
      };
    } else {
      const idleX = Math.sin(time * 0.7) * 3;
      const idleY = Math.cos(time * 0.5) * 2;
      const idleRotation = Math.sin(time * 0.3) * 1;
      
      return {
        ...baseStyle,
        transform: `translate(${idleX}px, ${idleY}px) rotate(${idleRotation}deg)`
      };
    }
  };
  
  const getBlushStyle = (side: 'left' | 'right') => {
    const opacity = happinessLevel * 0.8;
    const size = 10 + (happinessLevel * 8);
    
    if (side === 'left') {
      return {
        left: '25%',
        top: '50%',
        width: `${size}px`,
        height: `${size * 0.6}px`,
        opacity
      };
    } else {
      return {
        right: '25%',
        top: '50%',
        width: `${size}px`,
        height: `${size * 0.6}px`,
        opacity
      };
    }
  };
  
  const getBackgroundStyle = () => {
    if (emotion === 'happy') {
      const intensity = Math.max(500, 800 - Math.floor(happinessLevel * 300));
      return `bg-gradient-to-b from-yellow-${intensity} to-orange-${Math.min(900, intensity + 100)}`;
    } else if (emotion === 'bored') {
      return boredState === 0 
        ? "bg-gradient-to-b from-gray-700 to-blue-900" 
        : "bg-gradient-to-b from-gray-800 to-indigo-900";
    } else if (emotion === 'surprised') {
      return "bg-gradient-to-b from-yellow-600 to-red-700";
    } else {
      return "bg-gradient-to-b from-blue-900 to-purple-900";
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-4 text-lg font-semibold text-gray-800">Interactive Face Animation</div>
      <div className="mb-2 text-sm text-gray-600">
        Current emotion: <span className="font-medium">{emotion}</span> | 
        Happiness: <span className="font-medium">{Math.round(happinessLevel * 100)}%</span>
        {emotion === 'bored' && <span> | Bored state: {boredState + 1}</span>}
      </div>
      <div className="text-sm text-gray-500 mb-4 italic">Move your mouse around to interact, or leave it still for 5 seconds to see the bored states</div>
      
      <div 
        ref={containerRef} 
        className={`flex items-center justify-center w-full max-w-3xl mx-auto h-96 rounded-lg transition-all duration-700 ${getBackgroundStyle()}`}
      >
        <div 
          className="relative w-64 h-64 bg-gradient-to-b from-yellow-200 to-yellow-300 rounded-full flex flex-col items-center justify-center shadow-[0_10px_50px_rgba(0,0,0,0.3)] transition-all duration-300"
          style={getFaceContainerStyle()}
        >
          <div className="flex space-x-8 items-center mt-4">
            <div 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg border-2 border-gray-300 transition-all duration-500"
              style={calculateEyeStyle(0.35, 0.4).eyeball}
            >
              <div 
                className="relative w-3/4 h-3/4 bg-black rounded-full flex items-center justify-center transition-all duration-100"
                style={calculateEyeStyle(0.35, 0.4).pupil}
              >
                <div className="w-1/3 h-1/3 bg-white rounded-full absolute top-1/4 left-1/4 opacity-70"></div>
              </div>
            </div>
            
            <div 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg border-2 border-gray-300 transition-all duration-500"
              style={calculateEyeStyle(0.65, 0.4).eyeball}
            >
              <div 
                className="relative w-3/4 h-3/4 bg-black rounded-full flex items-center justify-center transition-all duration-100"
                style={calculateEyeStyle(0.65, 0.4).pupil}
              >
                <div className="w-1/3 h-1/3 bg-white rounded-full absolute top-1/4 left-1/4 opacity-70"></div>
              </div>
            </div>
          </div>
          
          <div 
            className="mt-4 shadow-md transition-all duration-300"
            style={getNoseStyle()}
          ></div>
          
          <div 
            className="mt-6 transition-all duration-300"
            style={getMouthStyle()}
          ></div>
          
          {happinessLevel > 0.2 && (
            <>
              <div 
                className="absolute bg-red-300 rounded-full transition-all duration-300" 
                style={getBlushStyle('left')}
              ></div>
              <div 
                className="absolute bg-red-300 rounded-full transition-all duration-300"
                style={getBlushStyle('right')}
              ></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceFollowingMouse;