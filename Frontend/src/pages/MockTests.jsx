import { Link } from 'react-router-dom';

export default function MockTests() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Mock Tests</h1>
        <p className="mt-4 text-gray-600 text-lg">
          Prepare for placements and competitive exams with company-wise mock tests.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl shadow-sm border bg-white hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-3">Free Mock Tests</h2>
          <p className="text-gray-600 mb-4">
            Access a limited set of free mock tests for different companies and sections.
          </p>
          <Link
            to="/auth"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign In to Explore
          </Link>
        </div>

        <div className="p-6 rounded-2xl shadow-sm border bg-white hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-3">Paid Mock Tests</h2>
          <p className="text-gray-600 mb-4">
            Unlock all tests, detailed analytics, and performance tracking with a premium account.
          </p>
          <Link
            to="/auth"
            className="inline-block px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Upgrade Now
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 text-center bg-gray-50 rounded-xl border">
            <h3 className="font-semibold text-lg">1. Choose Company</h3>
            <p className="text-gray-600 mt-2">
              Browse from IT Services, Product, Banking, and more.
            </p>
          </div>
          <div className="p-6 text-center bg-gray-50 rounded-xl border">
            <h3 className="font-semibold text-lg">2. Take Section-wise Test</h3>
            <p className="text-gray-600 mt-2">
              Aptitude, Reasoning, Technical and more sections included.
            </p>
          </div>
          <div className="p-6 text-center bg-gray-50 rounded-xl border">
            <h3 className="font-semibold text-lg">3. Get Detailed Results</h3>
            <p className="text-gray-600 mt-2">
              Instant grading, section-wise analytics, and pass/fail evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-gray-700 mb-4">
          Ready to test your skills? Sign in to start practicing.
        </p>
        <Link
          to="/auth"
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
