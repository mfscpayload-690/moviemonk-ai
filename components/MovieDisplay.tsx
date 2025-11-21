import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MovieData, CastMember, WatchOption, GroundingSource, WebSource } from '../types';
import { EyeIcon, EyeSlashIcon, Logo, LinkIcon, PlayIcon, FilmIcon, TvIcon, TicketIcon, TagIcon, DollarIcon, RottenTomatoesIcon, StarIcon, ImageIcon, XMarkIcon } from './icons';

interface MovieDisplayProps {
    movie: MovieData | null;
    isLoading: boolean;
    sources: GroundingSource[] | null;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    
    // Regular expression to find a YouTube video ID from various URL formats
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    
    if (match && match[1]) {
        videoId = match[1];
    }

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    
    return null;
};

// Helper function to convert simple markdown to HTML
const markdownToHtml = (text: string): string => {
    if (!text) return '';

    const lines = text.split('\n');
    const htmlBlocks: string[] = [];
    let currentList: string[] = [];

    const closeList = () => {
        if (currentList.length > 0) {
            htmlBlocks.push(`<ul>${currentList.join('')}</ul>`);
            currentList = [];
        }
    };

    lines.forEach(line => {
        if (line.startsWith('### ')) {
            closeList();
            htmlBlocks.push(`<h3>${line.substring(4)}</h3>`);
        } else if (line.startsWith('## ')) {
            closeList();
            htmlBlocks.push(`<h2>${line.substring(3)}</h2>`);
        } else if (line.startsWith('* ')) {
            currentList.push(`<li>${line.substring(2)}</li>`);
        } else if (line.trim() === '') {
            closeList();
        } else {
            closeList();
            htmlBlocks.push(`<p>${line}</p>`);
        }
    });

    closeList(); // Close any remaining list

    let html = htmlBlocks.join('');

    // Inline replacements
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold + Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');       // Bold
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');               // Italic
    
    return html;
};

