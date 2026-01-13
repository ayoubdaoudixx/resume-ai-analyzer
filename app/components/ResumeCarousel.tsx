import { useState, useEffect } from 'react';
import ResumeCard from './ResumeCard';
import { ChevronLeft, ChevronRight, Grid3x3 } from 'lucide-react';

interface ResumeCarouselProps {
    resumes: Resume[];
}

const ResumeCarousel = ({ resumes }: ResumeCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerView(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerView(2);
            } else if (window.innerWidth < 1280) {
                setItemsPerView(3);
            } else {
                setItemsPerView(4);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, resumes.length - itemsPerView);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => Math.min(maxIndex, prevIndex + 1));
    };

    const toggleShowAll = () => {
        setShowAll(!showAll);
        if (!showAll) {
            setCurrentIndex(0);
        } else {
            setCurrentIndex(0);
        }
    };

    if (showAll) {
        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-semibold text-gradient">All Resumes</h3>
                    <button
                        onClick={toggleShowAll}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Show Less
                    </button>
                </div>
                <div className="flex flex-wrap gap-4 justify-start w-full">
                    {resumes.map((resume, index) => (
                        <div
                            key={resume.id}
                            className="animate-in fade-in duration-500"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <ResumeCard resume={resume} compact={true} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold text-gradient">Your Resumes</h3>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleShowAll}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Grid3x3 className="w-5 h-5" />
                        Show All
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="overflow-hidden rounded-2xl">
                    <div
                        className="flex transition-transform duration-500 ease-in-out gap-6"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                        }}
                    >
                        {resumes.map((resume, index) => (
                            <div
                                key={resume.id}
                                className="flex-shrink-0"
                                style={{
                                    width: `${(100 / itemsPerView) * 1.05}%`,
                                }}
                            >
                                <ResumeCard resume={resume} />
                            </div>
                        ))}
                    </div>
                </div>

                {resumes.length > itemsPerView && (
                    <>
                        <button
                            onClick={goToPrevious}
                            disabled={currentIndex === 0}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-all duration-300 ${
                                currentIndex === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-white text-gray-800 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:scale-110 hover:shadow-xl'
                            }`}
                            aria-label="Previous resumes"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                            onClick={goToNext}
                            disabled={currentIndex >= maxIndex}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-all duration-300 ${
                                currentIndex >= maxIndex
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-white text-gray-800 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:scale-110 hover:shadow-xl'
                            }`}
                            aria-label="Next resumes"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {resumes.length > itemsPerView && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: maxIndex + 1 }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    currentIndex === index
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeCarousel;
