import { QuickStartGuide } from "./QuickStartGuide";

interface QuickStartGuideComponentProps {
  guide: QuickStartGuide;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickStartGuideComponent({
  guide,
  isOpen,
  onClose,
}: QuickStartGuideComponentProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative p-8 overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex items-center mb-4 space-x-3">
          <span className="text-3xl">
            {guide.icon ? (
              <i className={`lucide-${guide.icon.toLowerCase()}`}></i>
            ) : (
              "📖"
            )}
          </span>
          <h2 className="text-2xl font-bold">{guide.title}</h2>
        </div>
        <p className="text-gray-700 mb-2">{guide.description}</p>
        <div className="mb-4 text-xs text-gray-500 space-x-2">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {guide.difficulty}
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            {guide.estimatedTime}
          </span>
        </div>
        <ol className="mb-6 space-y-6">
          {guide.steps.map((step) => (
            <li key={step.id} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
              <p className="mb-1">{step.description}</p>
              {step.action && (
                <div className="mb-1">
                  <span className="font-semibold">Action:</span>
                  <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                    {step.action}
                  </pre>
                </div>
              )}
              {step.code && (
                <div className="mb-1">
                  <span className="font-semibold">Code Example:</span>
                  <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">
                    {step.code}
                  </pre>
                </div>
              )}
              {step.note && (
                <div className="text-blue-700 text-xs mb-1">💡 {step.note}</div>
              )}
              {step.warning && (
                <div className="text-yellow-700 text-xs mb-1">
                  ⚠️ {step.warning}
                </div>
              )}
            </li>
          ))}
        </ol>
        {guide.tips && guide.tips.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Tips</h4>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {guide.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        {guide.troubleshooting && guide.troubleshooting.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Troubleshooting</h4>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {guide.troubleshooting.map((t, i) => (
                <li key={i}>
                  <strong>{t.problem}:</strong> {t.solution}
                </li>
              ))}
            </ul>
          </div>
        )}
        {guide.nextSteps && guide.nextSteps.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {guide.nextSteps.map((ns, i) => (
                <li key={i}>{ns}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
