package com.gdkchit

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicInteger

class GdkNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val notificationIdCounter = AtomicInteger(1000)

    companion object {
        const val MODULE_NAME = "GdkNotification"
        // Versioned channel IDs (Android channels are immutable once created)
        const val CHANNEL_AUCTIONS = "gdk_auctions_v2"
        const val CHANNEL_PAYMENTS = "gdk_payments_v2"
        const val CHANNEL_ANNOUNCEMENTS = "gdk_announcements_v2"

        private var instance: GdkNotificationModule? = null
        private var pendingIntentData: WritableMap? = null

        fun handleNotificationIntent(intent: Intent?) {
            if (intent == null) return
            val extras: Bundle = intent.extras ?: return

            if (extras.getBoolean("from_gdk_notification", false) || extras.containsKey("screen")) {
                val data = Arguments.createMap()
                for (key in extras.keySet()) {
                    val value = extras.get(key)
                    when (value) {
                        is String -> data.putString(key, value)
                        is Int -> data.putInt(key, value)
                        is Boolean -> data.putBoolean(key, value)
                        is Double -> data.putDouble(key, value)
                        is Long -> data.putDouble(key, value.toDouble())
                        null -> {}
                        else -> data.putString(key, value.toString())
                    }
                }

                instance?.emitEvent("onNotificationOpened", data) ?: run {
                    pendingIntentData = data
                }
            }
        }
    }

    init {
        instance = this
        createNotificationChannels()
    }

    override fun getName(): String = MODULE_NAME

    private fun emitEvent(eventName: String, params: Any?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        }
    }

    /**
     * Create versioned notification channels with explicit sounds, vibration, and lights.
     * Deletes legacy channels if present.
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Clean up old unversioned channels
            try {
                notificationManager.deleteNotificationChannel("gdk_auctions")
                notificationManager.deleteNotificationChannel("gdk_payments")
                notificationManager.deleteNotificationChannel("gdk_announcements")
            } catch (e: Exception) {
                // Ignore if not present
            }

            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .build()

            // 1. Live Auction Alerts Channel v2 (High Importance, Urgent Vibration, Purple LED, Heads-up)
            val auctionChannel = NotificationChannel(
                CHANNEL_AUCTIONS,
                "Live Auction Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority alerts when chit auctions go live, bidding starts, or concludes."
                enableLights(true)
                lightColor = Color.parseColor("#6B46C1") // Purple
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 400, 200, 400, 200, 400)
                setSound(defaultSoundUri, audioAttributes)
            }

            // 2. Payment Reminders Channel v2 (High Importance, Emerald LED)
            val paymentChannel = NotificationChannel(
                CHANNEL_PAYMENTS,
                "Payment Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for chit fund installment due dates, payouts, and receipt confirmations."
                enableLights(true)
                lightColor = Color.parseColor("#10B981") // Emerald Green
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 150, 300)
                setSound(defaultSoundUri, audioAttributes)
            }

            // 3. Announcements Channel v2 (Default Importance, Blue LED)
            val announcementChannel = NotificationChannel(
                CHANNEL_ANNOUNCEMENTS,
                "Announcements & Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General chit fund announcements, notices, and dividend updates."
                enableLights(true)
                lightColor = Color.parseColor("#3B82F6") // Blue
                setSound(defaultSoundUri, audioAttributes)
            }

            notificationManager.createNotificationChannels(
                listOf(auctionChannel, paymentChannel, announcementChannel)
            )
        }
    }

    @ReactMethod
    fun displayNotification(
        title: String,
        message: String,
        channelId: String?,
        data: ReadableMap?,
        promise: Promise
    ) {
        try {
            val targetChannel = when (channelId) {
                CHANNEL_AUCTIONS, "gdk_auctions" -> CHANNEL_AUCTIONS
                CHANNEL_PAYMENTS, "gdk_payments" -> CHANNEL_PAYMENTS
                else -> CHANNEL_ANNOUNCEMENTS
            }

            val context = reactContext.applicationContext
            val notificationId = notificationIdCounter.incrementAndGet()

            // Build launch intent
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("from_gdk_notification", true)
                putExtra("notification_id", notificationId)
                putExtra("title", title)
                putExtra("message", message)

                data?.let { readableMap ->
                    val iterator = readableMap.keySetIterator()
                    while (iterator.hasNextKey()) {
                        val key = iterator.nextKey()
                        when (readableMap.getType(key)) {
                            ReadableType.String -> putExtra(key, readableMap.getString(key))
                            ReadableType.Number -> putExtra(key, readableMap.getDouble(key).toString())
                            ReadableType.Boolean -> putExtra(key, readableMap.getBoolean(key))
                            else -> putExtra(key, readableMap.getString(key))
                        }
                    }
                }
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val smallIconResId = context.resources.getIdentifier(
                "ic_launcher",
                "mipmap",
                context.packageName
            ).let { if (it != 0) it else android.R.drawable.ic_dialog_info }

            // Using CATEGORY_EVENT / CATEGORY_REMINDER to comply with Play Store policies
            // (eliminates restricted USE_FULL_SCREEN_INTENT and CATEGORY_ALARM)
            val builder = NotificationCompat.Builder(context, targetChannel)
                .setSmallIcon(smallIconResId)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)

            if (targetChannel == CHANNEL_AUCTIONS) {
                builder.setCategory(NotificationCompat.CATEGORY_EVENT)
            } else if (targetChannel == CHANNEL_PAYMENTS) {
                builder.setCategory(NotificationCompat.CATEGORY_REMINDER)
            }

            val notificationManager = NotificationManagerCompat.from(context)
            notificationManager.notify(notificationId, builder.build())

            val result = Arguments.createMap()
            result.putInt("notificationId", notificationId)
            result.putBoolean("success", true)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        try {
            if (pendingIntentData != null) {
                val data = pendingIntentData
                pendingIntentData = null
                promise.resolve(data)
                return
            }

            val activity = reactContext.currentActivity
            val intent: Intent? = activity?.intent
            val extras: Bundle? = intent?.extras

            if (extras != null && (extras.getBoolean("from_gdk_notification", false) || extras.containsKey("screen"))) {
                val data = Arguments.createMap()
                for (key in extras.keySet()) {
                    val value = extras.get(key)
                    when (value) {
                        is String -> data.putString(key, value)
                        is Int -> data.putInt(key, value)
                        is Boolean -> data.putBoolean(key, value)
                        is Double -> data.putDouble(key, value)
                        is Long -> data.putDouble(key, value.toDouble())
                        null -> {}
                        else -> data.putString(key, value.toString())
                    }
                }

                intent.removeExtra("from_gdk_notification")
                intent.removeExtra("screen")

                promise.resolve(data)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val enabled = NotificationManagerCompat.from(reactContext).areNotificationsEnabled()
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Check if app is whitelisted from Android battery optimizations
     */
    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                val packageName = reactContext.packageName
                val isIgnoring = powerManager.isIgnoringBatteryOptimizations(packageName)
                promise.resolve(isIgnoring)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Prompt user to disable aggressive battery optimization for uninterrupted alerts
     */
    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val packageName = reactContext.packageName
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            // Fallback to generic battery optimization settings
            try {
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (fallbackError: Exception) {
                promise.reject("BATTERY_OPTI_ERROR", fallbackError.message)
            }
        }
    }

    /**
     * Launch manufacturer-specific background manager/autostart activity
     * for Xiaomi (MIUI/HyperOS), Oppo/Realme (ColorOS), Vivo (Funtouch), and Samsung.
     */
    @ReactMethod
    fun openOEMAutostartSettings(promise: Promise) {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val packageName = reactContext.packageName
        var launched = false

        val oemIntents = when {
            manufacturer.contains("xiaomi") || manufacturer.contains("redmi") || manufacturer.contains("poco") -> listOf(
                Intent().setComponent(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")),
                Intent().setComponent(ComponentName("com.miui.securitycenter", "com.miui.powercenter.PowerSettings"))
            )
            manufacturer.contains("oppo") || manufacturer.contains("realme") -> listOf(
                Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")),
                Intent().setComponent(ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")),
                Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"))
            )
            manufacturer.contains("vivo") || manufacturer.contains("iqoo") -> listOf(
                Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity")),
                Intent().setComponent(ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity")),
                Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"))
            )
            manufacturer.contains("samsung") -> listOf(
                Intent().setComponent(ComponentName("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity")),
                Intent().setComponent(ComponentName("com.samsung.android.sm", "com.samsung.android.sm.ui.battery.BatteryActivity"))
            )
            else -> emptyList()
        }

        for (intent in oemIntents) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                if (reactContext.packageManager.resolveActivity(intent, 0) != null) {
                    reactContext.startActivity(intent)
                    launched = true
                    break
                }
            } catch (e: Exception) {
                // Try next
            }
        }

        if (!launched) {
            // General Application Details fallback
            try {
                val appDetailsIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(appDetailsIntent)
                launched = true
            } catch (e: Exception) {
                promise.reject("OEM_LAUNCH_FAILED", e.message)
                return
            }
        }

        val result = Arguments.createMap()
        result.putBoolean("success", launched)
        result.putString("manufacturer", manufacturer)
        promise.resolve(result)
    }

    @ReactMethod
    fun getDeviceManufacturer(promise: Promise) {
        val result = Arguments.createMap()
        result.putString("manufacturer", Build.MANUFACTURER)
        result.putString("model", Build.MODEL)
        result.putInt("sdkInt", Build.VERSION.SDK_INT)
        promise.resolve(result)
    }

    @ReactMethod
    fun cancelNotification(id: Int, promise: Promise) {
        try {
            val notificationManager = NotificationManagerCompat.from(reactContext)
            notificationManager.cancel(id)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun cancelAllNotifications(promise: Promise) {
        try {
            val notificationManager = NotificationManagerCompat.from(reactContext)
            notificationManager.cancelAll()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ALL_ERROR", e.message)
        }
    }
}
