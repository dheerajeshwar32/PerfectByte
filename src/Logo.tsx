import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 sm:gap-4 select-none w-fit hover:opacity-80 transition-opacity">
      {/* Glitch Monogram - font-semibold for a bolder, more solid fill */}
      <span 
        className="text-[36px] sm:text-[46px] font-semibold text-[#5668FF] leading-none"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          textShadow: '-1px 0px 0px #00FFFF, 1px 0px 0px #FF00FF'
        }}
      >
        PB
      </span>
      {/* Wordmark */}
      <span 
        className="hidden xs:inline-block sm:inline-block text-[12px] sm:text-[14px] font-medium text-[#5668FF] tracking-[0.3em] sm:tracking-[0.45em] uppercase mt-1"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        PERFECTBYTE
      </span>
    </Link>
  );
}
