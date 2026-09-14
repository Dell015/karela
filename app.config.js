// app.config.js replaces app.json so we can read .env variables at build time.
// Expo loads this file before bundling and injects process.env from the shell
// environment (and from .env via the `env:` block in app.json / dotenv loading).
// Any EXPO_PUBLIC_* variable in .env is available here as process.env.EXPO_PUBLIC_*

export default {
  expo: {
    name: "karela",
    slug: "karela",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "karela",
    userInterfaceStyle: "automatic",

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.worshestershire.karela",
      config: {
        // Reads EXPO_PUBLIC_GOOGLE_MAPS_API_KEY from .env
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        UIBackgroundModes: ["location", "fetch", "remote-notification"],
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Karela tracks your race against the ghost even when the screen is locked.",
        NSLocationAlwaysUsageDescription:
          "Karela requires background location to sync your progress with the ghost runner.",
        NSLocationWhenInUseUsageDescription:
          "Karela uses your location to show your progress on the map.",
        NSCameraUsageDescription:
          "Karela uses your camera to capture photo proof for civic reports during your runs.",
        NSMotionUsageDescription:
          "Karela uses motion sensors to detect your running cadence and verify physical activity.",
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      config: {
        googleMaps: {
          // Reads EXPO_PUBLIC_GOOGLE_MAPS_API_KEY from .env
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      package: "com.worshestershire.karela",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
        "CAMERA",
        "ACTIVITY_RECOGNITION",
      ],
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" },
        },
      ],
      "expo-font",
      "expo-sqlite",
      "expo-notifications",
      "@react-native-community/datetimepicker",
      "expo-asset",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Karela tracks your race against the ghost even when the screen is locked.",
          locationAlwaysPermission:
            "Karela requires background location to sync your progress with the ghost runner.",
          locationWhenInUsePermission:
            "Karela uses your location to show your progress on the map.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-sensors",
        {
          motionPermission:
            "Karela uses motion sensors to detect your running cadence and verify physical activity.",
        },
      ],
      [
        "expo-image-picker",
        {
          cameraPermission:
            "Karela uses your camera to capture photo proof for civic reports.",
          photosPermission:
            "Karela needs photo access to attach images to civic reports.",
        },
      ],
      "expo-task-manager",
      "expo-image",
      "expo-status-bar",
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: "359c761a-0018-47f6-b179-f43ce8b0922a",
      },
    },
  },
};
