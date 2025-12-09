export const STATUS_COLORS = {
  "Hidden Gem": "#4CAF50",
  "Overrated": "#FF5252",
  "Typical": "#FFC107"
};

export const getStatusBadge = (status) => {
  const styles = {
    "Hidden Gem": { bgcolor: STATUS_COLORS["Hidden Gem"], color: "white" },
    "Overrated": { bgcolor: STATUS_COLORS["Overrated"], color: "white" },
    "Typical": { bgcolor: STATUS_COLORS["Typical"], color: "black" }
  };
  return styles[status] || styles["Typical"];
};

export const getMarkerIcon = (status) => {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: STATUS_COLORS[status] || STATUS_COLORS["Typical"],
    fillOpacity: 0.9,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 10
  };
};

export const getStatusDescription = (status) => {
  const descriptions = {
    "Hidden Gem": "High quality, underground stuff!",
    "Overrated": "Not worth the hype...",
    "Typical": "Meets expectations for its popularity level"
  };
  return descriptions[status] || "";
};

export const geocodeAddress = (address) => {
  if (!window.google || !window.google.maps) {
    return Promise.reject(new Error("Google Maps not loaded"));
  }
  const geocoder = new window.google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        });
      } else {
        reject(new Error("Location not found"));
      }
    });
  });
};
