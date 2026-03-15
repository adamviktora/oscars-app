import { onWinnerAnnounced, offWinnerAnnounced } from '@/lib/oscar-events';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(':ok\n\n'));

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(':heartbeat\n\n'));
      }, 30_000);

      const onWinner = (categorySlug: string) => {
        const data = JSON.stringify({ categorySlug });
        controller.enqueue(
          encoder.encode(`event: winner-announced\ndata: ${data}\n\n`)
        );
      };

      onWinnerAnnounced(onWinner);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        offWinnerAnnounced(onWinner);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
