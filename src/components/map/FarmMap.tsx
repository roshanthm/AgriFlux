import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import { area as turfArea } from '@turf/area';
import { center as turfCenter } from '@turf/center';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  lat: number;
  lon: number;
  onPlotDrawn: (lat: number, lon: number, areaInHectares: number, geojson?: any) => void;
  geojson?: any;
}

function MapDrawingAndSearch({ onPlotDrawn, initialGeojson }: { onPlotDrawn: (lat: number, lon: number, areaInHectares: number, geojson?: any) => void, initialGeojson?: any }) {
  const map = useMap();

  useEffect(() => {
    // Add GeoSearch
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'button',
      position: 'topleft',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Search location...'
    });
    map.addControl(searchControl);

    // Add Geoman controls
    map.pm.addControls({
      position: 'topright',
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawMarker: false,
      drawText: false,
      cutPolygon: false,
    });

    // Style for the polygons
    const polygonStyle = {
      color: '#10B981',
      weight: 3,
      opacity: 1,
      fillColor: '#10B981',
      fillOpacity: 0.2,
      dashArray: '5, 10'
    };

    // Clear existing layers if any
    map.eachLayer((layer: any) => {
      if (layer.pm && layer.pm.options && layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Load initial GeoJSON if provided
    if (initialGeojson) {
      const geoJsonLayer = L.geoJSON(initialGeojson, {
        style: polygonStyle
      });
      
      geoJsonLayer.eachLayer((layer: any) => {
        layer.addTo(map);
        
        // Listen for edit events on this loaded layer
        layer.on('pm:edit', () => {
          const updatedGeojson = layer.toGeoJSON();
          const areaSqMeters = turfArea(updatedGeojson);
          const areaHectares = areaSqMeters / 10000;
          const centerFeature = turfCenter(updatedGeojson);
          const [lon, lat] = centerFeature.geometry.coordinates;
          onPlotDrawn(lat, lon, areaHectares, updatedGeojson);
        });
      });
      
      // Fit bounds to the loaded geojson
      map.fitBounds(geoJsonLayer.getBounds());
    }

    // Listen for draw events
    map.on('pm:create', (e: any) => {
      const layer = e.layer;
      layer.setStyle(polygonStyle);
      
      // Remove other drawn layers to keep only one plot
      map.eachLayer((l: any) => {
        if (l.pm && l !== layer && l instanceof L.Polygon) {
          map.removeLayer(l);
        }
      });
      
      const updatePlotData = (l: any) => {
        const geojson = l.toGeoJSON();
        const areaSqMeters = turfArea(geojson);
        const areaHectares = areaSqMeters / 10000;
        
        const centerFeature = turfCenter(geojson);
        const [lon, lat] = centerFeature.geometry.coordinates;
        
        onPlotDrawn(lat, lon, areaHectares, geojson);
      };

      updatePlotData(layer);
      
      // Listen for edit events on this layer
      layer.on('pm:edit', () => {
        updatePlotData(layer);
      });
    });

    map.on('pm:remove', () => {
      onPlotDrawn(0, 0, 0, null);
    });

    return () => {
      map.removeControl(searchControl);
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map, initialGeojson]);

  return null;
}

function MapUpdater({ lat, lon, hasGeojson }: { lat: number; lon: number; hasGeojson: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon && !hasGeojson) {
      const currentCenter = map.getCenter();
      const newCenter = L.latLng(lat, lon);
      if (currentCenter.distanceTo(newCenter) > 500) {
        map.flyTo(newCenter, map.getZoom());
      }
    }
  }, [lat, lon, map, hasGeojson]);
  return null;
}

export default function FarmMap({ lat, lon, onPlotDrawn, geojson }: MapProps) {
  const defaultCenter: [number, number] = [20, 78]; // Default to India center
  const center: [number, number] = lat && lon ? [lat, lon] : defaultCenter;

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={lat ? 16 : 5} scrollWheelZoom={true} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapDrawingAndSearch onPlotDrawn={onPlotDrawn} initialGeojson={geojson} />
        <MapUpdater lat={lat} lon={lon} hasGeojson={!!geojson} />
      </MapContainer>
      
      {/* Custom Floating Controls Overlay */}
      <div className="absolute top-48 right-6 z-[1000] flex flex-col gap-2">
        <div className="glass p-1 rounded-xl flex flex-col gap-1 border-white/20 shadow-xl">
          <button 
            className="w-10 h-10 flex items-center justify-center text-gray-800 hover:text-emerald-accent transition-colors font-bold"
            onClick={() => {
              const zoomInBtn = document.querySelector('.leaflet-control-zoom-in') as HTMLElement;
              if (zoomInBtn) zoomInBtn.click();
            }}
          >
            +
          </button>
          <div className="h-px bg-gray-200 mx-2" />
          <button 
            className="w-10 h-10 flex items-center justify-center text-gray-800 hover:text-emerald-accent transition-colors font-bold"
            onClick={() => {
              const zoomOutBtn = document.querySelector('.leaflet-control-zoom-out') as HTMLElement;
              if (zoomOutBtn) zoomOutBtn.click();
            }}
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
