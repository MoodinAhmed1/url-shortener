import AnalyticsDisplay from '../../../components/AnalyticsDisplay';
import Link from 'next/link';

interface AnalyticsPageProps {
  params: {
    id: string;
  };
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = params;

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">URL Analytics</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Home
          </Link>
        </div>
        
        <AnalyticsDisplay shortId={id} />
      </div>
    </main>
  );
}