DOMAIN = "sunflow"

CONF_BASE_URL = "base_url"
CONF_ADMIN_TOKEN = "admin_token"
CONF_SCAN_INTERVAL_SECONDS = "scan_interval_seconds"

DEFAULT_SCAN_INTERVAL_SECONDS = 30

# Default polling interval for the HA integration when the user has not configured options yet.
# 10s is responsive enough for automations/notifications.
DEFAULT_OPTIONS_SCAN_INTERVAL_SECONDS = 10

# Practical, UI-friendly choices for polling.
# 10s is a good default for automations/notifications without being too chatty.
SCAN_INTERVAL_CHOICES_SECONDS = [5, 10, 15, 30, 60]

# When running as a Home Assistant add-on, Sunflow listens on this internal port.
DEFAULT_LOCAL_ADDON_PORT = 3000

# Add-on slug as defined in the add-on's config.yaml
ADDON_SLUG = "sunflow"
