import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-4 select-none w-fit hover:opacity-80 transition-opacity">
      
      {/* 
        Injects the weights (400, 500, 600) of the geometric font 
      */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap');`}
      </style>
      {/* Glitch Monogram - font-semibold for a bolder, more solid fill */}
      <span 
        className="text-[46px] font-semibold text-[#5668FF] leading-none"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          textShadow: '-1px 0px 0px #00FFFF, 1px 0px 0px #FF00FF'
        }}
      >
        PB
      </span>
      {/* Wordmark */}
      <span 
        className="text-[14px] font-medium text-[#5668FF] tracking-[0.45em] uppercase mt-1"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        PERFECTBYTE
      </span>
      
    </Link>
  );
}