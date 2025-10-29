import { Mail, Phone, MapPin, Target, Eye, Users, Rocket, Heart, TrendingUp, Award } from 'lucide-react';

const About = () => {
  const missionData = {
    title: "Our Mission",
    content: "At Prepzon, our mission is simple — to bridge the gap between classroom learning and corporate expectations. We help students become industry-ready professionals by providing the right training, mentorship, and practice tools needed to excel in recruitment exams and interviews of top MNCs."
  };

  const visionData = {
    title: "Our Vision",
    content: "To become India's most trusted Campus2Corporate training platform, empowering millions of students to achieve their dream jobs with confidence, clarity, and competence."
  };

  const whoWeAreData = {
    title: "Who We Are",
    content: "Prepzon is a Bangalore-based EdTech startup founded by a passionate team of professionals from the IT and education industries. With years of real-world experience, our trainers and mentors know what companies expect — and we ensure every student is fully prepared for it. We combine live interactive classes, recorded sessions, mock tests, and career guidance to create a 360° learning experience that delivers real results."
  };

  const whatWeOffer = {
    title: "What We Offer",
    items: [
      "Live & Recorded Training for Campus2Corporate programs",
      "Mock Tests (Free & Paid) for all top MNCs",
      "Study Notes, PDFs, and Assignments for effective learning",
      "Resume & Interview Preparation guidance",
      "Career Counseling and Job Assistance",
      "One-Year Access to all course materials and updates",
      "Open Discussion Forums for doubt clarification"
    ]
  };

  const ourPromise = {
    title: "Our Promise to Students",
    content: "We don't just teach — we mentor. Every student at Prepzon receives personal attention, detailed performance analysis, and continuous motivation to reach their goals. Whether you're preparing for your first job interview or improving your professional skills, Prepzon stands by you at every step — from learning to placement."
  };

  const ourImpact = {
    title: "Our Impact",
    content: "Hundreds of students have already improved their aptitude, communication, and technical skills through Prepzon's structured training programs — and have successfully landed jobs in leading MNCs like TCS, Infosys, Wipro, Accenture, Capgemini, and Cognizant."
  };

  const joinCommunity = {
    title: "Join the Prepzon Community",
    content: "Be part of a fast-growing network of learners, trainers, and recruiters. With Prepzon, you don't just prepare for a job — you prepare for a career."
  };

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="py-10 min-h-[40vh] flex items-center -mt-16 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg mx-auto max-w-4xl">
            <div className="flex justify-center mb-6">
              <img 
                src="/Final Logo.png" 
                alt="PrepZon Logo" 
                className="h-20 w-auto mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-orange-500">
              About PrepZon
            </h1>
            <p className="text-sm md:text-lg text-black max-w-3xl mx-auto">
              PrepZon is a next-generation EdTech platform built to bridge the gap between college learning and corporate readiness. We provide a complete suite of Live Interactive Training, Recorded Sessions, and Real-Time Mock Tests covering both Top IT Company Placements and Competitive Exams.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 h-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{missionData.title}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {missionData.content}
              </p>
            </div>

            <div className="p-8 h-full">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{visionData.title}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {visionData.content}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="p-8 md:p-12">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{whoWeAreData.title}</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {whoWeAreData.content}
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Rocket className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-black">{whatWeOffer.title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive learning solutions designed to make you industry-ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whatWeOffer.items.map((item, index) => (
              <div key={index} className="flex items-start p-4">
                <div className="bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="text-lg text-black">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise & Impact */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 h-full">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{ourPromise.title}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {ourPromise.content}
              </p>
            </div>

            <div className="p-8 h-full">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{ourImpact.title}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {ourImpact.content}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Community */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">{joinCommunity.title}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {joinCommunity.content}
          </p>
          <div className="p-8 max-w-2xl mx-auto">
            <p className="text-2xl font-bold italic text-orange-700">
              "🎯 Prepzon – Learn Smart. Test Better. Get Hired!"
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 min-h-[50vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions? Reach out to us through any of these channels
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Us</h3>
              <a href="mailto:support@prepzon.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                support@prepzon.com
              </a>
            </div>

            <div className="p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Call Us</h3>
              <a href="tel:+918431761279" className="text-blue-600 hover:text-blue-800 transition-colors">
                +91 8431761279
              </a>
            </div>

            <div className="p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-700">
                Prepzon EdTech,B-Block, Silver Springs Layout,
                Marathahalli<br />
                Munnekolala, Bangalore, Karnataka, India, 560037
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;