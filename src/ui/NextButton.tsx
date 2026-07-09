import { IconButton } from './IconButton';
import { ChevronRight } from './icons';

export function NextButton({ onNext }: { onNext: () => void }) {
  return (
    <IconButton label="Next photo" onClick={onNext} variant="espresso">
      <ChevronRight size={24} />
    </IconButton>
  );
}
