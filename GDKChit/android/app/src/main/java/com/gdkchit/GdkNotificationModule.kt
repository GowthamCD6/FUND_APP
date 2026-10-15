package com.gdkchit

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
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
        const val CHANNEL_AUCTIONS = "gdk_auctions"
        const val CHANNEL_PAYMENTS = "gdk_payments"
        const val CHANNEL_ANNOUNCEMENTS = "gdk_announcements"

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

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .build()

            // 1. Live Auction Alerts Channel (Urgent, Heads-up banner, Sound & Vibration)
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

            // 2. Payment Reminders Channel (High Priority)
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

            // 3. Announcements Channel (Default Priority)
            val announcementChannel = NotificationChannel(
                CHANNEL_ANNOUNCEMENTS,
                "Announcements & Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General chit fund announcements, notices, and dividend updates."
                enableLights(true)
                lightColor = Color.parseColor("#3B82F6") // Blue
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
                CHANNEL_AUCTIONS -> CHANNEL_AUCTIONS
                CHANNEL_PAYMENTS -> CHANNEL_PAYMENTS
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
                builder.setCategory(NotificationCompat.CATEGORY_ALARM)
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
            // First check if pendingIntentData was received before JS module initialized
            if (pendingIntentData != null) {
                val data = pendingIntentData
                pendingIntentData = null
                promise.resolve(data)
                return
            }

            // Check current activity intent
            val activity = getCurrentActivity()
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

                // Consume intent so it does not trigger again
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
