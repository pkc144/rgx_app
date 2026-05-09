# Add project specific ProGuard rules here.

# --- React Native Core ---
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# --- Hermes ---
-keep class com.facebook.hermes.unicode.** { *; }
-keep class org.webkit.** { *; }

# --- SoLoader ---
-keep class com.facebook.soloader.** { *; }

# --- OkHttp / Okio (used by many RN modules) ---
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okio.** { *; }

# --- Firebase ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# --- Razorpay ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}

# --- Cashfree ---
-keep class com.cashfree.** { *; }
-dontwarn com.cashfree.**

# --- React Native Reanimated ---
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# --- React Native Gesture Handler ---
-keep class com.swmansion.gesturehandler.** { *; }

# --- React Native Screens ---
-keep class com.swmansion.rnscreens.** { *; }

# --- React Native SVG ---
-keep class com.horcrux.svg.** { *; }

# --- React Native Config ---
-keep class com.lugg.RNCConfig.** { *; }

# --- React Native Vector Icons ---
-keep class com.oblador.vectoricons.** { *; }

# --- Notifee ---
-keep class io.invertase.notifee.** { *; }
-dontwarn io.invertase.notifee.**

# --- React Native WebView ---
-keep class com.reactnativecommunity.webview.** { *; }

# --- React Native Linear Gradient ---
-keep class com.BV.LinearGradient.** { *; }

# --- React Native Device Info ---
-keep class com.learnium.RNDeviceInfo.** { *; }

# --- React Native IAP ---
-keep class com.dooboolab.rniap.** { *; }

# --- React Native Permissions ---
-keep class com.zoontek.rnpermissions.** { *; }

# --- React Native Safe Area Context ---
-keep class com.th3rdwave.safeareacontext.** { *; }

# --- React Native Pager View ---
-keep class com.reactnativepagerview.** { *; }

# --- Lottie ---
-keep class com.airbnb.lottie.** { *; }
-dontwarn com.airbnb.lottie.**

# --- Google Sign-In ---
-keep class com.google.android.gms.auth.** { *; }

# --- Prevent stripping of JS interface methods ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- General: keep native module classes ---
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.uimanager.SimpleViewManager { *; }

# --- Prevent R8 from stripping serializable classes ---
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# --- Keep BuildConfig ---
-keep class com.rgx.aq.BuildConfig { *; }

# --- Jackson / jsonwebtoken / JAXB (missing on Android) ---
-dontwarn java.beans.ConstructorProperties
-dontwarn java.beans.Transient
-dontwarn javax.xml.bind.DatatypeConverter
-keep class io.jsonwebtoken.** { *; }
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**
-dontwarn io.jsonwebtoken.**
