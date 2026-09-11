"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import {
  IconSparkles,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconShoppingBag,
  IconHeart,
  IconEye,
  IconLoader2,
  IconRefresh,
  IconLock,
  IconBrandX,
  IconBrandInstagram,
} from "@tabler/icons-react";

// ─── Animations ────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Loading Spinner ───────────────────────────────────────────

function LuxuryLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <motion.div
          className="relative w-20 h-20 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-line" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold" />
        </motion.div>
        <motion.p
          className="text-[10px] uppercase tracking-[0.3em] text-stone font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Finding Your Perfect Fragrance
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────

function ProgressBar({ current, total }) {
  const progress = total > 0 ? ((current) / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-stone font-medium">
          Question {current} of {total}
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-[3px] bg-line/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────

function HeroSection({ quiz, onStart }) {
  return (
    <motion.section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-noir">
        <div className="absolute inset-0 bg-gradient-to-b from-noir/90 via-noir/80 to-noir" />
        <div className="absolute inset-0 opacity-10 ">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gold/10 blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
        <motion.div variants={fadeIn}>
          <span className="luxe-eyebrow-dark mb-6 block">
            The Art of Fragrance
          </span>
        </motion.div>

        <motion.h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-medium leading-[1.1] mb-6"
          variants={fadeIn}
        >
          Discover Your
          <br />
          <span className="italic" style={{ color: "#B8976A" }}>
            Signature Scent
          </span>
        </motion.h1>

        <motion.p
          className="text-[15px] md:text-[17px] text-white/50 max-w-lg mx-auto leading-relaxed font-light mb-10"
          variants={fadeIn}
        >
          Answer a few questions and our intelligent fragrance matching system
          will recommend the perfect perfume tailored to your preferences.
        </motion.p>

        <motion.div variants={fadeIn}>
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold text-noir bg-gold hover:bg-gold-light transition-all duration-500 rounded-[6px] overflow-hidden"
          >
            <span className="relative z-10">Begin Your Journey</span>
            <IconArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" stroke={1.5} />
            <div className="absolute inset-0 bg-gold-dark transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </button>
        </motion.div>

        <motion.div
          className="mt-16 flex items-center justify-center gap-8 text-white/30"
          variants={fadeIn}
        >
          <div className="text-center">
            <p className="text-2xl font-display text-gold">2 min</p>
            <p className="text-[10px] uppercase tracking-wider mt-1">Quick Quiz</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-display text-gold">AI</p>
            <p className="text-[10px] uppercase tracking-wider mt-1">Powered</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-display text-gold">100%</p>
            <p className="text-[10px] uppercase tracking-wider mt-1">Personalized</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

// ─── Question Card ─────────────────────────────────────────────

function QuestionCard({ question, selectedOptions, onSelect, onNext, onPrev, isFirst, isLast }) {
  const isMultiple = question.questionType === "MULTIPLE_CHOICE";
  const isYesNo = question.questionType === "YES_NO";

  const handleSelect = (optionId) => {
    if (isMultiple) {
      const current = selectedOptions || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onSelect(question.id, updated);
    } else {
      onSelect(question.id, optionId);
    }
  };

  const isSelected = (optionId) => {
    if (isMultiple) {
      return (selectedOptions || []).includes(optionId);
    }
    return selectedOptions === optionId;
  };

  return (
    <motion.div
      key={question.id}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl text-noir font-medium mb-2">
          {question.title}
        </h2>
        {question.description && (
          <p className="text-[14px] text-stone font-light">
            {question.description}
          </p>
        )}
      </div>

      {isYesNo ? (
        <div className="flex gap-4 justify-center">
          {["Yes", "No"].map((answer) => (
            <button
              key={answer}
              onClick={() => handleSelect(answer.toLowerCase())}
              className={cn(
                "w-40 py-6 rounded-[8px] border-2 transition-all duration-300 text-[13px] uppercase tracking-[0.1em] font-medium",
                isSelected(answer.toLowerCase())
                  ? "border-gold bg-gold/5 text-noir"
                  : "border-line hover:border-gold/40 text-stone"
              )}
            >
              {answer}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options?.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "relative flex items-center gap-4 p-5 rounded-[8px] border-2 transition-all duration-300 text-left group",
                isSelected(option.id)
                  ? "border-gold bg-gold/5"
                  : "border-line hover:border-gold/30 hover:bg-ivory"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected(option.id) && (
                <motion.div
                  className="absolute top-3 right-3 h-5 w-5 rounded-full bg-gold flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <IconCheck className="h-3 w-3 text-white" stroke={2.5} />
                </motion.div>
              )}

              {option.image && (
                <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-ivory">
                  <img
                    src={option.image}
                    alt={option.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-noir block">
                  {option.title}
                </span>
                {option.description && (
                  <span className="text-[12px] text-stone font-light block mt-0.5">
                    {option.description}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors",
            isFirst ? "text-gray-300 cursor-not-allowed" : "text-stone hover:text-noir"
          )}
        >
          <IconArrowLeft className="h-4 w-4" stroke={1.5} />
          Previous
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3 text-[11px] uppercase tracking-[0.15em] font-semibold text-white bg-noir hover:bg-gold transition-all duration-300 rounded-[6px]"
        >
          {isLast ? "See Results" : "Continue"}
          <IconArrowRight className="h-4 w-4" stroke={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Product Card ──────────────────────────────────────────────

function ProductCard({ product, index }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      // Pass full product object to ensure all details (price, image, name, variantId) are preserved
      await addToCart(product, 1);
      toast.success(`${product.name || "Fragrance"} added to cart!`);
    } catch (error) {
      console.error("Cart error:", error);
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group w-full max-w-sm sm:max-w-none mx-auto"
    >
      <div className="bg-white border border-[#E8DAFA] hover:border-[#B8976A] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between h-full">
        {/* Image & Badges */}
        <div className="relative aspect-square bg-[#FAF5FF] overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconSparkles className="h-12 w-12 text-[#7E52BC]/30" />
            </div>
          )}

          {/* Match Badge */}
          {product.isSecretLocked && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#B8976A] text-white shadow-md rounded-full">
              <span className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <IconLock className="h-3 w-3" stroke={2} />
                Secret
              </span>
            </div>
          )}

          {product.matchPercentage > 0 && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-[#4A2478] to-[#6E36B0] text-white shadow-md rounded-full">
              <span className="text-[10px] uppercase tracking-widest font-bold">
                {product.matchPercentage}% Match
              </span>
            </div>
          )}
        </div>

        {/* Info & Action Buttons */}
        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
          <div>
            <h3 className="font-serif text-xl text-[#240E42] font-semibold mb-1 line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              {product.salePrice && product.salePrice < product.price ? (
                <>
                  <span className="text-base font-bold text-[#4A2478]">
                    {formatCurrency(product.salePrice)}
                  </span>
                  <span className="text-xs text-[#5C4D73]/60 line-through">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : product.price ? (
                <span className="text-base font-bold text-[#4A2478]">
                  {formatCurrency(product.price)}
                </span>
              ) : null}
            </div>

            {product.isFallback && (
              <p className="text-[11px] text-[#7E52BC] italic mt-1 font-light">
                Popular pick for your profile
              </p>
            )}
          </div>

          {/* Responsive Action Buttons (Stacked on Mobile, Side-by-side on Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-3 border-t border-[#E8DAFA]">
            {product.isSecretLocked ? (
              <Link
                href="/secret-collection"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#B8976A] text-white text-xs uppercase tracking-wider font-semibold rounded-xl hover:bg-[#A38155] transition-all duration-300 shadow"
              >
                <IconLock className="h-4 w-4" stroke={1.5} />
                Unlock Collection
              </Link>
            ) : (
              <>
                <Link
                  href={`/products/${product.slug}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 border border-[#D9C8F5] text-[#4A2478] hover:bg-[#FAF5FF] text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap shadow-sm"
                >
                  <IconEye className="h-4 w-4 text-[#7E52BC] shrink-0" />
                  View
                </Link>
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 bg-[#4A2478] hover:bg-[#38195E] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md whitespace-nowrap"
                >
                  {adding ? (
                    <IconLoader2 className="h-4 w-4 animate-spin text-[#EAD5AB] shrink-0" />
                  ) : (
                    <IconShoppingBag className="h-4 w-4 text-[#EAD5AB] shrink-0" />
                  )}
                  {adding ? "Adding..." : "Add to Cart"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Results Section ───────────────────────────────────────────

function ResultsSection({ results, onRestart }) {
  const recommendations = results?.recommendations || [];
  const matchedRules = results?.matchedRules || [];

  return (
    <motion.section
      className="min-h-screen bg-gradient-to-b from-[#FAF7FD] via-[#F4EBFD] to-[#FAF7FD] py-20"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div className="text-center mb-12 space-y-3" variants={fadeIn}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#B8976A]/40 bg-white/90 rounded-full text-[#7048A0] text-xs uppercase tracking-[0.25em] font-semibold shadow-sm">
            <IconSparkles className="w-4 h-4 text-[#B8976A]" />
            Personalized Fragrance Match
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#240E42] font-medium">
            Your Perfect <span className="italic text-[#6533A3]">Fragrances</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4D73] font-light max-w-md mx-auto leading-relaxed">
            Based on your quiz preferences, our atelier recommends these luxury scents crafted just for your olfactory profile.
          </p>
        </motion.div>

        {/* Matched Rules Info */}
        {matchedRules.length > 0 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-10"
            variants={fadeIn}
          >
            {matchedRules.map((rule) => (
              <span
                key={rule.id}
                className="px-4 py-2 bg-white/90 border border-[#E8DAFA] rounded-full text-xs uppercase tracking-wider text-[#4A2478] font-semibold shadow-sm"
              >
                ✨ {rule.name}
              </span>
            ))}
          </motion.div>
        )}

        {/* Products Grid */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div className="text-center py-20 bg-white rounded-3xl border border-[#E8DAFA] shadow-lg" variants={fadeIn}>
            <IconSparkles className="h-16 w-16 text-[#7E52BC]/40 mx-auto mb-6" />
            <h3 className="text-2xl font-serif text-[#240E42] mb-2">
              No matches found
            </h3>
            <p className="text-sm text-[#5C4D73] font-light mb-6">
              Try adjusting your answers for better recommendations.
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16"
          variants={fadeIn}
        >
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.15em] font-semibold text-[#4A2478] border border-[#4A2478] hover:bg-[#4A2478] hover:text-white transition-all duration-300 rounded-full bg-white shadow-sm"
          >
            <IconRefresh className="h-4 w-4" stroke={1.5} />
            Retake Quiz
          </button>
          <Link
            href="/products"
            className="flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.15em] font-semibold text-white bg-[#4A2478] hover:bg-[#38195E] transition-all duration-300 rounded-full shadow-xl"
          >
            Browse All Fragrances
            <IconArrowRight className="h-4 w-4 text-[#EAD5AB]" stroke={1.5} />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function FragranceFinderPage() {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("hero"); // hero | quiz | loading | results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/fragrance-quiz");
      if (response.success) {
        setQuiz(response.data);
      }
    } catch (error) {
      console.error("Failed to load quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setPhase("quiz");
    setCurrentQuestion(0);
    setAnswers({});
    startTimeRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const questions = quiz?.questions || [];
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      setPhase("loading");
      setSubmitting(true);

      const timeTaken = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null;

      const answerArray = Object.entries(answers).flatMap(([questionId, value]) => {
        if (Array.isArray(value)) {
          // Multiple choice - send all selected options
          return value.map((optId) => ({ questionId, optionId: optId }));
        }
        // Check if value is an option ID (UUID format) or a string like "yes"/"no"
        if (value && typeof value === "string" && value.length > 20) {
          return [{ questionId, optionId: value }];
        }
        return [{ questionId, value }];
      });

      const response = await fetchApi("/fragrance-quiz/submit", {
        method: "POST",
        body: JSON.stringify({
          answers: answerArray,
          guestId: user ? undefined : `guest_${Date.now()}`,
          timeTaken,
        }),
      });

      if (response.success) {
        setResults(response.data);
        setPhase("results");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to get recommendations. Please try again.");
      setPhase("quiz");
    } finally {
      setSubmitting(false);
    }
  }, [answers, user]);

  const handleRestart = () => {
    setPhase("hero");
    setCurrentQuestion(0);
    setAnswers({});
    setResults(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-5">
          <IconSparkles className="h-16 w-16 text-stone/20 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-noir mb-4">
            Quiz Unavailable
          </h1>
          <p className="text-[15px] text-stone font-light mb-8">
            The Fragrance Finder is currently being set up. Please check back later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-white bg-noir hover:bg-gold transition-all duration-300 rounded-[6px]"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {phase === "hero" && (
          <HeroSection key="hero" quiz={quiz} onStart={handleStart} />
        )}

        {phase === "quiz" && question && (
          <motion.section
            key={`quiz-${currentQuestion}`}
            className="min-h-screen flex flex-col items-center justify-center px-5 py-20 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProgressBar current={currentQuestion + 1} total={questions.length} />
            <QuestionCard
              question={question}
              selectedOptions={answers[question.id]}
              onSelect={handleSelect}
              onNext={handleNext}
              onPrev={handlePrev}
              isFirst={currentQuestion === 0}
              isLast={currentQuestion === questions.length - 1}
            />
          </motion.section>
        )}

        {phase === "loading" && <LuxuryLoader key="loading" />}

        {phase === "results" && (
          <ResultsSection
            key="results"
            results={results}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
