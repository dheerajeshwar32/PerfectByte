import { Link } from 'react-router-dom';

export default function Home() {
  const tools = [
    {
      id: 'target-compress',
      title: 'Target File Size',
      desc: 'Compress or expand an image to an exact byte size (e.g., exactly 200KB).',
      path: '/target-size',
      iconColor: 'text-blue-500' 
    },
    {
      id: 'bulk-compress',
      title: 'Bulk Compress Images',
      desc: 'Reduce the filesize of your document while keeping visual quality.',
      path: '/bulk-compress',
      iconColor: 'text-green-500'
    },
    {
      id: 'ai-assistant',
      title: 'AI File Assistant',
      desc: 'Just type what you need — "make this smaller", "compress to 100KB" — and let AI handle it.',
      path: '/assistant',
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Every tool you need to work with images in one place
        </h1>
        <p className="text-xl text-gray-600">
          All the tools you need to compress, crop, convert, and resize images. 
          100% secure and processed locally on your device.
        </p>
      </div>

      {/* iLovePDF Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {tools.map((tool) => (
          <Link 
            key={tool.id} 
            to={tool.path}
            className="block bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 cursor-pointer group"
          >
            <div className={`w-12 h-12 mb-4 rounded-lg bg-gray-50 flex items-center justify-center ${tool.iconColor}`}>
               {/* Placeholder for an SVG icon */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
              {tool.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {tool.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
