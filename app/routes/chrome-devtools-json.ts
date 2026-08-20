// Chrome DevTools probes this URL on localhost. It is not an app route;
// returning 204 stops React Router from logging a noisy unmatched-route error.
export function loader() {
  return new Response(null, { status: 204 });
}
