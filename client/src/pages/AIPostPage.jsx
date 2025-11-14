import { useNavigate } from 'react-router-dom';
import AIPostGenerator from '../components/AIPostGenerator';

export default function AIPostPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                AI Post Generator
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/dual-publish')}
                className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition"
              >
                🎬 Dual Publisher
              </button>
              <button
                onClick={() => navigate('/oauth-config')}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                🔐 OAuth
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIPostGenerator />
      </main>
    </div>
  );
}
