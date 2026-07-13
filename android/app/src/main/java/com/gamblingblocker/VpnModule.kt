package com.gamblingblocker

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VpnModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null
    private val VPN_REQUEST_CODE = 100

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "VpnModule"
    }

    @ReactMethod
    fun startVpn(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        val intent = VpnService.prepare(activity)
        if (intent != null) {
            pendingPromise = promise
            activity.startActivityForResult(intent, VPN_REQUEST_CODE)
        } else {
            // Permission already granted
            val serviceIntent = Intent(activity, VpnBlockerService::class.java)
            activity.startService(serviceIntent)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun stopVpn(promise: Promise) {
        val activity = currentActivity
        if (activity != null) {
            val serviceIntent = Intent(activity, VpnBlockerService::class.java)
            activity.stopService(serviceIntent)
        }
        promise.resolve(true)
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == VPN_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK) {
                val serviceIntent = Intent(activity, VpnBlockerService::class.java)
                activity?.startService(serviceIntent)
                pendingPromise?.resolve(true)
            } else {
                pendingPromise?.reject("PERMISSION_DENIED", "VPN permission denied")
            }
            pendingPromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {}
}
