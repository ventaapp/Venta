# Venta Uygulaması ProGuard/R8 Kuralları
# Bu dosya production build'de kod küçültme ve obfuscation için kullanılır.

# =============================================
# Capacitor / WebView JavaScript Interface
# =============================================
# WebView ile JS arasındaki köprüyü koru
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Capacitor Bridge sınıflarını koru
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-dontwarn com.getcapacitor.**

# =============================================
# Firebase
# =============================================
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Auth
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# =============================================
# AndroidX / Support Library
# =============================================
-keep class androidx.** { *; }
-dontwarn androidx.**

# =============================================
# Genel Kurallar
# =============================================
# Stack trace için kaynak dosya adı ve satır numarası bilgisini koru
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Serializable sınıfları koru
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Enum sınıflarını koru
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# R sınıfını koru
-keepclassmembers class **.R$* {
    public static <fields>;
}
