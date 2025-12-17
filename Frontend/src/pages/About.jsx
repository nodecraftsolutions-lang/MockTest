import { Mail, Phone, MapPin, Target, Eye, Users, Rocket, Heart, TrendingUp, Award } from 'lucide-react';

const About = () => {
  const missionData = {
    title: "Our Mission",
    content: "At PrepZon, our mission is to help students succeed in competitive and entrance exams through high-quality mock tests that mirror real exam patterns. We aim to empower students with the right practice, performance insights, and exam readiness needed to confidently face entrance and competitive assessments."
  };

  const visionData = {
    title: "Our Vision",
    content: "To become India’s most trusted mock test platform, enabling students to prepare smarter, practice better, and achieve their academic and career goals through accurate exam simulations and data-driven performance analysis."
  };

  const whoWeAreData = {
    title: "Who We Are",
    content: "PrepZon is an India-based EdTech platform built by a team of professionals with strong experience in education and assessment design. We specialize in exam-focused mock tests for college entrance and competitive exams, helping students understand real exam difficulty, improve time management, and track their progress with detailed analytics-all in one simple platform."
  };

  const whatWeOffer = {
    title: "What We Offer",
    subtitle: "Smart mock test solutions designed to help students practice better and perform confidently in real exams.",
    items: [
      { title: "Real Exam–Pattern Mock Tests", desc: "Carefully designed tests that closely match the latest exam formats, difficulty levels, and question trends." },
      { title: "Free & Premium Mock Tests", desc: "Try free sample tests before upgrading to full-length and advanced paid test series." },
      { title: "Wide Range of Entrance Exams", desc: "Mock tests for major college entrance and competitive exams such as Engineering, Medical, Management, Law, and other aptitude-based tests." },
      { title: "Detailed Performance Analysis", desc: "Instant scorecards with accuracy, time management insights, and section-wise analysis to identify strengths and improvement areas." },
      { title: "Unlimited Practice & Retakes", desc: "Practice multiple times and track progress over time to improve speed and confidence." },
      { title: "Anytime, Anywhere Access", desc: "Attempt mock tests online from any device at your convenience." }
    ]
  };

  const ourPromise = {
    title: "Our Promise to Students",
    content: "We promise high-quality mock tests that truly reflect real exam patterns. Every student on PrepZon gets access to well-structured practice tests, detailed performance insights, and a reliable platform to track progress and improve with confidence. Our goal is simple - help you practice smarter, manage time better, and perform at your best on exam day."
  };

  const ourImpact = {
    title: "Our Impact",
    content: "Thousands of mock tests attempted and growing. Students using PrepZon have improved their speed, accuracy, and exam confidence by regularly practicing with realistic test simulations and detailed analytics. PrepZon is becoming a trusted practice platform for entrance-exam aspirants across streams."
  };

  const joinCommunity = {
    title: "Join the PrepZon Community",
    content: "Join a growing community of exam aspirants who believe that consistent practice is the key to success. With PrepZon, you don’t just attempt tests-you understand your performance and improve with every attempt.",
    quote: "🎯 PrepZon-Practice More. Analyze Better. Perform Confidently."
  };

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="py-10 min-h-[40vh] flex items-center -mt-16 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg mx-auto max-w-4xl">
            <div className="flex justify-center mb-6">
              <img
                src="/Final.png"
                alt="PrepZon Logo"
                className="h-20 w-auto mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-orange-500">
              About PrepZon
            </h1>
            <div className="text-left md:text-center text-sm md:text-lg text-black max-w-4xl mx-auto space-y-6">
              <p>
                <span className="font-semibold">PrepZon</span> is a next-generation EdTech platform focused exclusively on providing high-quality, exam-oriented mock tests for college entrance examinations. Our platform helps students assess their preparation level, understand real exam patterns, and improve performance through structured practice and detailed analysis.
              </p>
              <p>
                We currently offer mock tests designed for major Engineering, Medical, Law, and Management entrance exams such as <span className="font-semibold text-orange-600">AP EAPCET</span> (Engineering, Agriculture & Pharmacy streams), <span className="font-semibold text-orange-600">JEE Main & Advanced</span>, <span className="font-semibold text-orange-600">NEET UG & PG</span>, <span className="font-semibold text-orange-600">CAT</span>, <span className="font-semibold text-orange-600">MAT</span>, <span className="font-semibold text-orange-600">GATE</span>, <span className="font-semibold text-orange-600">CLAT</span>, <span className="font-semibold text-orange-600">AILET</span>, and more - closely aligned with actual exam standards.
              </p>
            </div>
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
              {whatWeOffer.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {whatWeOffer.items.map((item, index) => (
              <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                <div className="bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                </div>
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
            <p className="text-xl md:text-2xl font-bold italic text-orange-700">
              "{joinCommunity.quote}"
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