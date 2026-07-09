from geoalchemy2.shape import to_shape
from shapely.geometry import Point
from geoalchemy2 import WKTElement


def point_from_coords(latitude: float, longitude: float) -> WKTElement:
    """PostGIS stores POINT(lng lat) — longitude first. This is the #1 gotcha."""
    return WKTElement(Point(longitude, latitude).wkt, srid=4326)


def coords_from_point(geom) -> tuple[float, float]:
    """Returns (latitude, longitude) from a PostGIS geometry column value."""
    shape = to_shape(geom)
    return shape.y, shape.x  # y=lat, x=lng
