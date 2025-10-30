import React, { useEffect } from "react";
import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "./ScoreBadge";
import useFeedbackStore, { type Category, type Feedback } from "stores/feedbackStores";

const emptyCategory = (): Category => ({ score: 0, tips: [] });

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 69 ? "text-green-600" : score > 49 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="resume-summary px-4 py-2">
      <div className="category flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-2xl font-semibold">{title}</p>
          <ScoreBadge score={score} />
        </div>

        <p className="text-2xl">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback?: Feedback }) => {

  const setFeedback = useFeedbackStore((s) => s.setFeedback);

  const overall = useFeedbackStore((s) => s.feedback?.overallScore ?? 0);
  const tone = useFeedbackStore((s) => s.feedback?.toneAndStyle ?? emptyCategory());
  const content = useFeedbackStore((s) => s.feedback?.content ?? emptyCategory());
  const structure = useFeedbackStore((s) => s.feedback?.structure ?? emptyCategory());
  const skills = useFeedbackStore((s) => s.feedback?.skills ?? emptyCategory());

  useEffect(() => {
    if (feedback) setFeedback(feedback);
  }, [feedback, setFeedback]);

  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row max-sm:flex-col items-center p-4 gap-8">
        <ScoreGauge score={overall} />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            This score is calculated based on the variables listed below.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <Category title="Tone & Style" score={tone.score} />
        <Category title="Content" score={content.score} />
        <Category title="Structure" score={structure.score} />
        <Category title="Skills" score={skills.score} />
      </div>
    </div>
  );
};

export default Summary;
