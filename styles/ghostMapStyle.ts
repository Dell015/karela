export const ghostMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "on" }, { "saturation": -100 }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];
/**
 * Guild map theme, unlocked by the Bayanihan Heart badge (12_guilds.sql):
 * the same dark map with green-black land, teal parks and deep-teal water,
 * from the Karela palette. Android only, like ghostMapStyle (Apple Maps on
 * iOS has no custom styles).
 */
export const bayanihanMapStyle = [
  ...ghostMapStyle,
  { "elementType": "geometry", "stylers": [{ "color": "#111813" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#17211A" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1E2B22" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0E3B2E" }] },
];
