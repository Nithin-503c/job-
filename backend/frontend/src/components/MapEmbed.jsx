// Renders a Google Maps embed pointing at the job's exact address (or
// lat/lng if we have it) so an accepted worker can navigate there. Uses the
// key-less "output=embed" search URL, so no Google Maps API key is needed.
export default function MapEmbed({ address, lat, lng }) {
  const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address || '');
  if (!query) return null;

  const src = `https://www.google.com/maps?q=${query}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <div className="map-embed-wrap">
      <iframe
        title="Job location"
        src={src}
        width="100%"
        height="260"
        style={{ border: 0, borderRadius: 8 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a className="btn btn-block" style={{ marginTop: 10, textAlign: 'center' }} href={directionsUrl} target="_blank" rel="noreferrer">
        Get directions
      </a>
    </div>
  );
}
