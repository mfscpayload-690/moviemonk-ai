import React from 'react';
import logoUrl from '../asset/MovieMonk Logo.png';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <img src={logoUrl} alt="MovieMonk Logo" className={className} />
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l-.259 1.035a3.375 3.375 0 00-2.456 2.456L14.25 18l1.035.259a3.375 3.375 0 002.456 2.456L18 21.75l.259-1.035a3.375 3.375 0 002.456-2.456L21.75 18l-1.035-.259a3.375 3.375 0 00-2.456-2.456z" />
    </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EyeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
    </svg>
);

export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
);

export const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m-3.75-3.75v3.75m-3.75-3.75v3.75m9.75-15l-2.071 3.75m2.071-3.75H5.25m9.75 0l-2.071 3.75M3.75 18h16.5M3.75 12h16.5m-16.5 6V6a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H5.25A2.25 2.25 0 013.75 18z" />
    </svg>
);

export const TvIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
);

export const TicketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v9A2.25 2.25 0 005.25 18.75h1.5M16.5 18.75h-1.5m-6 0h1.5m-1.5 0h-1.5m6 0h-1.5m6 0h1.5m-6 0h-1.5" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const RottenTomatoesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
        <path d="M416 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zM96 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zM256 32C114.6 32 0 146.6 0 288c0 74.52 32.2 142 85.39 189.37 25.1 22.62 57.04 34.63 90.61 34.63h180c57.53 0 110.6-30.83 140.4-80.52C496.5 407.7 512 350.3 512 288c0-141.4-114.6-256-256-256zm-96 288c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32zm192 0c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"/>
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// New platform / UI icons
export const NetflixIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 3h4.2l4.05 11.6V3H16v18h-4.05L7.9 9.4V21H4V3Z" />
    </svg>
);

export const PrimeVideoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.04 3c-5 0-9.04 4.06-9.04 9.06 0 5 4.04 9.06 9.04 9.06 5 0 9.04-4.06 9.04-9.06C21.08 7.06 17.04 3 12.04 3Zm3.21 10.33c-.51.76-1.43 1.28-2.29 1.28-1.53 0-2.78-1.25-2.78-2.79 0-1.55 1.25-2.8 2.78-2.8.86 0 1.78.52 2.29 1.28V6.77h1.42v8.56h-1.42v-1.99Zm-2.29-3.92c-.77 0-1.39.63-1.39 1.41 0 .77.62 1.39 1.39 1.39.77 0 1.39-.62 1.39-1.39 0-.78-.62-1.41-1.39-1.41ZM7.5 11.82c0-1.54 1.25-2.79 2.78-2.79.87 0 1.78.52 2.29 1.28l-1.2.77c-.22-.33-.63-.55-1.09-.55-.77 0-1.39.62-1.39 1.39 0 .77.62 1.39 1.39 1.39.46 0 .87-.22 1.09-.55l1.2.77c-.51.76-1.42 1.28-2.29 1.28-1.53 0-2.78-1.25-2.78-2.79Z" />
        <path d="M5.5 16.75c3.73 3.05 9.26 3.08 13.02.03.27-.22.31-.62.09-.9-.22-.28-.62-.32-.9-.09-3.29 2.69-8.06 2.66-11.31-.02-.27-.22-.68-.18-.9.1-.23.28-.19.69.09.88Z" />
    </svg>
);

export const HuluIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 8h2v5.2c0 1.92 1.05 3.04 2.86 3.04 1.82 0 2.86-1.12 2.86-3.04V8h-2v5.12c0 .9-.38 1.34-.86 1.34-.48 0-.86-.44-.86-1.34V8H3Zm9 0h2v8h-2V8Zm3.5 0h2v5.2c0 1.92 1.05 3.04 2.86 3.04.64 0 1.2-.16 1.64-.46V13.8c-.34.26-.72.4-1.14.4-.66 0-1.36-.38-1.36-1.42V8h-2v8H15.5Z" />
    </svg>
);

export const MaxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 8h2.2l1.8 4.6L9.8 8h2.2v8h-2v-3.7l-1.2 3h-1.2l-1.2-3V16H4V8Zm11.2 0c1.74 0 3.16 1.42 3.16 3.16V16h-2v-1.2c-.38.76-1.18 1.26-2.16 1.26-1.74 0-3.16-1.42-3.16-3.16 0-1.74 1.42-3.16 3.16-3.16.98 0 1.78.5 2.16 1.26V11.16c0-.64-.52-1.16-1.16-1.16-.54 0-.98.34-1.12.82h-2.02c.22-1.34 1.42-2.32 3.02-2.32ZM16.36 13c0-.74-.6-1.34-1.34-1.34-.74 0-1.34.6-1.34 1.34 0 .74.6 1.34 1.34 1.34.74 0 1.34-.6 1.34-1.34Z" />
    </svg>
);

export const DisneyPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 5.5c3.78 0 7.18 1.8 9.31 4.72.26.36.18.86-.18 1.12-.36.26-.86.18-1.12-.18C18.31 8.78 15.31 7.5 12 7.5c-5.24 0-9.57 3.85-9.98 8.73-.04.44-.42.77-.86.72-.44-.04-.76-.42-.72-.86C1 10.04 6.02 5.5 12 5.5Z" />
        <path d="M7.5 13h1.7l1.3 3.4 1.3-3.4h1.7v5h-1.5v-2.3l-.9 2.3h-1.2l-.9-2.3V18H7.5v-5Zm9.25 0c1.23 0 2.25 1.02 2.25 2.25V18h-1.5v-.7c-.29.46-.82.75-1.38.75-1.23 0-2.25-1.02-2.25-2.25 0-1.23 1.02-2.25 2.25-2.25.56 0 1.09.29 1.38.75v-.75c0-.42-.34-.75-.75-.75-.35 0-.64.22-.73.53h-1.3c.17-.96 1.02-1.65 2.2-1.65Zm.75 2.25c0-.42-.34-.75-.75-.75-.41 0-.75.33-.75.75 0 .42.34.75.75.75.41 0 .75-.33.75-.75Z" />
    </svg>
);

export const AppleTvIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 8h10v8H7V8Zm5-5c.83 0 1.5.67 1.5 1.5S12.83 6 12 6s-1.5-.67-1.5-1.5S11.17 3 12 3Zm0 18c-.83 0-1.5-.67-1.5-1.5S11.17 18 12 18s1.5.67 1.5 1.5S12.83 21 12 21Z" />
    </svg>
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 12c-2.21 0-4.15-1.2-5.2-3.02.06-1.66 3.47-2.58 5.2-2.58 1.73 0 5.14.92 5.2 2.58A5.985 5.985 0 0 1 12 18Z" />
    </svg>
);

export const FilmReelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12c0 3.87 2.74 7.16 6.45 8.19-.07-.4-.11-.82-.11-1.24 0-1.4.45-2.78 1.31-3.89-2.09-.27-3.72-2.05-3.72-4.21 0-2.36 1.92-4.28 4.28-4.28.69 0 1.35.16 1.93.45.7-.89 1.76-1.45 2.93-1.45 2.07 0 3.75 1.68 3.75 3.75 0 .76-.23 1.47-.62 2.06.99.86 1.62 2.12 1.62 3.52 0 .98-.3 1.92-.85 2.7A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10Zm-1.25 7.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm4.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 5.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm0 9.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l7.5-7.5M21 12H3" />
    </svg>
);

export const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M3 12h18" />
    </svg>
);