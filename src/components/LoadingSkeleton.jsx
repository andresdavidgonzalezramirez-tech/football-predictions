import React from 'react';

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="card p-4 md:p-6 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* League and Time */}
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-6 w-32 rounded-full"></div>
            <div className="skeleton h-5 w-24"></div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between mb-4">
            {/* Home Team */}
            <div className="flex items-center space-x-3">
              <div className="skeleton w-12 h-12 md:w-16 md:h-16 rounded-full"></div>
              <div className="skeleton h-6 w-32 md:w-40"></div>
            </div>

            {/* VS */}
            <div className="skeleton h-8 w-12"></div>

            {/* Away Team */}
            <div className="flex items-center space-x-3">
              <div className="skeleton h-6 w-32 md:w-40"></div>
              <div className="skeleton w-12 h-12 md:w-16 md:h-16 rounded-full"></div>
            </div>
          </div>

          {/* Prediction Bar */}
          <div className="space-y-2">
            <div className="skeleton h-2 w-full rounded-full"></div>
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 w-24"></div>
              <div className="skeleton h-9 w-28 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
