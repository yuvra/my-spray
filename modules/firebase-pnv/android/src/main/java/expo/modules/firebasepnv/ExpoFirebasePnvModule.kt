package expo.modules.firebasepnv

import android.app.Activity
import com.google.firebase.pnv.FirebasePhoneNumberVerification
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoFirebasePnvModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoFirebasePnv")

    AsyncFunction("enableTestSession") { token: String ->
      FirebasePhoneNumberVerification.getInstance().enableTestSession(token)
    }

    AsyncFunction("getVerificationSupportInfo") { promise: Promise ->
      FirebasePhoneNumberVerification.getInstance()
        .getVerificationSupportInfo()
        .addOnSuccessListener { list ->
          val result = list.map { info ->
            mapOf(
              "simSlot" to info.simSlot,
              "isSupported" to info.isSupported,
              "carrierId" to (info.carrierId ?: ""),
              "reason" to info.reason.name,
            )
          }
          promise.resolve(result)
        }
        .addOnFailureListener { e ->
          promise.reject("PNV_SUPPORT_ERROR", e.message, e)
        }
    }

    AsyncFunction("getVerifiedPhoneNumber") { promise: Promise ->
      val activity: Activity? = appContext.currentActivity
      if (activity == null) {
        promise.reject("PNV_ACTIVITY_REQUIRED", "App must be in foreground", null)
        return@AsyncFunction
      }

      FirebasePhoneNumberVerification.getInstance()
        .getVerifiedPhoneNumber(activity)
        .addOnSuccessListener { result ->
          promise.resolve(
            mapOf(
              "phoneNumber" to result.phoneNumber,
              "token" to result.token,
            ),
          )
        }
        .addOnFailureListener { e ->
          promise.reject("PNV_VERIFY_FAILED", e.message, e)
        }
    }
  }
}
