export interface OnboardingStepProps {
  /** Current step number, 1-indexed */
  currentStep: number;
  /** Total number of steps — defaults to 6 */
  totalSteps?: number;
  /** Override for the aria-label; auto-generated if omitted */
  label?: string;
  /** Extra Tailwind classes on the container */
  className?: string;
}

/**
 * NORA Design System — OnboardingStep.
 * Pill-based step indicator for onboarding flows of 1–N steps.
 * Active step renders as a wider pill; completed steps as smaller filled dots;
 * future steps as neutral empty dots.
 * Reports progress to screen readers via role="status" aria-label.
 */
export function OnboardingStep({
  currentStep,
  totalSteps = 6,
  label,
  className = '',
}: OnboardingStepProps) {
  const clamped = Math.min(Math.max(currentStep, 1), totalSteps);
  const ariaLabel = label ?? `Paso ${clamped} de ${totalSteps}`;

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={['flex items-center gap-2', className].filter(Boolean).join(' ')}
      data-testid="ui-onboarding-step"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const n = i + 1;
        const isCurrent = n === clamped;
        const isDone = n < clamped;

        return (
          <span
            key={n}
            aria-hidden="true"
            className={[
              'rounded-full transition-all duration-300 motion-reduce:transition-none',
              isCurrent
                ? 'w-6 h-2.5 bg-primary'
                : isDone
                  ? 'w-2.5 h-2.5 bg-primary/60'
                  : 'w-2.5 h-2.5 bg-neutral-300',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        );
      })}
    </div>
  );
}

export default OnboardingStep;