const ImageWithFallback: React.FC<{ src: string, alt: string, className: string }> = ({ src, alt, className }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [src]);

    const handleError = () => {
        setError(true);
    };

    if (error || !src) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-brand-surface border-2 border-dashed border-white/20 p-2`}>
                <ImageIcon className="w-1/4 h-1/4 text-brand-text-dark" />
                <p className="mt-2 text-xs text-center text-brand-text-dark">Image Unavailable</p>
            </div>
        );
    }

    return <img src={src} alt={alt} className={className} onError={handleError} />;
};


const LoadingSkeleton = () => (
    <div className="h-full w-full p-4 md:p-8 animate-pulse">
      {/* Skeleton for Header */}
      <div className="w-full h-[60vh] md:h-[70vh] mb-8 bg-brand-surface/50 rounded-lg"></div>
      
      {/* Skeleton for Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <div className="h-48 bg-brand-surface/50 rounded-lg"></div>
              <div className="h-48 bg-brand-surface/50 rounded-lg"></div>
          </div>
          <div className="lg:col-span-1 space-y-8">
              <div className="h-32 bg-brand-surface/50 rounded-lg"></div>
              <div className="h-32 bg-brand-surface/50 rounded-lg"></div>
              <div className="h-32 bg-brand-surface/50 rounded-lg"></div>
          </div>
      </div>
    </div>
);

const MovieDisplay: React.FC<MovieDisplayProps> = ({ movie, isLoading, sources }) => {
  const [showFullPlot, setShowFullPlot] = useState(false);
  const [showSuspenseBreaker, setShowSuspenseBreaker] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // This effect runs on the client, where document is available.
    setModalRoot(document.getElementById('modal-root'));
  }, []);

  const embedUrl = movie ? getYouTubeEmbedUrl(movie.trailer_url) : null;
  
  const displayedCast = movie ? (showAllCast ? movie.cast : movie.cast.slice(0, 8)) : [];


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTrailerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  if (isLoading && !movie) {
    return <LoadingSkeleton />;
  }
  
  if (!movie) {
    return (
      <div className="flex items-center justify-center h-full text-brand-text-dark animate-fade-in">
        <div className="text-center p-8">
            <Logo className="mx-auto h-24 w-24" />
            <h2 className="mt-4 text-2xl font-bold text-brand-text-light">Welcome to MovieMonk</h2>
            <p className="mt-2 text-lg">Search for a movie or series to begin your cinematic exploration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto relative">
        {isLoading && (
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fade-in">
                <FilmIcon className="w-16 h-16 text-brand-primary animate-spin" />
                <p className="mt-4 text-lg font-semibold text-brand-text-light">Fetching cinematic data...</p>
            </div>
        )}
        {/* Hero Section */}
        <div className="relative w-full h-[50vh] md:h-[60vh] animate-fade-in">
            <img src={movie.backdrop_url || ''} alt={`${movie.title} backdrop`} className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-transparent to-transparent opacity-50"></div>
            
            <div className="relative h-full flex items-center justify-center md:justify-start p-4 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 max-w-screen-xl mx-auto">
                    <ImageWithFallback src={movie.poster_url} alt={`${movie.title} poster`} className="w-40 md:w-52 lg:w-60 rounded-lg shadow-2xl border-4 border-white/10 aspect-[2/3] object-cover animate-slide-up" />
                    <div className="text-center md:text-left animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">{movie.title}</h1>
                        <p className="mt-2 text-md md:text-lg text-brand-text-dark font-medium">{movie.year} &bull; {movie.type.charAt(0).toUpperCase() + movie.type.slice(1)}</p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                        {movie.genres.map(genre => (
                            <span key={genre} className="px-3 py-1 bg-white/10 text-brand-text-light text-xs font-semibold rounded-full backdrop-blur-sm">{genre}</span>
                        ))}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 items-center justify-center md:justify-start">
                            {(movie.ratings || []).map(rating => (
                                <div key={rating.source} className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                    {rating.source.toLowerCase().includes('rotten') && (
                                        <RottenTomatoesIcon className="w-7 h-7 text-red-500" />
                                    )}
                                    {rating.source.toLowerCase().includes('imdb') && (
                                        <StarIcon className="w-7 h-7 text-yellow-400" />
                                    )}
                                    <div>
                                        <p className="font-bold text-white text-lg leading-tight">{rating.score}</p>
                                        <p className="text-xs text-brand-text-dark">{rating.source}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {embedUrl && (
                            <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <button
                                    onClick={() => setIsTrailerOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105"
                                >
                                    <PlayIcon className="w-6 h-6" />
                                    <span>Play Trailer</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      {/* Main Content */}
      <div className="p-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-16 md:-mt-20 relative z-10">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Synopsis">
            <p className="text-brand-text-dark leading-relaxed">{movie.summary_medium}</p>
            
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-brand-accent mb-2">Suspense Breaker</h3>
                <div className="relative p-4 rounded-lg bg-brand-surface group cursor-pointer" onClick={() => setShowSuspenseBreaker(true)}>
                    <p className={`italic text-brand-text-dark transition-all duration-300 ${!showSuspenseBreaker ? 'blur-sm select-none' : 'blur-none'}`}>{movie.suspense_breaker}</p>
                    {!showSuspenseBreaker && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <EyeIcon className="w-6 h-6 text-white"/>
                            <span className="ml-2 font-semibold text-white">Click to Reveal</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-brand-accent">Full Plot Details (Spoilers)</span>
                    <button 
                        onClick={() => setShowFullPlot(!showFullPlot)} 
                        aria-label={showFullPlot ? 'Hide full plot' : 'Show full plot'}
                        aria-expanded={showFullPlot}
                        aria-controls="spoiler-content"
                        className="p-2 rounded-full hover:bg-brand-primary/20 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200"
                    >
                        {showFullPlot ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
                {showFullPlot && (
                    <div id="spoiler-content" className="mt-3 pt-3 border-t border-brand-primary/20 animate-fade-in">
                        <p className="text-sm font-bold text-red-400 mb-2">{movie.summary_long_spoilers.startsWith("SPOILER WARNING") ? movie.summary_long_spoilers.split("—")[0] : "SPOILER WARNING"}</p>
                        <p className="text-brand-text-dark leading-relaxed whitespace-pre-wrap">{movie.summary_long_spoilers.replace(/^SPOILER WARNING — Full plot explained below\.\n*/, '')}</p>
                    </div>
                )}
            </div>
          </Section>
          
          <Section title="Cast & Crew">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedCast.map(member => <CastCard key={member.name} member={member} />)}
            </div>
            {movie.cast.length > 8 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setShowAllCast(!showAllCast)}
                        className="px-4 py-2 text-sm font-semibold text-brand-primary bg-brand-primary/10 rounded-full hover:bg-brand-primary/20 transition-colors"
                    >
                        {showAllCast ? 'Show Less' : `Show ${movie.cast.length - 8} More`}
                    </button>
                </div>
            )}
             <div className="mt-6 text-sm text-brand-text-dark grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <p><span className="font-semibold text-brand-text-light">Director:</span> {movie.crew.director}</p>
                <p><span className="font-semibold text-brand-text-light">Writer:</span> {movie.crew.writer}</p>
                <p><span className="font-semibold text-brand-text-light">Music:</span> {movie.crew.music}</p>
            </div>
          </Section>
          
          <Section title="AI Notes & Trivia">
             <div className="prose prose-invert prose-sm text-brand-text-dark max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:text-brand-accent" dangerouslySetInnerHTML={{ __html: markdownToHtml(movie.ai_notes) }} />
          </Section>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Section title="Where to Watch">
             <div className="space-y-3">
               {movie.where_to_watch.length > 0 ? movie.where_to_watch.map(option => <WatchCard key={option.platform} option={option} />) : <p className="text-brand-text-dark">Streaming information not available.</p>}
             </div>
          </Section>
          
           <Section title="Gallery">
             {movie.extra_images && movie.extra_images.length > 0 ? (
                 <div className="grid grid-cols-2 gap-2">
                    {movie.extra_images.slice(0, 4).map((img, i) => (
                        <a href={img} target="_blank" rel="noopener noreferrer" key={i}>
                            <ImageWithFallback src={img} alt={`Scene ${i+1}`} className="rounded-lg object-cover w-full h-full aspect-video hover:scale-105 transition-transform duration-300"/>
                        </a>
                    ))}
                 </div>
             ) : (
                <p className="text-brand-text-dark text-sm italic">No gallery images available.</p>
             )}
           </Section>

           {sources && sources.length > 0 && (
            <Section title="Data Sources">
              <div className="space-y-3">
                {sources.map((source, index) => (
                    source.web && <SourceCard key={index} source={source.web} />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {isTrailerOpen && embedUrl && modalRoot && ReactDOM.createPortal(
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            onClick={() => setIsTrailerOpen(false)}
            aria-modal="true"
            role="dialog"
          >
              <div 
                className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                  <iframe
                      src={embedUrl}
                      title={`${movie.title} Trailer`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                  ></iframe>
                  <button 
                    onClick={() => setIsTrailerOpen(false)}
                    aria-label="Close trailer"
                    className="absolute -top-3 -right-3 md:-top-4 md:-right-4 p-2 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition-colors shadow-lg"
                  >
                      <XMarkIcon className="w-6 h-6" />
                  </button>
              </div>
          </div>,
          modalRoot
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-surface/70 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg animate-slide-up">
        <h2 className="text-xl font-bold mb-4 text-brand-text-light border-b border-white/10 pb-3">{title}</h2>
        {children}
    </div>
);

const CastCard: React.FC<{ member: CastMember }> = ({ member }) => (
    <div className="bg-white/5 p-3 rounded-lg text-center transform hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-brand-primary">
        <p className="font-bold text-sm text-brand-text-light truncate">{member.name}</p>
        <p className="text-xs text-brand-primary truncate">{member.role}</p>
    </div>
);

const watchTypeIcons: Record<WatchOption['type'], React.FC<{ className?: string }>> = {
    subscription: TvIcon,
    rent: TicketIcon,
    buy: DollarIcon,
    free: TagIcon,
};

const WatchCard: React.FC<{ option: WatchOption }> = ({ option }) => {
    const IconComponent = watchTypeIcons[option.type] || null;

    return (
        <a href={option.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white/5 p-4 rounded-lg hover:bg-brand-primary/20 transition-colors group">
            <div>
                <p className="font-semibold text-brand-text-light">{option.platform}</p>
                <div className="flex items-center space-x-1.5 mt-1">
                    {IconComponent && <IconComponent className="w-4 h-4 text-brand-text-dark group-hover:text-brand-text-light transition-colors" />}
                    <p className="text-xs text-brand-text-dark capitalize group-hover:text-brand-text-light transition-colors">{option.type}</p>
                </div>
            </div>
            <span className="px-4 py-2 text-xs font-bold rounded-md bg-brand-primary text-white transform transition-transform group-hover:scale-105">
                Watch Now
            </span>
        </a>
    );
};


const SourceCard: React.FC<{ source: WebSource }> = ({ source }) => (
    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 bg-white/5 p-3 rounded-lg hover:bg-brand-primary/20 transition-colors group">
        <div className="flex-shrink-0 bg-brand-primary/20 p-2 rounded-md mt-1">
            <LinkIcon className="w-4 h-4 text-brand-primary group-hover:text-white transition-colors" />
        </div>
        <div>
            <p className="font-semibold text-sm text-brand-text-light line-clamp-2 leading-tight">{source.title}</p>
            <p className="text-xs text-brand-text-dark truncate">{source.uri}</p>
        </div>
    </a>
);


export default MovieDisplay;