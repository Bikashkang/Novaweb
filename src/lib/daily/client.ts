const DAILY_API_KEY = process.env.NEXT_PUBLIC_DAILY_API_KEY;
const DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN || "novahdl.daily.co";
const DAILY_API_URL = "https://api.daily.co/v1";

export type DailyRoomConfig = {
  name: string;
  privacy: "public" | "private";
  properties: {
    enable_prejoin_ui: boolean;
    enable_knocking: boolean;
    enable_screenshare: boolean;
    enable_chat: boolean;
    exp?: number; // Unix timestamp for room expiration
  };
};

export type DailyRoom = {
  id: string;
  name: string;
  url: string;
  config: DailyRoomConfig["properties"];
};

export type DailyToken = {
  token: string;
};

/**
 * Create a Daily.co room for a video call
 */
export async function createDailyRoom(
  roomName: string,
  expirationTime?: number
): Promise<{ room: DailyRoom | null; error: string | null }> {
  if (!DAILY_API_KEY) {
    return { room: null, error: "Daily.co API key not configured" };
  }

  try {
    const config: DailyRoomConfig = {
      name: roomName,
      privacy: "private",
      properties: {
        enable_prejoin_ui: false, // Disable prejoin UI - we handle waiting room ourselves
        enable_knocking: false, // No knocking needed - we control admission
        enable_screenshare: true, // Allow screen sharing
        enable_chat: false, // We have our own chat
        ...(expirationTime && { exp: expirationTime }),
      },
    };

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      return { room: null, error: `Failed to create room: ${error}` };
    }

    const room = await response.json();
    return { room, error: null };
  } catch (error) {
    return {
      room: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a Daily.co room token for joining
 */
export async function getDailyToken(
  roomName: string,
  userId: string,
  isOwner: boolean = false
): Promise<{ token: string | null; error: string | null }> {
  if (!DAILY_API_KEY) {
    return { token: null, error: "Daily.co API key not configured" };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner,
          user_id: userId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { token: null, error: `Failed to get token: ${error}` };
    }

    const data = await response.json();
    return { token: data.token, error: null };
  } catch (error) {
    return {
      token: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a Daily.co room
 */
export async function deleteDailyRoom(
  roomName: string
): Promise<{ error: string | null }> {
  if (!DAILY_API_KEY) {
    return { error: "Daily.co API key not configured" };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { error: `Failed to delete room: ${error}` };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get room configuration
 */
export async function getDailyRoom(
  roomName: string
): Promise<{ room: DailyRoom | null; error: string | null }> {
  if (!DAILY_API_KEY) {
    return { room: null, error: "Daily.co API key not configured" };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { room: null, error: `Failed to get room: ${error}` };
    }

    const room = await response.json();
    return { room, error: null };
  } catch (error) {
    return {
      room: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


