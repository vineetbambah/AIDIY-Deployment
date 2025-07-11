import React, { useState } from "react";
import { Link } from "react-router-dom";
import { tw } from "@twind/core";
// import KidCashImage from '../images/your-image.png'; // adjust the path if needed
// import KidCash from "../images/kidcash.png"; // adjust the path as needed
import aidiyLogo from "../images/aidiy_logo.png";
import AIAvatar from "./AIAvatar";
import aiPowered from "../images/ai-powered.png";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={tw("min-h-screen")}>
      {/* Navigation */}
      <nav
        className={tw(
          "fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50"
        )}
      >
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <div className={tw("flex items-center justify-between h-20")}>
            <Link to="/" className={tw("flex items-center space-x-2")}>
              <img src={aidiyLogo} alt="AiDIY" className="h-20 w-auto" />
            </Link>
            <Link
              to="/login"
              className={tw(
                "inline-block px-8 py-2 text-white font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              )}
              style={{
                background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                borderRadius: "10px",
                border: "1px solid black",
                color: "black",
              }}
            >
              Sign in 
            </Link>

            {/* <div className={tw(`md:flex items-center space-x-8 ${isMenuOpen ? 'flex' : 'hidden'}`)}>
              <Link to="/features" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                Features
              </Link>
              <Link to="/about" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                About Us
              </Link>
              <Link to="/contact" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                Contact
              </Link>
              <Link to="/login" className={tw('bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}>
                Login
              </Link>
            </div> */}

            <button onClick={toggleMenu} className={tw("md:hidden")}>
              <div className={tw("space-y-1.5")}>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>
      Hero Section
      <section
        className={tw("pt-32 pb-3 overflow-hidden")}
        style={{
          background:
            "linear-gradient(to bottom right, rgba(183, 115, 190, 0.9), rgba(30, 234, 234, 0.9))",
        }}
      >
        {/* Your content here */}

        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          {/* Text and Button + Image Side-by-Side */}
          <div className={tw("text-white text-center lg:text-left")}>
            <h1
              className={tw(
                "text-[42px] sm:text-[48px] lg:text-[58px] font-extrabold mr-6 mb-6 text-[#0a2150]"
              )}
              // style={{
              //   fontFamily: "Nunito, sans-serif",
              // }}
            >
              AiDIY – Your Life Skills Buddy
            </h1>

            <div
              className={tw(
                "flex flex-col lg:flex-row items-center justify-between"
              )}
            >
              {/* Left side: paragraph and button */}
              <div className={tw("lg:w-1/2 text-center lg:text-left")}>
                <p
                  className={tw(
                    "text-base sm:text-lg lg:text-xl opacity-90 mb-8 leading-relaxed text-[E17A20] text-justify"
                  )}
                >
                  Meet AiDIY — Your friendly AI buddy that makes learning about
                  money more fun. Kids learn by doing; this DIY concept helps
                  kids make smart money choices. AiDIY guides kids through
                  real-world challenges with a voice they trust and a vibe they
                  love — and that parents can trust. Designed for curious minds
                  aged 8–16, AiDIY grows with your child—adapting to their pace,
                  cheering them on, and celebrating every milestone. Let’s build
                  a generation that’s financially wise, independent, and ready
                  for life — with a little help from their favorite money coach
                  — AiDIY.
                </p>

                <div
                  className={tw(
                    "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  )}
                >
                  {/* <Link
                    to="/login"
                    className={tw(
                      "shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    style={{
                      width: "180px",
                      height: "59px",
                      borderRadius: "10px",
                      background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid black",
                      color: "black",
                      textAlign: "center",
                    }}
                  >
                    Lets Begin
                  </Link> */}
                </div>
              </div>

              {/* Right side: image */}
              <div className={tw("lg:w-1/2 mt-10 lg:mt-0 flex justify-center")}>
                <div className={tw("flex justify-center mb-6 scale-150")}>
                  <AIAvatar size="large" animated={true} />
                </div>
              </div>
            </div>
          </div>

          <section className={tw("py-20")}>
            <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
              <h2
                className={tw(
                  "text-4xl font-bold text-center text-[#0a2150] mb-12"
                )}
              >
                Set Goals. Hit Milestones. Build Money Smart Skills with
                Confidence
              </h2>

              {/* Kid Blocks - Equal Sized */}
              {/* First Row - Personalized, Safe, Parent Tools */}
              <div className={tw("flex flex-col md:flex-row gap-6 mb-10")}>
                {/* Personalized Learning */}
                <div
                  className={tw(
                    "bg-[#FCE4EC] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <span className="text-2xl font-bold text-[#0a2150] mb-4">
                    <span className="flex items-center gap-2">
                      <img src={aiPowered} alt="ai" className="w-5 h-5" />
                      Personalized Learning
                    </span>
                  </span>
                  {/* <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    📈 Personalized Learning
                  </h3> */}
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Powered by AI, made for kids. Empowering young minds, the money smart way.
                  </p>
                </div>

                {/* Safe by Design */}
                <div
                  className={tw(
                    "bg-[#E8EAF6] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    🔐 Safe by Design
                  </h3>
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Designed with care, built for safety—because every child
                    deserves a secure experience.
                  </p>
                </div>

                {/* Parent Tools */}
                <div
                  className={tw(
                    "bg-[#E0F2F1] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    💼 Parent Tools
                  </h3>
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Approve challenges, add rewards, and witness your kids learning journey firsthand.
                  </p>
                </div>
              </div>

              {/* Second Row - Goal, Progress, Milestone */}
              <div className={tw("flex flex-col md:flex-row gap-6")}>
                {/* Goal Setting */}
                <div
                  className={tw(
                    "bg-[#E0F7FA] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    🎯 Goal Setting
                  </h3>
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Smart, age-appropriate money missions tailored to skill
                    level.
                  </p>
                </div>

                {/* Progress Tracking */}
                <div
                  className={tw(
                    "bg-[#F1F8E9] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    📊 Progress Tracking
                  </h3>
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Rewards, skill streaks, and achievement boards to boost
                    engagement.
                  </p>
                </div>

                {/* Milestone Rewards */}
                <div
                  className={tw(
                    "bg-[#FFF3E0] p-8 rounded-[20px] shadow-lg flex-1 flex flex-col min-h-[220px]"
                  )}
                >
                  <h3 className={tw("text-2xl font-bold text-[#0a2150] mb-4")}>
                    🏅 Milestone Rewards
                  </h3>
                  <p className={tw("text-[#0a2150] text-base flex-grow")}>
                    Digital badges, praise from AiDIY, and optional parent-set
                    rewards.
                  </p>
                </div>
              </div>

              {/* CTA Below the Blocks */}
              <div className={tw("mt-16 text-center")}>
                <h3 className={tw("text-3xl font-bold text-[#0a2150] mb-6")}>
                  Ready to raise a Money Smart Confident kid?
                </h3>
                <Link
                  to="/login"
                  className={tw(
                    "inline-block px-8 py-4 text-white font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  )}
                  style={{
                    background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                    borderRadius: "10px",
                    border: "1px solid black",
                    color: "black",
                  }}
                >
                  Get Started for Free
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
      {/* Footer */}
      <footer className={tw("bg-gray-800 text-white py-12")}>
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <div className={tw("grid grid-cols-1 md:grid-cols-4 gap-8 mb-8")}>
            <div>
              <h4
                className={tw("text-lg font-bold text-primary-turquoise mb-4")}
              >
                AiDIY
              </h4>
              <p className={tw("text-gray-400")}>Your Life Skills Buddy</p>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Product
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/features"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/safety"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Safety
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Support
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/help"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Company
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/about"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className={tw("border-t border-gray-700 pt-8 text-center")}>
            <p className={tw("text-gray-400")}>
              &copy; 2024 AiDIY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
