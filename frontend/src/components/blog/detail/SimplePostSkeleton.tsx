// Simple server-side skeleton component that doesn't use client-side utilities
const SimplePostSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="mb-6">
        <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="flex items-center gap-6 mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="h-64 md:h-96 bg-gray-200 rounded-xl mb-8 animate-pulse"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
};

export default SimplePostSkeleton;