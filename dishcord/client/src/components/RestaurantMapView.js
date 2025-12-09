import React, { useMemo } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Paper, Box, Typography, CircularProgress } from "@mui/material";
import { getMarkerIcon } from "../utils/mapUtils";

const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 200px)",
  minHeight: "500px"
};

export default function RestaurantMapView({ 
  isLoaded, 
  center, 
  zoom, 
  restaurants, 
  hoveredRestaurant,
  onMarkerClick, 
  onMarkerHover, 
  onMapLoad, 
  onMapUnmount 
}) {
  const hoveredData = useMemo(() => {
    if (!hoveredRestaurant) return null;
    return restaurants.find(r => r.business_id === hoveredRestaurant);
  }, [hoveredRestaurant, restaurants]);

  if (!isLoaded) {
    return (
      <Paper elevation={3} sx={{ overflow: "hidden", borderRadius: 2 }}>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading map...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ overflow: "hidden", borderRadius: 2 }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false
        }}
      >
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.business_id}
            position={{
              lat: parseFloat(restaurant.latitude),
              lng: parseFloat(restaurant.longitude)
            }}
            icon={getMarkerIcon(restaurant.dishcord_status)}
            onClick={() => onMarkerClick(restaurant)}
            onMouseOver={() => onMarkerHover(restaurant.business_id)}
            onMouseOut={() => onMarkerHover(null)}
            title={restaurant.name}
          />
        ))}

        {hoveredData && (
          <InfoWindow
            position={{
              lat: parseFloat(hoveredData.latitude),
              lng: parseFloat(hoveredData.longitude)
            }}
            onCloseClick={() => onMarkerHover(null)}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {hoveredData.name}
              </Typography>
              <Typography variant="caption">
                Click for details
              </Typography>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Paper>
  );
}
