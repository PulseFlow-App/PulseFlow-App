import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WORK_ROUTINE_QUESTIONS } from './questions';
import { addCheckIn } from './store';
import type { Question, QuestionResponse } from './types';
import styles from './WorkRoutine.module.css';

export function WorkRoutineCheckIn() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});

  const question = WORK_ROUTINE_QUESTIONS[currentIndex];
  const isLast = currentIndex === WORK_ROUTINE_QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / WORK_ROUTINE_QUESTIONS.length) * 100;

  const handleSelect = (q: Question, optionValue: string, _optionText: string, score: number) => {
    setResponses((prev) => ({
      ...prev,
      [q.id.toString()]: { questionId: q.id, selectedOption: optionValue, score },
    }));
  };

  const handleNext = () => {
    if (!question || !responses[question.id.toString()]) return;
    if (isLast) {
      const answers: Record<string, string> = {};
      WORK_ROUTINE_QUESTIONS.forEach((q) => {
        const r = responses[q.id.toString()];
        if (r) {
          const opt = q.options.find((o) => o.value === r.selectedOption);
          answers[q.id.toString()] = opt?.text ?? r.selectedOption;
        }
      });
      addCheckIn(responses, answers);
      navigate('/dashboard/work-routine', { replace: true });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!question) return null;

  return (
    <div className={styles.page}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <header className={styles.header}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <p className={styles.step}>
          Question {currentIndex + 1} of {WORK_ROUTINE_QUESTIONS.length}
        </p>
        <p className={styles.questionText}>{question.question}</p>
        <div className={styles.options}>
          {question.options.map((opt) => {
            const selected = responses[question.id.toString()]?.selectedOption === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(question, opt.value, opt.text, opt.score)}
              >
                {opt.text}
              </button>
            );
          })}
        </div>
      </main>
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNext}
          disabled={!responses[question.id.toString()]}
        >
          {isLast ? 'Complete Check-in' : 'Next'}
        </button>
      </div>
    </div>
  );
}
