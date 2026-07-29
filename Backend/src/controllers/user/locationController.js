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

exports.getAdminLocations = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.phone,
        ul.latitude, 
        ul.longitude,
        ul.address AS location_address,
        up.street_address,
        up.city,
        up.state,
        u.updated_at AS user_updated_at,
        ul.updated_at AS location_updated_at
      FROM users u
      LEFT JOIN user_locations ul ON u.id = ul.user_id AND ul.deleted_at IS NULL
      LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
      WHERE u.role = 'Admin' AND u.deleted_at IS NULL
    `;
    const [rows] = await db.promise().query(query);

    const coordinatePattern = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;

    const admins = rows.map(row => {
      // Priority fallback logic for address:
      // Check if location_address matches coordinates format or is empty.
      // If so, fall back to profile address parameters (street_address, city, state).
      let displayAddress = '';
      const hasGpsAddress = row.location_address && row.location_address.trim();
      const isCoordinatesGpsAddress = hasGpsAddress && coordinatePattern.test(row.location_address);

      if (hasGpsAddress && !isCoordinatesGpsAddress) {
        displayAddress = row.location_address.trim();
      } else {
        const profileParts = [row.street_address, row.city, row.state]
          .map(part => part ? part.trim() : '')
          .filter(part => part !== '');
        
        if (profileParts.length > 0) {
          displayAddress = profileParts.join(', ');
        } else if (hasGpsAddress) {
          displayAddress = row.location_address.trim();
        } else {
          displayAddress = 'No address provided';
        }
      }

      // Location field for display (typically City, State or fallback)
      let locationStr = '';
      if (row.city && row.state) {
        locationStr = `${row.city.trim()}, ${row.state.trim()}`;
      } else if (row.city) {
        locationStr = row.city.trim();
      } else if (row.state) {
        locationStr = row.state.trim();
      } else {
        locationStr = displayAddress;
      }

      return {
        id: row.id,
        name: row.name,
        phone: row.phone || 'N/A',
        location: locationStr,
        address: displayAddress,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        lastUpdated: row.location_updated_at || row.user_updated_at || new Date().toISOString()
      };
    });

    return res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get admin locations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

