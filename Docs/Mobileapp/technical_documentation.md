# GDKChit Mobile Application — Full Technical Documentation

> **Application Name**: GDKChit  
> **Package / App ID**: `com.gdkchit.app`  
> **Platform**: React Native (Android & iOS)  
> **Core Framework**: React Native 0.82.1 | React 19.1.1  
> **Production API Base**: `https://api.fund.gowthamcd.in/api`  
> **Production WebSocket Gateway**: `wss://api.fund.gowthamcd.in/api/auction`  
> **Output Release APK**: `android/app/build/outputs/apk/release/app-release.apk`  

---

## Table of Contents
1. [Architecture & System Design](#1-architecture--system-design)
2. [Technology Stack & Key Dependencies](#2-technology-stack--key-dependencies)
3. [Project Directory & File Structure](#3-project-directory--file-structure)
4. [App Boot Sequence & Routing Engine](#4-app-boot-sequence--routing-engine)
5. [Authentication & Session Lifecycle](#5-authentication--session-lifecycle)
6. [Hardware Biometrics & Security Lock](#6-hardware-biometrics--security-lock)
7. [Real-Time WebSocket Auction Engine](#7-real-time-websocket-auction-engine)
8. [GPS & Geolocation Subsystem](#8-gps--geolocation-subsystem)
9. [Multi-Language Localization](#9-multi-language-localization)
10. [REST API Service Layer Reference](#10-rest-api-service-layer-reference)
11. [User & Admin Screen Modules](#11-user--admin-screen-modules)
12. [Release Build, Packaging & Troubleshooting](#12-release-build-packaging--troubleshooting)

---

## 1. Architecture & System Design

GDKChit is architected as an enterprise-grade Chit Fund Management mobile application featuring dual-role experiences (User and Admin) within a unified codebase.

```
                                  ┌───────────────────────────────┐
                                  │            App.jsx            │
                                  │  Providers: Language, Auth,   │
                                  │       Auction, Biometric      │
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
      ┌───────────────────────┐                                         ┌─────────────────────┐
      │  SecurityLockScreen   │                                         │    Router.jsx       │
      │  (Biometric/Passcode) │                                         │(Native Stack Nav v7)│
      └───────────────────────┘                                         └──────────┬──────────┘
                                                                                   │
                 ┌────────────────────────────────┬────────────────────────────────┴───────────────┐
                 ▼                                ▼                                                ▼
       ┌────────────────────┐          ┌────────────────────┐                            ┌────────────────────┐
       │   Fronter / Auth   │          │   User Flow (Tabs) │                            │  Admin Flow (Tabs) │
       │ - Splash           │          │ - Home             │                            │ - Dashboard        │
       │ - Welcome          │          │ - Portfolio        │                            │ - Reports          │
       │ - Login            │          │ - Chat             │                            │ - Chat             │
       │ - AuthLoader       │          │ - Profile          │                            │ - Settings         │
       └────────────────────┘          └──────────┬─────────┘                            └──────────┬─────────┘
                                                  │                                                 │
                                                  └────────────────────────┬────────────────────────┘
                                                                           ▼
                                                        ┌─────────────────────────────────────┐
                                                        │     Shared Services & Utilities     │
                                                        │ - ApiService (REST / JWT Intercept) │
                                                        │ - AuctionWebSocketService (Live WS) │
                                                        │ - BiometricService (Native Keyring) │
                                                        │ - LocationService (GPS / Geofence)  │
                                                        └──────────────────┬──────────────────┘
                                                                           ▼
                                                        ┌─────────────────────────────────────┐
                                                        │   Backend (api.fund.gowthamcd.in)   │
                                                        └─────────────────────────────────────┘
```

---

## 2. Technology Stack & Key Dependencies

| Dependency | Version | Architectural Responsibility |
|:---|:---|:---|
| **react** | `19.1.1` | Declarative UI component engine |
| **react-native** | `0.82.1` | Native bridge runtime for Android and iOS |
| **@react-navigation/native** | `^7.1.19` | Top-level routing state machine |
| **@react-navigation/native-stack** | `^7.6.1` | Native hardware-accelerated screen transitions |
| **@react-navigation/bottom-tabs** | `^7.7.2` | Persistent bottom tab navigation for User and Admin |
| **@react-native-async-storage/async-storage** | `^2.2.0` | Secure local storage for tokens and profile cache |
| **react-native-biometrics** | `^3.0.1` | Native biometric prompt (Fingerprint, Face ID, Device PIN fallback) |
| **@react-native-community/geolocation** | `^3.4.0` | High-accuracy device GPS tracking and coordinate resolution |
| **expo-print** & **expo-sharing** | `^15.0.8` / `^14.0.8` | Dynamic HTML generation to PDF and native document share sheets |
| **react-native-audio-recorder-player** | `^3.6.14` | Audio capture and playback for in-app chat voice messaging |
| **react-native-image-crop-picker** | `^0.51.1` | Camera/gallery image selection and cropping for KYC and avatars |
| **@react-native-documents/picker** | `^12.0.2` | Document attachment picker for identity verification |
| **lottie-react-native** | `^7.3.4` | Hardware-accelerated vector animations |
| **react-native-paper** | `^5.14.5` | Material Design UI component primitives |
| **react-native-vector-icons** | `^10.3.0` | MaterialCommunityIcons iconography set |
| **zustand** | `^5.0.14` | Lightweight state management |

---

## 3. Project Directory & File Structure

```plaintext
GDKChit/
├── App.jsx                     # Root component with Providers & Security Lock wrapper
├── index.js                    # Entry point registered with AppRegistry
├── package.json                # Project dependencies and script declarations
├── metro.config.js             # Metro bundler configuration with SVG transformer
├── android/                    # Native Android Gradle project (C++ codegen, CMake, NDK)
└── src/
    ├── config/                 # Location and application configuration constants
    ├── services/
    │   ├── ApiService.js       # Central REST API client with auto-refresh & block interceptors
    │   ├── AuctionWebSocketService.js # Low-latency live auction WebSocket manager
    │   ├── BiometricService.js # Native hardware biometrics & AppState inactivity lock
    │   └── locationService.js  # Android runtime permission & GPS coordinates collector
    ├── utils/
    │   ├── AuthContext.js      # Global authentication provider and hook (useAuth)
    │   ├── AuctionContext.jsx  # Global live auction alert listener (useAuctionContext)
    │   ├── LanguageContext.js  # Multi-language localization engine and hook (useLanguage)
    │   ├── authLoader.js       # Session boot validator & role-based router
    │   ├── env.js              # Environment endpoints (API_URL)
    │   └── navigation.js       # Navigation container reference for headless redirects
    ├── components/
    │   ├── Routes/Routes.jsx   # Top-level Stack Navigator definition
    │   ├── Tab/
    │   │   ├── UTab/UserTab.jsx    # User bottom tabs (Home, Portfolio, Chat, Profile, More)
    │   │   └── ATab/AdminTab.jsx   # Admin bottom tabs (Dashboard, Reports, Chat, Settings, More)
    │   └── GlobalAuctionModal/ # App-wide instant alert modal for incoming live auctions
    └── pages/
        ├── Fronter/            # Splash, Welcome, and Login screens
        ├── User/               # User pages, modals, KYC, auctions, and banking
        └── Admin/              # Admin dashboard, reports, user control, and group managers
```

---

## 4. App Boot Sequence & Routing Engine

```
[ App Launch ]
      │
      ▼
[ BiometricService.init() ] ──► If app locked ──► [ SecurityLockScreen ]
      │ (Unlocked)                                       │ (Authenticated)
      ▼                                                  ▼
[ Splash.jsx ]
      │
      ▼
[ AuthLoader.js ] ──── Reads accessToken & refreshToken from AsyncStorage
      │
      ├──► Token Missing ────────────────────────► Navigate: "Welcome" ─► "Login"
      │
      └──► Token Exists ─────────────────────────► Calls GET /auth/profile
             │
             ├──► Success (Role: "Admin") ───────► Navigate: "AdminTabs"
             ├──► Success (Role: "User") ────────► Navigate: "UserTabs"
             └──► 401 / Failed Refresh ──────────► Clear Tokens ─► Navigate: "Welcome"
```

1. **`App.jsx` Guard**: Before displaying navigation, `BiometricService` checks if device security is configured. If active and the app has been in the background for $>5$ minutes, the app displays `SecurityLockScreen`.
2. **`Splash.jsx`**: Displays branded loading screen with animated logo.
3. **`AuthLoader.js`**:
   - Queries `AsyncStorage` for cached credentials.
   - Verifies session authenticity against `GET /auth/profile`.
   - Dispatches user directly to their respective role tab bar without flashing unauthenticated screens.

---

## 5. Authentication & Session Lifecycle

### Hardware-Backed Keystore / Keychain Token Management (`SecureStorage.js`)
- Tokens are stored using **`react-native-keychain`** leveraging hardware-backed Android Keystore / iOS Keychain:
  - `accessToken`: Short-lived JWT Bearer token used in the HTTP `Authorization` header.
  - `refreshToken`: Long-lived token used to rotate access tokens without user re-authentication.
  - **Auto-Migration**: On app startup, `SecureStorage` automatically detects legacy plaintext tokens in `AsyncStorage`, writes them securely into the hardware Keystore, and deletes them from `AsyncStorage`.
  - Accessible mode is configured with `Keychain.ACCESSIBLE.WHEN_UNLOCKED` to ensure tokens are inaccessible when the device is locked.

### Automated 401 Token Refresh Interceptor
When any HTTP call fails with status `401 Unauthorized`:
1. `ApiService.makeRequest()` intercepts the failure.
2. It retrieves the stored `refreshToken` from `SecureStorage` and sends a POST request to `${API_URL}/auth/refresh-token`.
3. If successful, new tokens are persisted in Keychain and the original request is replayed with the new access token.
4. If the refresh token is expired or revoked, session data is cleared via `SecureStorage.clearTokens()`, and the user is redirected to the login flow.

### Global Account Block Handling (`403 Forbidden`)
If an administrator blocks a member while they are using the mobile app:
1. Subsequent API requests receive a `403 Forbidden` response containing `{ "message": "...blocked..." }`.
2. `ApiService` immediately purges local session storage and Keystore:
   ```javascript
   await SecureStorage.clearTokens();
   await AsyncStorage.multiRemove([
     'userPhone', 'userName', 'userRole', 'userLoginMethod'
   ]);
   ```
3. A non-cancellable native alert displays:
   > *"Your account has been blocked by an administrator. Please contact the admin."*
4. Pressing **OK** triggers an immediate reset to the `Welcome` screen.

---

## 6. Hardware Biometrics & Screen Protection (`FLAG_SECURE`)

### 1. Hardware Biometrics (`BiometricService.js`)
- Native biometrics configuration with device passcode fallback:
  ```javascript
  const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
  ```
- **Preference Synchronization**: Fetches `securityEnabled` from `GET /user/preferences` with a 1500ms timeout race.
- **AppState Inactivity Tracking**: Evaluates if background duration $> 5$ minutes (`(Date.now() - backgroundTime) > 300000ms`), locking the app and rendering `SecurityLockScreen`.

### 2. Window Protection via `FLAG_SECURE` (`ScreenSecurityModule.kt` & `ScreenSecurity.js`)
- Protects confidential financial information on sensitive screens:
  - **KYC Verification** (`IdentityVerification.jsx`)
  - **Bank Account Linking** (`LinkBankAccount.jsx`)
  - **Financial Ledger & Passbook** (`Portfolio.jsx`)
- Prevents screenshots and screen recording by setting `WindowManager.LayoutParams.FLAG_SECURE` on Android.
- Masks screen contents in the Android recent task manager preview to prevent visual eavesdropping.
- Activated via the `useSecureScreen()` React lifecycle hook.

---

## 7. Real-Time WebSocket Auction Engine

Live auctions require high reliability and tamper-proof server-side enforcement.

### Endpoint & First-Frame Authentication
- **Clean Gateway**: `wss://api.fund.gowthamcd.in/api/auction`
- **Security**: The JWT token and credentials are **NEVER passed in the URL query string**, preventing token leakage in proxy, firewall, and server access logs.
- **First-Frame Auth**: Immediately after the socket handshake succeeds, the client sends an encrypted authentication frame:
  ```json
  {
    "type": "auth",
    "data": { "token": "<JWT>", "userId": "12", "userType": "user" }
  }
  ```
  The server verifies the JWT against `JWT_SECRET` and binds the verified role and user ID to the session.

### Server-Side Bid Validation & Integrity Enforcement
Bids are strictly validated on the server. The client clock and client-supplied identities are never trusted:
1. **Server Clock**: All bid timestamps are generated using server-side `Date.now()`.
2. **Session Verification**: The bidder identity is resolved from the server's authenticated `clientSessions` map, preventing user ID spoofing.
3. **Idempotency Key**: Each bid generates a unique idempotency key (`${userId}-${groupId}-${timestamp}-${rand}`). Duplicate bids caused by network retries are dropped automatically.
4. **Eligibility Restrictions**:
   - **Past Winner Check**: Queries `group_auction_winners` to ensure the user has not won in a previous cycle for this group.
   - **Defaulter Check**: Queries `monthly_collections` for overdue installments (`status = 'overdue'`); ineligible members are blocked from bidding.
5. **Minimum Bid Decrement**: Enforces a minimum bid step (`MIN_BID_STEP = ₹500`). Bids higher than `currentLowest - 500` are rejected with descriptive feedback.

### Network Resilience & Reconnection (`@react-native-community/netinfo`)
- **No 5-Attempt Limit**: The client does not terminate attempts mid-auction. It employs persistent exponential backoff (1.5s, 2.25s, 3.37s, 5s, 8s, 8s...).
- **Network Change Detection**: Uses `NetInfo` to immediately trigger reconnect as soon as network connectivity is restored.
- **AppState Resume**: Triggers instant reconnect when the app transitions back to the foreground.
- **Reconnecting Banner**: Broadcasts `connection_state_change` events, rendering an in-auction status banner informing the user when connection recovery is underway.

### Event Protocol:
| Event Name | Direction | Payload & Purpose |
|:---|:---|:---|
| `auction_created_alert` | Server $\rightarrow$ Client | Notifies all connected members that an admin opened an auction room |
| `join_auction` | Client $\rightarrow$ Server | Joins the specific room for a chit group auction |
| `bid_placed` | Client $\rightarrow$ Server | Submits a new bid amount |
| `bid_update` | Server $\rightarrow$ Client | Broadcasts updated highest bid to all room participants |
| `auction_ended` | Server $\rightarrow$ Client | Announces the winning bidder, winning bid amount, and dividend |

### Global Alert Trigger (`AuctionContext.jsx` & `GlobalAuctionModal.jsx`)
`AuctionProvider` maintains a background connection at the root application level. Upon receiving `auction_created_alert`, it mounts `GlobalAuctionModal` on top of any active screen, providing users immediate one-tap navigation to the live bidding hall.

---

## 8. GPS & Geolocation Subsystem

Implemented in `src/services/locationService.js`:

### Android Runtime Permissions
1. Verifies if `PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION` is granted.
2. If absent, triggers native runtime permission prompt.
3. If denied, provides fallback user messaging detailing the requirement.

### Location Retrieval Specification:
```javascript
const defaultOptions = {
  enableHighAccuracy: true,    // Uses GPS hardware satellites
  timeout: 30000,              // 30-second ceiling for satellite lock
  maximumAge: 60000,           // Re-uses cached fix if < 1 minute old
  showLocationDialog: true,    // Prompts user to toggle GPS if disabled
  forceRequestLocation: true,  // Overrides power saving mode
};
```

### Use Cases:
- **Member Location Verification**: Attaches verified GPS coordinates during agent collections and KYC onboarding.
- **Office Location / Navigation**: Provides users exact distance and directions to the chit fund office.
- **Admin Field Tracking**: Visualizes user location coordinates in the Admin console.

---

## 9. Multi-Language Localization

The application includes multi-language support managed by `LanguageContext.js`:

1. **Translations Matrix**: Stored in `src/utils/translations/` (e.g., English, Tamil).
2. **Context Hook**: Components use the `useLanguage()` hook:
   ```javascript
   const { t, language, changeLanguage } = useLanguage();
   return <Text>{t('home.balance')}</Text>;
   ```
3. **Persistence**: The selected language is stored in `AsyncStorage` (`appLanguage`) and updated on the backend server (`PUT /user/preferences`), ensuring continuity across devices.

---

## 10. REST API Service Layer Reference

All endpoints interface through `https://api.fund.gowthamcd.in/api`:

### 1. Authentication & Profile
- `POST /auth/login` — Phone and password login.
- `POST /auth/refresh-token` — Rotates access token using refresh token.
- `POST /auth/logout` — Invalidation of active refresh token.
- `GET /auth/profile` — Fetch current user profile.
- `PATCH /auth/profile` — Update user profile details.
- `GET /auth/nominee` — Fetch nominee data.
- `PATCH /auth/nominee` — Update nominee information.

### 2. User Preferences
- `GET /user/preferences` — Retrieve security lock, notification, and language settings.
- `PUT /user/preferences` — Persist modified preferences.

### 3. Chit Groups & Auctions
- `GET /groups` — List available and enrolled chit schemes.
- `POST /groups/join` — Request enrollment in a group.
- `GET /auctions/live` — Fetch currently ongoing auctions.
- `POST /auctions/bid` — Submit auction bid.

### 4. Admin Management
- `POST /admin/users` — Onboard new user.
- `PATCH /admin/users/:id/block` — Block/unblock user access.
- `POST /admin/groups` — Create new chit fund group.
- `GET /admin/reports` — Generate ledger and transaction balance sheets.

---

## 11. User & Admin Screen Modules

### User Module Hierarchy (`UserTabs.jsx`)
```plaintext
├── Home (Home.jsx)
│   ├── Quick Balance Card & Financial Overview
│   ├── Active Chits Carousel & Progress
│   └── Recent Transactions & Upcoming Auctions Banner
├── Portfolio (Portfolio.jsx)
│   ├── Investment Summary (Total Invested, Total Won)
│   ├── Enrolled Chits Ledger & Payment History
│   └── Monthly Passbook Breakdown
├── Chat (ChatList.jsx)
│   ├── Group Chat Rooms per Chit Group
│   ├── Direct Admin Support Messaging
│   └── Audio / Voice Message Recording
└── Profile (Profile.jsx)
    ├── UserAccountDetails (Account editing)
    ├── LinkBankAccount (Bank details & IFSC)
    ├── Nominee (Nominee registration)
    ├── Verification (Identity & KYC document upload)
    ├── SecurityPermision (Biometrics & PIN toggles)
    ├── LanguageSettings (English / Regional switch)
    ├── OTPRequests (Transaction approval codes)
    └── HelpAndSupport & PrivacyPolicy
```

### Admin Module Hierarchy (`AdminTab.jsx`)
```plaintext
├── Dashboard (Dashboard.jsx)
│   ├── Gross Chit Turnover & Total Volume
│   ├── Monthly Collection Progress Meter
│   └── Active Defaulter Alerts & Member Counts
├── Reports (Reports.jsx)
│   ├── Member-wise Chit Ledgers
│   ├── Installment Collection Summaries
│   └── Export to PDF / CSV (via expo-print & expo-sharing)
├── Chat (ChatList.jsx)
│   ├── Broadcast Announcements
│   └── Individual Member Queries
└── Settings (setting.jsx)
    ├── CreateGroup (Chit value, months, commission, slots)
    ├── ManageGroups (Member roster, slot reassignments)
    ├── BlockUser (Instant session revocation)
    ├── Auction (Start & manage live bidding hall)
    ├── UserLocation (GPS coordinate audit map)
    └── PasswordManagement & Security Permissions
```

---

## 12. Release Build, Packaging & Troubleshooting

### Generating Release APK
The production APK is built using the Gradle wrapper in `android/`:

```powershell
# 1. Navigate to android directory
cd "D:\DEVELOPMENT PROJECT\personal project\FUND-APP\GDKChit\android"

# 2. Build release bundle
./gradlew assembleRelease
```

### Output File
- **APK Path**: `D:\DEVELOPMENT PROJECT\personal project\FUND-APP\GDKChit\android\app\build\outputs\apk\release\app-release.apk`
- **File Size**: ~41.4 MB

### Common Build Issues & Resolutions

| Issue Encountered | Root Cause | Solution |
|:---|:---|:---|
| **AAPT: failed to read PNG signature** | WebP or corrupted image renamed as `.png` in assets folder | Re-encode asset as genuine 8-bit PNG using PowerShell image processing |
| **CMake: Ninja process locked `.cxx`** | Lingering background compiler processes holding directory locks | Kill Java, Ninja, and Clang processes; remove `app/.cxx` folder; rerun `./gradlew assembleRelease` |
| **Daemon connection failed** | Too many stale Gradle daemons running concurrently | Run `./gradlew --stop` before starting a fresh clean build |

---

## 13. Real-Time Auction Experience Architecture

```
[ Mobile App Client ]                          [ Backend WebSocket Server ]
         │                                                    │
         ├──── check_eligibility { groupId } ───────────────>│ 
         │                                                    │ (Queries group_auction_winners & monthly_collections)
         │<─── eligibility_status { isEligible, reason } ─────┤
         │                                                    │
         ├──── set_auto_bid { floorAmount, enabled: true } ──>│ (Registers proxy bidder in auction.autoBidders)
         │                                                    │
         ├──── place_bid { amount, idempotencyKey } ─────────>│
         │                                                    │ (Validates: server clock, bid decrement >= ₹500)
         │                                                    │ (Anti-sniping check: if remainingTime <= 30s)
         │                                                    │  └─ duration += 30s
         │<─── bid_placed { antiSnipingExtended: true, ... } ─┤ (Broadcasts to all group participants)
         │                                                    │
         │                                                    │ (Auto-bid loop executes proxy bids for other members)
         │                                                    │
         │<─── auction_ended { winner, summary } ─────────────┤ (Calculates dividend pool, per-member dividend)
```

### 1. Server-Synced Countdown & Anti-Sniping Protection
- **Server Clock Authority**: Clients never decrement time based purely on local clocks. The backend broadcasts periodic `time_update` frames.
- **Anti-Sniping Engine**: When any valid bid is accepted with `remainingTime <= 30s`, the backend extends `auction.duration` by 30 seconds and broadcasts `antiSnipingExtended: true` with the new clock value. The mobile UI pulses an interactive purple banner alert: *"+30s Anti-Sniping Extension Activated!"*.

### 2. Live Bid History, Participants & Eligibility Verification
- **Eligibility Filter**: Upon connecting, clients trigger `check_eligibility`. The backend inspects:
  1. `group_auction_winners`: Checks if the subscriber has already prized in this group cycle.
  2. `monthly_collections`: Verifies whether any monthly collection installment has status `'overdue'`.
  - Ineligible subscribers have their bid inputs disabled with clear advisory badges.
- **Segmented Bidding Stream**: The mobile bidding interface offers 3 real-time views:
  - **Live Leaderboard**: Sorted ascending (lowest prize money bid first).
  - **Live History**: Chronological audit feed with exact microsecond timestamps.
  - **Active Members**: Real-time list of enrolled subscribers in the bidding room.

### 3. Automated Proxy Bidding (Auto-Bid)
- Members set a **Floor Prize Money Amount** (the lowest payout they will accept).
- When active, the server maintains the user's proxy in `auction.autoBidders`. Whenever an opponent places a lower bid, the server automatically decrements the bid by ₹500 on the member's behalf with a 1.2s realistic human delay until the floor is reached.

### 4. Post-Auction Settlement Engine
Upon auction conclusion, the backend and mobile client compute:
$$\text{Discount Amount} = \text{Total Chit Value} - \text{Winning Bid}$$
$$\text{Foreman Commission} = \text{Total Chit Value} \times 0.05 \quad (5\%)$$
$$\text{Net Dividend Pool} = \text{Discount Amount} - \text{Foreman Commission}$$
$$\text{Dividend Per Member} = \frac{\text{Net Dividend Pool}}{\text{Total Members (20)}}$$
$$\text{Next Installment} = \text{Base Monthly Installment} - \text{Dividend Per Member}$$

---

## 14. Chit-Specific Financial Tools Suite

### 1. Chit Simulator & ROI Calculator (`ChitSimulator.jsx`)
- **Dual-Perspective Financial Engine**:
  - **Borrower Mode**: Simulates cash payout received in month $M$ against expected bid discount. Computes effective borrowing APR and demonstrates total cash saved compared to bank personal loans (14-16% APR).
  - **Investor Mode**: Calculates cumulative monthly dividend accrual and net profit at month 20 maturity.
- **Interactive Controls**: Presets (₹1L, ₹2L, ₹3L, ₹5L), month selector chips (M1-M20), discount percentage steppers.

### 2. Prized vs. Non-Prized Surety Tracker (`PrizedSuretyTracker.jsx`)
- **Portfolio-Wide Status Badges**: Differentiates Prized Winners (`[🏆 Prized Winner]`) from Non-Prized Subscribers (`[⏳ Non-Prized Subscriber]`).
- **Guarantor & Surety Management**:
  - Implements compliance requirements under Section 31 of the Chit Funds Act, 1982.
  - Digital surety form capturing 2 verifiable guarantors (Relationship, Phone, Occupation, Monthly Income, ID proofs).
  - Promissory agreement confirmation and foreman verification workflow.

### 3. Due-Date Calendar (`DueCalendar.jsx`)
- **Cross-Group Timeline**: Aggregates upcoming installments across all subscribed chit groups.
- **Dynamic Settlement**: Displays Gross Monthly Amount, Auction Dividend Deduction, and Net Payable with live status indicators (`Paid`, `Upcoming`, `Due Today`, `Overdue`).
- **Direct Action**: Integrated one-touch payment recording.

### 4. E-Sign & Digital Document Vault (`DocumentVault.jsx`)
- **Digital Chit Agreement E-Sign**:
  - Renders statutory terms under Chit Funds Act, 1982.
  - Legal E-Sign modal capturing subscriber signature with cryptographic timestamp.
- **PDF Generation & Export**:
  - Powered by `expo-print` and `expo-sharing`.
  - Generates verifiable PDF receipts and formal Chit Agreements directly on-device with zero cloud print latency.

---

## 15. Push Notification & Critical Alert Infrastructure (FCM + Native Channels)

### 1. Problem Solved
In standard WebSocket implementations, when an app is killed by Android OS battery optimization or backgrounded during screen lock, socket connections terminate immediately. This caused subscribers to miss live auctions, fail to bid in time, or miss critical payment due dates and dividend announcements.

### 2. High-Importance Notification Architecture
The push notification pipeline combines server-side event dispatching with native Android notification channels:

```
[Auction Started / Payment Due / Concluded]
                   │
                   ▼
  Backend: fcmPushService.js
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
Firebase FCM Server    Direct MySQL Audit Log
(fcm.googleapis.com)    (notifications table)
         │
         ▼ (High Priority FCM Push)
Android Device (Killed / Background / Active)
         │
         ▼
  GdkNotificationModule (Kotlin)
  ├── Channel: "gdk_auctions" (IMPORTANCE_HIGH, Heads-up banner, Vibration, Custom Sound)
  ├── Channel: "gdk_payments" (IMPORTANCE_HIGH, Emerald LED, Reminder Sound)
  └── Channel: "gdk_announcements" (IMPORTANCE_DEFAULT)
         │
         ▼ (User taps notification banner)
MainActivity (PendingIntent with Extras)
         │
         ▼
PushNotificationService (React Native)
  ├── Cold Start: getInitialNotification()
  ├── Warm Background: DeviceEventEmitter ('onNotificationOpened')
  └── Direct Deep Link Routing:
        ├── "AuctionScreen" (groupId) -> Opens live bidding room instantly
        ├── "DueCalendar" -> Opens installment calendar with payment action
        └── "PrizedSuretyTracker" -> Displays post-auction dividend summary
```

### 3. Server-Side Push Dispatcher (`fcmPushService.js`)
- **`sendAuctionStartAlert(groupId, initialAmount)`**: High-priority alert triggered automatically upon `startAuction`. Wakes up all enrolled subscribers' devices.
- **`sendAuctionResultAlert(groupId, winner, summary)`**: Broadcasts winner identity, winning bid, and exact calculated member dividend accrual to all participants.
- **`sendPaymentDueAlert(userId, groupName, amount, dueDateStr, daysLeft)`**: Sends targeted payment reminder.
- **`sendDailyPaymentDueAlerts()`**: Background 12-hour scheduler scanning `monthly_collections` for pending/overdue collections (3 days advance, due today, overdue).
- **`sendBroadcastAnnouncement(title, message, targetGroupId)`**: Admin broadcast tool with multi-group filtering.

### 4. Client Native Channel Specifications
- **`gdk_auctions`**:
  - `importance`: `NotificationManager.IMPORTANCE_HIGH`
  - `vibrationPattern`: `[0, 400, 200, 400, 200, 400]` (Distinct double-pulse urgency alert)
  - `category`: `NotificationCompat.CATEGORY_ALARM`
  - `lightColor`: `#6B46C1` (Royal Purple)
- **`gdk_payments`**:
  - `importance`: `NotificationManager.IMPORTANCE_HIGH`
  - `vibrationPattern`: `[0, 300, 150, 300]`
  - `category`: `NotificationCompat.CATEGORY_REMINDER`
  - `lightColor`: `#10B981` (Emerald Green)
- **`gdk_announcements`**:
  - `importance`: `NotificationManager.IMPORTANCE_DEFAULT`
  - `lightColor`: `#3B82F6` (Electric Blue)

### 5. Runtime Permission & Token Synchronization
- **Android 13+ (API 33+)**: Automatically prompts for `android.permission.POST_NOTIFICATIONS` runtime permission.
- **Auto-Sync**: Tying hardware device token with authenticated `userId` on backend (`POST /api/user/fcm-token`) upon both initial launch and user login/profile reload.