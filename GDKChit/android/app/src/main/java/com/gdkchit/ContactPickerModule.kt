package com.gdkchit

import android.app.Activity
import android.content.Intent
import android.provider.ContactsContract
import com.facebook.react.bridge.*

class ContactPickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pickerPromise: Promise? = null
    private val PICK_CONTACT_REQUEST = 4920

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "ContactPickerModule"

    @ReactMethod
    fun pickContact(promise: Promise) {
        val currentAct = getCurrentActivity()
        if (currentAct == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity does not exist")
            return
        }

        this.pickerPromise = promise

        try {
            val intent = Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI)
            currentAct.startActivityForResult(intent, PICK_CONTACT_REQUEST)
        } catch (e: Exception) {
            pickerPromise?.reject("E_FAILED_TO_SHOW_PICKER", e)
            pickerPromise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != PICK_CONTACT_REQUEST) return

        if (pickerPromise == null) return

        if (resultCode != Activity.RESULT_OK || data == null) {
            pickerPromise?.reject("E_PICKER_CANCELLED", "User cancelled contact picker")
            pickerPromise = null
            return
        }

        val contactUri = data.data
        if (contactUri == null) {
            pickerPromise?.reject("E_NO_CONTACT_DATA", "No contact data received")
            pickerPromise = null
            return
        }

        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        )

        try {
            reactContext.contentResolver.query(contactUri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                    val numberIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

                    val name = if (nameIdx != -1) cursor.getString(nameIdx) else "Shared Contact"
                    val number = if (numberIdx != -1) cursor.getString(numberIdx) else ""

                    val result = Arguments.createMap()
                    result.putString("name", name)
                    result.putString("number", number)

                    pickerPromise?.resolve(result)
                } else {
                    pickerPromise?.reject("E_CONTACT_NOT_FOUND", "Could not find contact details")
                }
            }
        } catch (e: Exception) {
            pickerPromise?.reject("E_QUERY_FAILED", e)
        } finally {
            pickerPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}
}
