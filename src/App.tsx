import React from 'react';
import FaceFollowingMouse from './components/FaceFollowingMouse';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Interactive Face</h1>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <FaceFollowingMouse />
      </div>
      <p className="mt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Interactive Face Demo - Created with React
      </p>
      <div className="text-sm text-gray-500 mb-4">
      <a
        href="https://github.com/RDjarbeng/interactive_face_animation"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        View source on GitHub
      </a>
    </div>
    </div>
  );
}

export default App;