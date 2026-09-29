import { lazy, Suspense, useState } from "react";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { HiSparkles } from "react-icons/hi";
import { BsRobot, BsMic, BsClock, BsBarChart, BsFileEarmarkText } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import evalImg from "../assets/ai-ans.webp";
import hrImg from "../assets/HR.webp";
import techImg from "../assets/tech.webp";
import confidenceImg from "../assets/confi.webp";
import creditImg from "../assets/credit.webp";
import resumeImg from "../assets/resume.webp";
import pdfImg from "../assets/pdf.webp";
import analyticsImg from "../assets/history.webp";
import Footer from "../components/Footer";

// login popup + Firebase sirf popup khulne par download (home page jaldi khule)
const Authmodel = lazy(() => import("../components/Authmodel"));

function Home() {
    const userData = useSelector((state) => state.user.userData);
    const [showAuth, setShowAuth] = useState(false);
    const navigate = useNavigate();

    const goToInterview = () => {
        if (!userData) {
            setShowAuth(true);
            return;
        }
        navigate("/interview");
    };

    const goToHistory = () => {
        if (!userData) {
            setShowAuth(true);
            return;
        }
        navigate("/history");
    };

    return (
        <div className="min-h-screen bg-[#f3f3f3] flex flex-col">
            <Navbar />

            <div className="flex-1 px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <HiSparkles size={20} className="text-green-500 bg-green-50" />
                            AI Powered Smart Interview Platform
                        </div>
                    </div>

                    <div className="text-4xl mb-28">
                        <motion.h1
                            initial={{ opacity: 0, y: -40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.5 }}
                            className="text-4xl md:text-6xl font-semibold text-center mb-8 leading-tight max-w-4xl mx-auto"
                        >
                            Practice Interviews with
                            <span className="relative inline-block">
                                <span className="bg-green-100 text-green-600 px-5 py-1 rounded-full">
                                    AI Intelligence
                                </span>
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="text-center text-gray-500 mt-6 text-lg md:text-xl max-w-2xl mx-auto"
                        >
                            Role Based Interview Questions, Real-Time Feedback, and Personalized Recommendations to help
                            you ace your interviews.
                        </motion.p>

                        <div className="flex flex-wrap justify-center items-center gap-4 mt-10">
                            <motion.button
                                onClick={goToInterview}
                                whileHover={{ opacity: 0.9, scale: 1.05 }}
                                whileTap={{ opacity: 1.0, scale: 0.95 }}
                                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300"
                            >
                                Get Started
                            </motion.button>

                            <motion.button
                                onClick={goToHistory}
                                whileHover={{ opacity: 0.9, scale: 1.05 }}
                                whileTap={{ opacity: 1.0, scale: 0.95 }}
                                className="border border-gray-300 px-10 py-3 rounded-full hover:bg-gray-100 transition-colors duration-300"
                            >
                                View History
                            </motion.button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-10 mt-28">
                        {[
                            {
                                icon: <BsRobot size={24} />,
                                step: "STEP 1",
                                title: "Role & Experience Selection",
                                desc: "AI adjusts difficulty based on your selected role.",
                            },
                            {
                                icon: <BsMic size={24} />,
                                step: "STEP 2",
                                title: "Smart Interview with Voice Recognition",
                                desc: "Dynamic questions based on your answers, with real-time feedback.",
                            },
                            {
                                icon: <BsClock size={24} />,
                                step: "STEP 3",
                                title: "Timer Based simulation",
                                desc: "Real interview pressure with time tracking.",
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 60 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 + index * 0.2 }}
                                whileHover={{ rotate: 0, scale: 1.06 }}
                                className={`relative bg-white rounded-3xl border-2 border-green-100 hover:border-green-300 p-10 w-80 max-w-[98%] shadow-md hover:shadow-2xl
                                transition-all duration-300
                                ${index === 0 ? "rotate-[-4deg]" : ""}
                                ${index === 1 ? "rotate-[3deg] md:mt-6 shadow-xl" : ""}
                                ${index === 2 ? "rotate-[-3deg]" : ""}
                                `}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white border-2 border-green-500 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                                    {item.icon}
                                </div>

                                <div className="text-center pt-10">
                                    <div className="text-xs text-green-600 font-semibold mb-2 tracking-wider">
                                        {item.step}
                                    </div>

                                    <h3 className="font-semibold mb-3 text-lg">{item.title}</h3>

                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mb-32">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-semibold text-center mb-16 pt-10"
                        >
                            Advanced AI <span className="text-green-600">Capabilities</span>
                        </motion.h2>

                        <div className="grid md:grid-cols-2 gap-10">
                            {[
                                {
                                    image: evalImg,
                                    icon: <BsBarChart size={20} />,
                                    title: "AI Answer Evaluation",
                                    desc: "Scores communication skills, content quality, technical accuracy and confidence.",
                                },
                                {
                                    image: resumeImg,
                                    icon: <BsFileEarmarkText size={20} />,
                                    title: "Resume Based Interview",
                                    desc: "Project-specific question based on resume.",
                                },
                                {
                                    image: pdfImg,
                                    icon: <BsFileEarmarkText size={20} />,
                                    title: "Downloadable PDF Report",
                                    desc: "Detailed Strengths, Weaknesses and improvements insights.",
                                },
                                {
                                    image: analyticsImg,
                                    icon: <BsBarChart size={20} />,
                                    title: "Interview History Analytics",
                                    desc: "Track your progress and performance over time.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-full md:w-1/2 flex justify-center">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-auto object-contain max-h-64"
                                            />
                                        </div>

                                        <div className="w-full md:w-1/2">
                                            <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                                {item.icon}
                                            </div>

                                            <h3 className="font-semibold mb-3 text-xl">{item.title}</h3>

                                            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-32">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-semibold text-center mb-16 pt-10"
                        >
                            Multiple Interview <span className="text-green-600">Modes</span>
                        </motion.h2>

                        <div className="grid md:grid-cols-2 gap-10">
                            {[
                                {
                                    image: hrImg,
                                    title: "HR Interview Mode",
                                    desc: "Behavioral and Communication Skills Assessment.",
                                },
                                {
                                    image: techImg,
                                    title: "Technical Interview Mode",
                                    desc: "Role-Specific Technical Questions and Problem-Solving.",
                                },
                                {
                                    image: confidenceImg,
                                    title: "Confidence Interview Mode",
                                    desc: "Evaluates your confidence, body language, and presentation skills.",
                                },
                                {
                                    image: creditImg,
                                    title: "Credit Based Interview Mode",
                                    desc: "Unlock advanced features and personalized recommendations with credits.",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                    }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="w-1/2 ">
                                            <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                        </div>

                                        <div className="w-1/2 flex justify-end">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-28 h-28 object-contain"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {showAuth && (
                <Suspense fallback={null}>
                    <Authmodel onClose={() => setShowAuth(false)} />
                </Suspense>
            )}
            <Footer />
        </div>
    );
}

export default Home;
