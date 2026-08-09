# Baraka Market — GitHub orqali avtomatik APK yasash

Bu papkada tayyor Android "o'rovchi" (wrapper) ilova bor — u sizning
saytingizni (Next.js loyihangizni) WebView ichida ochadi va oddiy telefon
ilovasi bo'lib ishlaydi. GitHub Actions orqali har safar push qilganingizda
avtomatik APK yasab beradi — Android Studio kerak emas.

## 1-qadam — Saytni internetga chiqaring (agar hali qilmagan bo'lsangiz)

APK — saytni ochadigan ilova, shuning uchun avval Next.js loyihangiz biror
manzilda ishlab turishi kerak (masalan Vercel'da).

## 2-qadam — Sayt manzilini ko'rsating

`android-app/app/src/main/res/values/strings.xml` faylini oching va
`site_url` qatorini o'z domeningizga almashtiring:

```xml
<string name="site_url">https://SIZNING-DOMENINGIZ.uz</string>
```

## 3-qadam — Fayllarni GitHub repongizga qo'shing

Ushbu papkadagi hamma narsani (`.github/` va `android-app/`) o'zingizning
`baraka-market` repongiz ildiziga (root) yuklang — xuddi avvalgi loyiha
fayllarini yuklaganingizdek, "Upload files" orqali yoki:

```bash
git add .github android-app QOLLANMA.md
git commit -m "Add Android APK build"
git push
```

## 4-qadam — APK'ni yuklab oling

1. GitHub'da repo ichida **Actions** bo'limiga o'ting
2. "Build APK" ishi (workflow) avtomatik ishga tushadi (yoki "Run workflow"
   tugmasi bilan qo'lda ishga tushiring)
3. Ish tugagach, pastda **Artifacts** qismidan `baraka-market-apk` faylini
   yuklab oling — ichida `app-debug.apk` bor, shuni telefoningizga
   o'rnatishingiz mumkin

## Eslatma

- Bu — sinov (debug) APK. Agar Play Store'ga chiqarmoqchi bo'lsangiz, keyinchalik
  imzolangan (signed) "release" versiyasi kerak bo'ladi — bu haqda alohida
  yordam bera olaman.
- Ilova nomi va rangini o'zgartirish uchun `strings.xml` va `themes.xml`
  fayllarini tahrirlang.
