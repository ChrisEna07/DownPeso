import { FeedbackItem, FeedbackType } from '@/types';

/**
 * Dispara una notificación tipo toast con diseño especializado según su tipo (éxito, error, anuncio)
 */
export function showFeedback(item: {
  type: FeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}): void {
  if (typeof window === 'undefined') return;

  const fullItem: FeedbackItem = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    durationMs: 4000,
    ...item
  };

  window.dispatchEvent(
    new CustomEvent('downpeso:feedback', {
      detail: fullItem
    })
  );
}
