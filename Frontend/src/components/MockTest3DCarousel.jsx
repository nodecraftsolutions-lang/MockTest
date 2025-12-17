import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, ChevronRight, Lock, Building } from "lucide-react";
import api from "../api/axios";

// Predefined gradients to cycle through
const GRADIENTS = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-violet-500",
    "from-green-500 to-emerald-400",
    "from-orange-400 to-red-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-600",
    "from-teal-400 to-emerald-600",
    "from-fuchsia-500 to-purple-600"
];

const MockTest3DCarousel = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await api.get("/companies");
                if (res.data.success && res.data.data.companies) {
                    const companies = res.data.data.companies.map((company, index) => ({
                        id: company._id,
                        title: company.name,
                        company: company.name,
                        description: company.description || (company.descriptionHtml ? company.descriptionHtml.replace(/<[^>]*>?/gm, "") : "No description available"),
                        color: GRADIENTS[index % GRADIENTS.length],
                        logo: company.logoUrl,
                    }));
                    setItems(companies);
                }
            } catch (error) {
                console.error("Failed to fetch companies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    useEffect(() => {
        let interval;
        if (isAutoPlaying && items.length > 0) {
            interval = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % items.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isAutoPlaying, items.length]);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % items.length);
        setIsAutoPlaying(false);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
        setIsAutoPlaying(false);
    };

    const handleCardClick = (index, companyId) => {
        if (index !== activeIndex) {
            setActiveIndex(index);
            setIsAutoPlaying(false);
            return;
        }

        const targetUrl = `/student/mock-tests/${companyId}`;
        if (isAuthenticated) {
            navigate(targetUrl);
        } else {
            localStorage.setItem("redirectAfterLogin", targetUrl);
            navigate("/auth");
        }
    };

    if (loading || items.length === 0) {
        return null;
    }

    return (
        <div className="w-full py-16 overflow-hidden">
            <div className="text-center mb-12 px-4">
                <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
                    Exam Ready
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                    Crack Your <span className="text-primary">Dream Company</span>
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                    Company-specific mock tests designed to match real exam patterns.
                </p>
            </div>

            <div className="relative h-[400px] flex items-center justify-center perspective-1000">
                {/* Navigation Buttons */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 z-50 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform hidden md:block"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 z-50 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform hidden md:block"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                <div className="relative w-full max-w-5xl mx-auto h-full flex items-center justify-center">
                    <AnimatePresence initial={false}>
                        {items.map((test, i) => {
                            let offset = (i - activeIndex);
                            if (offset > items.length / 2) offset -= items.length;
                            if (offset < -items.length / 2) offset += items.length;

                            // Adjust visibility range based on item count
                            if (Math.abs(offset) > 2 && items.length > 5) return null;

                            const isActive = offset === 0;

                            return (
                                <motion.div
                                    key={test.id}
                                    className="absolute w-56 md:w-64 aspect-[3/3.8] rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-xl overflow-hidden cursor-pointer"
                                    initial={{
                                        scale: 0.8,
                                        x: 100 * offset,
                                        opacity: 0,
                                        rotateY: -15 * offset,
                                        zIndex: 0
                                    }}
                                    animate={{
                                        scale: isActive ? 1.05 : 0.8,
                                        x: offset === 0 ? 0 : offset * (window.innerWidth < 768 ? 140 : 200),
                                        y: isActive ? 0 : 20,
                                        opacity: isActive ? 1 : 0.6,
                                        zIndex: 50 - Math.abs(offset) * 10,
                                        rotateY: isActive ? 0 : offset > 0 ? -15 : 15,
                                        rotateZ: isActive ? 0 : offset > 0 ? 2 : -2,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30
                                    }}
                                    onClick={() => handleCardClick(i, test.id)}
                                    whileHover={{
                                        scale: isActive ? 1.1 : 0.85,
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    {/* Card Content - Logo Half */}
                                    <div className="h-1/2 bg-white p-4 flex items-center justify-center relative overflow-hidden border-b border-gray-100">
                                        {test.logo ? (
                                            <img
                                                src={test.logo}
                                                alt={test.company}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full bg-gray-50">
                                                <Building className="w-16 h-16 text-gray-300" />
                                            </div>
                                        )}
                                        {!isAuthenticated && (
                                            <div className="absolute top-2 right-2 p-1 bg-black/5 rounded-full text-gray-400">
                                                <Lock size={14} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content - Description Half */}
                                    <div className="h-1/2 p-4 flex flex-col items-center text-center">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">
                                            {test.title}
                                        </h3>

                                        <div className="text-xs text-gray-600 dark:text-gray-300 flex-grow w-full relative px-2">
                                            <div className="line-clamp-3 leading-relaxed whitespace-pre-line"
                                                dangerouslySetInnerHTML={{
                                                    __html: test.description?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || ''
                                                }}
                                            />
                                        </div>

                                        <div className="w-full mt-3">
                                            <span
                                                className={`block w-full py-1.5 px-3 rounded-lg font-medium text-xs transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {isActive ? (isAuthenticated ? "Start Mock Test" : "Sign in to Practice") : "View Details"}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Indicators */}
            {items.length > 0 && (
                <div className="flex justify-center mt-8 gap-2">
                    {items.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setActiveIndex(idx);
                                setIsAutoPlaying(false);
                            }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-primary' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MockTest3DCarousel;
