const db = require('../../config/db');

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const safeJsonStringify = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return null;
  }
};

const normalizeBoolean = (value) => {
  if (value === true || value === 1 || value === '1') {
    return true;
  }

  if (typeof value === 'string') {
    return ['true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  return false;
};

const buildCoordinatesValue = (coordinates, latitude, longitude) => {
  if (typeof coordinates === 'string' && coordinates.trim()) {
    return coordinates.trim();
  }

  const lat = normalizeNumber(latitude);
  const lng = normalizeNumber(longitude);

  if (lat !== null && lng !== null) {
    return `${lat}, ${lng}`;
  }

  return null;
};

exports.saveLocation = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const {
      latitude,
      longitude,
      address,
      accuracy,
      timestamp,
      googleMapsUrl,
      googleMapsNavigateUrl,
      coordinates,
      metadata,
      savedToDatabase,
    } = req.body || {};

    const lat = normalizeNumber(latitude);
    const lng = normalizeNumber(longitude);

    if (lat === null || lng === null) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const locationAddress = typeof address === 'string' ? address.trim() : null;
    const accuracyValue = normalizeNumber(accuracy);
    const capturedAt = timestamp ? new Date(timestamp) : new Date();
    const capturedAtValue = Number.isNaN(capturedAt.getTime()) ? new Date() : capturedAt;
    const coordinatesValue = buildCoordinatesValue(coordinates, lat, lng);
    const googleMapsUrlValue = typeof googleMapsUrl === 'string' && googleMapsUrl.trim()
      ? googleMapsUrl.trim()
      : `https://maps.google.com/maps?q=${lat},${lng}`;
    const googleMapsNavigateUrlValue = typeof googleMapsNavigateUrl === 'string' && googleMapsNavigateUrl.trim()
      ? googleMapsNavigateUrl.trim()
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const metadataJson = safeJsonStringify(metadata);
    const savedToDatabaseValue = normalizeBoolean(savedToDatabase);

    const updateResult = await db.promise().query(
      `
        UPDATE user_locations
        SET
          latitude = ?,
          longitude = ?,
          address = ?,
          accuracy = ?,
          coordinates = ?,
          google_maps_url = ?,
          google_maps_navigate_url = ?,
          metadata = ?,
          captured_at = ?,
          saved_to_database = ?,
          updated_by = ?,
          deleted_at = NULL,
          version = version + 1
        WHERE user_id = ?
      `,
      [
        lat,
        lng,
        locationAddress,
        accuracyValue,
        coordinatesValue,
        googleMapsUrlValue,
        googleMapsNavigateUrlValue,
        metadataJson,
        capturedAtValue,
        savedToDatabaseValue ? 1 : 0,
        userId,
        userId,
      ]
    );

    if (updateResult[0].affectedRows === 0) {
      try {
        await db.promise().query(
          `
            INSERT INTO user_locations (
              user_id,
              latitude,
              longitude,
              address,
              accuracy,
              coordinates,
              google_maps_url,
              google_maps_navigate_url,
              metadata,
              captured_at,
              saved_to_database,
              created_by,
              updated_by,
              deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
          `,
          [
            userId,
            lat,
            lng,
            locationAddress,
            accuracyValue,
            coordinatesValue,
            googleMapsUrlValue,
            googleMapsNavigateUrlValue,
            metadataJson,
            capturedAtValue,
            savedToDatabaseValue ? 1 : 0,
            userId,
            userId,
          ]
        );
      } catch (insertError) {
        if (insertError?.code === 'ER_DUP_ENTRY') {
          await db.promise().query(
            `
              UPDATE user_locations
              SET
                latitude = ?,
                longitude = ?,
                address = ?,
                accuracy = ?,
                coordinates = ?,
                google_maps_url = ?,
                google_maps_navigate_url = ?,
                metadata = ?,
                captured_at = ?,
                saved_to_database = ?,
                updated_by = ?,
                deleted_at = NULL,
                version = version + 1
              WHERE user_id = ?
            `,
            [
              lat,
              lng,
              locationAddress,
              accuracyValue,
              coordinatesValue,
              googleMapsUrlValue,
              googleMapsNavigateUrlValue,
              metadataJson,
              capturedAtValue,
              savedToDatabaseValue ? 1 : 0,
              userId,
              userId,
            ]
          );
        } else {
          throw insertError;
        }
      }
    }

    const [rows] = await db.promise().query(
      `
        SELECT
          id,
          user_id,
          latitude,
          longitude,
          address,
          accuracy,
          coordinates,
          google_maps_url,
          google_maps_navigate_url,
          metadata,
          captured_at,
          saved_to_database,
          created_at,
          updated_at
        FROM user_locations
        WHERE user_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId]
    );

    const location = rows[0] || null;

    return res.json({
      success: true,
      message: 'Location saved successfully',
      data: {
        location: location
          ? {
              id: location.id,
              userId: location.user_id,
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
              address: location.address,
              accuracy: location.accuracy !== null ? Number(location.accuracy) : null,
              coordinates: location.coordinates,
              googleMapsUrl: location.google_maps_url,
              googleMapsNavigateUrl: location.google_maps_navigate_url,
              metadata: location.metadata,
              capturedAt: location.captured_at,
              savedToDatabase: Boolean(location.saved_to_database),
              createdAt: location.created_at,
              updatedAt: location.updated_at,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Save location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

exports.getMyLocation = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const [rows] = await db.promise().query(
      `
        SELECT
          id,
          user_id,
          latitude,
          longitude,
          address,
          accuracy,
          coordinates,
          google_maps_url,
          google_maps_navigate_url,
          metadata,
          captured_at,
          saved_to_database,
          created_at,
          updated_at
        FROM user_locations
        WHERE user_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId]
    );

    const location = rows[0] || null;

    return res.json({
      success: true,
      data: {
        location: location
          ? {
              id: location.id,
              userId: location.user_id,
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
              address: location.address,
              accuracy: location.accuracy !== null ? Number(location.accuracy) : null,
              coordinates: location.coordinates,
              googleMapsUrl: location.google_maps_url,
              googleMapsNavigateUrl: location.google_maps_navigate_url,
              metadata: location.metadata,
              capturedAt: location.captured_at,
              savedToDatabase: Boolean(location.saved_to_database),
              createdAt: location.created_at,
              updatedAt: location.updated_at,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get my location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
