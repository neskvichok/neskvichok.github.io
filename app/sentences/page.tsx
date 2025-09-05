import { SentenceGeneratorComponent } from '@/components/sentence-generator/SentenceGenerator';

export default function SentencesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-nice py-8">
        <SentenceGeneratorComponent />
      </div>
    </div>
  );
}
