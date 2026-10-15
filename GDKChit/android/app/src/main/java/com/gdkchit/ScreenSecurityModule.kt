package com.gdkchit

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenSecurityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "ScreenSecurity"

    @ReactMethod
    fun enableSecure() {
        val activity = getCurrentActivity()
        activity?.runOnUiThread {
            activity.window?.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    @ReactMethod
    fun disableSecure() {
        val activity = getCurrentActivity()
        activity?.runOnUiThread {
            activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
