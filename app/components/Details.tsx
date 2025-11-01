import React, { useEffect } from "react";
import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";
import ScoreBadge from "./ScoreBadge";
import useFeedbackStore, { type Category, type Feedback } from "stores/feedbackStores";

export const meta = () => ([
  { title: 'Resumind | Review' },
  { name: 'description', content: 'Log into your account!' },
])


const emptyCategory = (): Category => ({ score: 0, tips: [] });

const CategoryHeader = ({
  title,
  categoryScore,
}: {
  title: string;
  categoryScore: number;
}) => {
  return (
    <div className="flex flex-row gap-4 items-center py-2 justify-between w-full">
      <div className="flex items-center gap-4">
        <p className="text-2xl font-semibold">{title}</p>
        <ScoreBadge score={categoryScore} />
      </div>

      <div className="text-xl font-medium">
        <span
          className={
            categoryScore > 69
              ? "text-green-600"
              : categoryScore > 39
              ? "text-yellow-600"
              : "text-red-600"
          }
        >
          {categoryScore}
        </span>
        /100
      </div>
    </div>
  );
};

const CategoryContent = ({
  tips,
}: {
  tips: { type: "good" | "improve"; tip: string; explanation: string }[];
}) => {
  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4">
        {tips.map((tip, index) => (
          <div className="flex flex-row gap-2 items-center" key={index}>
            <img
              src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
              alt="score"
              className="size-5"
            />
            <p className="text-xl text-gray-500 ">{tip.tip}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full">
        {tips.map((tip, index) => (
          <div
            key={index + tip.tip}
            className={cn(
              "flex flex-col gap-2 rounded-2xl p-4",
              tip.type === "good"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            )}
          >
            <div className="flex flex-row gap-2 items-center">
              <img
                src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt="score"
                className="size-5"
              />
              <p className="text-xl font-semibold">{tip.tip}</p>
            </div>
            <p>{tip.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Details = ({ feedback }: { feedback?: Feedback }) => {

  const setFeedback = useFeedbackStore((s) => s.setFeedback);


  const tone = useFeedbackStore((s) => s.feedback?.toneAndStyle ?? emptyCategory());
  const content = useFeedbackStore((s) => s.feedback?.content ?? emptyCategory());
  const structure = useFeedbackStore((s) => s.feedback?.structure ?? emptyCategory());
  const skills = useFeedbackStore((s) => s.feedback?.skills ?? emptyCategory());

  useEffect(() => {
    if (feedback) setFeedback(feedback);
  }, [feedback, setFeedback]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <Accordion>
        <AccordionItem id="tone-style">
          <AccordionHeader itemId="tone-style">
            <CategoryHeader title="Tone & Style" categoryScore={tone.score} />
          </AccordionHeader>
          <AccordionContent itemId="tone-style">
            <CategoryContent tips={tone.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="content">
          <AccordionHeader itemId="content">
            <CategoryHeader title="Content" categoryScore={content.score} />
          </AccordionHeader>
          <AccordionContent itemId="content">
            <CategoryContent tips={content.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="structure">
          <AccordionHeader itemId="structure">
            <CategoryHeader title="Structure" categoryScore={structure.score} />
          </AccordionHeader>
          <AccordionContent itemId="structure">
            <CategoryContent tips={structure.tips} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="skills">
          <AccordionHeader itemId="skills">
            <CategoryHeader title="Skills" categoryScore={skills.score} />
          </AccordionHeader>
          <AccordionContent itemId="skills">
            <CategoryContent tips={skills.tips} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Details;
